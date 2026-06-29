import { Inject, Injectable } from '@nestjs/common';
import type { AvailabilitySlot } from '../../../scrape-core/types.js';
import { DatabaseService } from '../database/database.service.js';

// 수동 갱신 후보가 되는 studio_source 한 건과, 신선도/쿨다운 판정에 필요한 메타.
export interface RefreshTargetRow {
  id: string; // studio_source_id
  studio_id: string;
  source_id: string;
  source_code: string | null;
  url: string | null;
  external_key: string | null;
  studio_name: string;
  manual_updated_at: Date | null;
  last_scraped_at: Date | null; // 이 소스의 방들에서 가장 최근 slots.scraped_at
}

export interface MappedRoomRow {
  id: string;
  name: string;
  external_key: string;
}

interface SlotUpsertRow {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number | null;
  priceSource: string;
}

// 한 INSERT 당 행 수 (Postgres 파라미터 한도 대비 여유 있게 500). worker.ts 와 동일.
const SLOT_BATCH_SIZE = 500;

@Injectable()
export class RefreshRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  // 주어진 합주실들의 ACTIVE studio_sources 와 신선도/쿨다운 메타를 한 번에 가져온다.
  async findRefreshTargets(studioIds: number[]): Promise<RefreshTargetRow[]> {
    const result = await this.database.query<RefreshTargetRow>(
      `
      SELECT
        ss.id, ss.studio_id, ss.source_id, src.code AS source_code,
        ss.url, ss.external_key, st.name AS studio_name, ss.manual_updated_at,
        fresh.last_scraped_at
      FROM studio_sources ss
      INNER JOIN studios st ON st.id = ss.studio_id AND st.is_active = true
      INNER JOIN sources src ON src.id = ss.source_id AND src.is_active = true
      LEFT JOIN LATERAL (
        SELECT MAX(sl.scraped_at) AS last_scraped_at
        FROM room_sources rs
        INNER JOIN rooms r ON r.id = rs.room_id AND r.is_active = true
        INNER JOIN slots sl ON sl.room_id = r.id
        WHERE rs.source_id = ss.source_id
          AND r.studio_id = ss.studio_id
          AND rs.mapping_status = 'ACTIVE'
      ) fresh ON true
      WHERE ss.studio_id = ANY($1::bigint[])
        AND ss.mapping_status = 'ACTIVE'
      ORDER BY ss.studio_id ASC, ss.id ASC
    `,
      [studioIds],
    );
    return result.rows;
  }

  // 해당 소스의 external_key 가 매핑된(room_sources 가 있는) 활성 방만. worker.getMappedRooms 와 동일.
  async getMappedRooms(studioId: string, sourceId: string): Promise<MappedRoomRow[]> {
    const result = await this.database.query<MappedRoomRow>(
      `
      SELECT r.id, r.name, rs.external_key AS external_key
      FROM rooms r
      INNER JOIN room_sources rs ON rs.room_id = r.id AND rs.source_id = $2
      WHERE r.studio_id = $1
        AND r.is_active = true
        AND rs.mapping_status = 'ACTIVE'
        AND rs.external_key IS NOT NULL
      ORDER BY r.id ASC
    `,
      [studioId, sourceId],
    );
    return result.rows;
  }

  // worker.upsertSlots 와 동일한 멱등 upsert. roomIdByName 으로 방 이름→id 를 해소한다.
  async upsertSlots(
    slots: AvailabilitySlot[],
    roomIdByName: Map<string, string>,
  ): Promise<number> {
    // 같은 (room_id, date, start_time) 가 한 배치에 중복되면 ON CONFLICT 가 에러나므로
    // 키 기준 중복 제거(마지막 값 우선).
    const dedup = new Map<string, SlotUpsertRow>();
    for (const slot of slots) {
      const roomId = roomIdByName.get(slot.roomName);
      if (!roomId) continue;
      dedup.set(`${roomId}|${slot.date}|${slot.startTime}`, {
        roomId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        status: slot.status.toUpperCase(),
        price: slot.price,
        priceSource: slot.price !== null ? 'SCRAPED' : 'UNKNOWN',
      });
    }

    const rows = [...dedup.values()];
    for (let i = 0; i < rows.length; i += SLOT_BATCH_SIZE) {
      const batch = rows.slice(i, i + SLOT_BATCH_SIZE);
      const params: unknown[] = [];
      const tuples = batch.map((r, idx) => {
        const b = idx * 7;
        params.push(r.roomId, r.date, r.startTime, r.endTime, r.status, r.price, r.priceSource);
        return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, NOW())`;
      });
      await this.database.query(
        `
        INSERT INTO slots (room_id, date, start_time, end_time, status, price, price_source, scraped_at)
        VALUES ${tuples.join(', ')}
        ON CONFLICT (room_id, date, start_time) DO UPDATE SET
          end_time = EXCLUDED.end_time,
          status = EXCLUDED.status,
          price = EXCLUDED.price,
          price_source = EXCLUDED.price_source,
          scraped_at = EXCLUDED.scraped_at
      `,
        params,
      );
    }
    return rows.length;
  }

  // 수동 갱신 성공 시각 기록. manual_updated_at 은 쿨다운 기준, last_verified_at 은 운영 콘솔과 공유.
  async markManualUpdated(studioSourceId: string): Promise<void> {
    await this.database.query(
      `
      UPDATE studio_sources
      SET manual_updated_at = NOW(), last_verified_at = NOW()
      WHERE id = $1
    `,
      [studioSourceId],
    );
  }
}
