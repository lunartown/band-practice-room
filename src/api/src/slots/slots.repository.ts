import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface SlotRow {
  date: string;
  start_time: string;
  end_time: string;
  status: 'AVAILABLE';
  price: number | null;
  price_source: 'SCRAPED' | 'MANUAL' | 'UNKNOWN';
  scraped_at: Date;
  booking_url: string | null;
  studio_id: string;
  studio_name: string;
  studio_primary_area_id: string | null;
  studio_primary_area_name: string | null;
  studio_address: string | null;
  room_id: string;
  room_name: string;
  room_price_per_hour: number | null;
  room_capacity_min: number | null;
  room_capacity_max: number | null;
}

export interface TimeWindow {
  from: string;
  to: string;
}

export interface SlotFilters {
  dates: string[];
  areaIds?: number[];
  studioId?: number;
  timeWindows?: TimeWindow[];
  minCapacity?: number;
  minDuration?: number;
}

@Injectable()
export class SlotsRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async findSlots(filters: SlotFilters): Promise<SlotRow[]> {
    const minDuration = filters.minDuration ?? 1;
    const params: unknown[] = [filters.dates];

    const baseConditions = [
      'sl.date = ANY($1::date[])',
      "sl.status = 'AVAILABLE'",
      'r.is_active = true',
      's.is_active = true',
    ];

    if (filters.areaIds?.length) {
      params.push(filters.areaIds);
      baseConditions.push(`
        EXISTS (
          SELECT 1 FROM studio_areas sa
          WHERE sa.studio_id = s.id AND sa.area_id = ANY($${params.length}::int[])
        )
      `);
    }

    if (filters.studioId !== undefined) {
      params.push(filters.studioId);
      baseConditions.push(`s.id = $${params.length}`);
    }

    if (filters.timeWindows?.length) {
      // 윈도우 OR: 슬롯 시작 시각이 선택된 시간대 중 하나에 들어가면 통과.
      const ors: string[] = [];
      for (const window of filters.timeWindows) {
        const conditions: string[] = [];
        params.push(window.from);
        conditions.push(`sl.start_time >= $${params.length}::time`);
        if (window.to !== '24:00') {
          params.push(window.to);
          conditions.push(`sl.start_time < $${params.length}::time`);
        }
        ors.push(`(${conditions.join(' AND ')})`);
      }
      baseConditions.push(`(${ors.join(' OR ')})`);
    }

    if (filters.minCapacity !== undefined) {
      params.push(filters.minCapacity);
      baseConditions.push(`(r.capacity_max IS NULL OR r.capacity_max >= $${params.length})`);
    }

    params.push(minDuration);
    const durationParam = `$${params.length}`;

    // island_key: slots in the same consecutive run share the same value.
    // pos_in_island: 1-indexed position within that run.
    // A slot can start a block of N hours if (island_size - pos_in_island + 1) >= N,
    // i.e. pos_in_island <= island_size - N + 1.
    const sql = `
      WITH base AS (
        SELECT
          sl.date,
          sl.start_time,
          sl.status,
          sl.price,
          sl.price_source,
          sl.scraped_at,
          COALESCE(rs.url, ss.url) AS booking_url,
          s.id      AS studio_id,
          s.name    AS studio_name,
          s.primary_area_id AS studio_primary_area_id,
          a.name    AS studio_primary_area_name,
          s.address AS studio_address,
          r.id      AS room_id,
          r.name    AS room_name,
          r.price_per_hour  AS room_price_per_hour,
          r.capacity_min    AS room_capacity_min,
          r.capacity_max    AS room_capacity_max,
          EXTRACT(HOUR FROM sl.start_time)::int
            - ROW_NUMBER() OVER (PARTITION BY r.id, sl.date ORDER BY sl.start_time)::int
            AS island_key
        FROM slots sl
        INNER JOIN rooms r ON r.id = sl.room_id
        INNER JOIN studios s ON s.id = r.studio_id
        LEFT JOIN areas a ON a.id = s.primary_area_id
        LEFT JOIN LATERAL (
          SELECT url FROM room_sources WHERE room_id = r.id ORDER BY id ASC LIMIT 1
        ) rs ON true
        LEFT JOIN LATERAL (
          SELECT url FROM studio_sources WHERE studio_id = s.id ORDER BY id ASC LIMIT 1
        ) ss ON true
        WHERE ${baseConditions.join(' AND ')}
      ),
      with_island_stats AS (
        SELECT *,
          COUNT(*) OVER (PARTITION BY room_id, date, island_key)       AS island_size,
          ROW_NUMBER() OVER (PARTITION BY room_id, date, island_key ORDER BY start_time) AS pos_in_island
        FROM base
      )
      SELECT
        date::text                                                       AS date,
        start_time::text                                                 AS start_time,
        (start_time + (${durationParam} * interval '1 hour'))::text      AS end_time,
        status,
        price * ${durationParam}                                         AS price,
        price_source,
        scraped_at,
        booking_url,
        studio_id,
        studio_name,
        studio_primary_area_id,
        studio_primary_area_name,
        studio_address,
        room_id,
        room_name,
        room_price_per_hour,
        room_capacity_min,
        room_capacity_max
      FROM with_island_stats
      WHERE pos_in_island <= island_size - ${durationParam} + 1
      ORDER BY date ASC, start_time ASC, studio_name ASC, room_name ASC
    `;

    const result = await this.database.query<SlotRow>(sql, params);
    return result.rows;
  }
}
