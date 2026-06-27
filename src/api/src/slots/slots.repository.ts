import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

// 신선도 컷오프(시간). 수집 주기가 약 60분이라 정상 슬롯은 1~2h 이내에 갱신된다.
// 이보다 오래 갱신 안 된 AVAILABLE 은, 소스 응답에서 사라졌는데 upsert-only 라 남은
// phantom(또는 수집이 멈춘 스튜디오)이므로 노출에서 제외한다. 환경변수로 조정 가능.
const SLOT_FRESHNESS_HOURS = Math.max(
  1,
  Math.floor(Number(process.env.SLOT_FRESHNESS_HOURS) || 6),
);

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
  studio_image_url: string | null;
  studio_rating: string | null;
  studio_review_count: number | null;
  studio_review_keywords: Array<{ keyword: string; count: number }> | null;
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
      `sl.scraped_at > now() - interval '${SLOT_FRESHNESS_HOURS} hour'`,
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
          -- 방별 예약 링크. 소스(naver/spacecloud)에 따라 형식이 다르다.
          --  ⓪ 스페이스클라우드: 방/합주실 URL 을 그대로 쓴다(날짜 쿼리 미지원).
          --  ① room_sources.url 이 따로 있으면 그대로 쓰되 startDate 만 덧붙임(네이버).
          --  ② 합주실 소스 + 방 bizItemId 가 있으면, 합주실 URL이 bare(/items/ 없음)든
          --     deep든 상관없이 booking/{typeId}/bizes/{bizId}/items/{bizItemId} 를
          --     부품으로 직접 재구성한다(기존 regexp 치환은 bare URL에서 동작 안 함).
          --  ③ 그 외엔 합주실 일반 링크에 startDate 만 덧붙임.
          CASE
            WHEN COALESCE(rs.code, ss.code) = 'spacecloud'
              THEN COALESCE(rs.url, ss.url)
            WHEN rs.url IS NOT NULL
              THEN rs.url || (CASE WHEN rs.url LIKE '%?%' THEN '&' ELSE '?' END)
                   || 'startDate=' || sl.date::text
            WHEN ss.url IS NOT NULL AND rs.external_key IS NOT NULL
              THEN 'https://m.booking.naver.com/booking/'
                   || COALESCE(substring(ss.url from '/booking/([0-9]+)/'), '10')
                   || '/bizes/'
                   || COALESCE(ss.external_key, substring(ss.url from '/bizes/([0-9]+)'))
                   || '/items/' || rs.external_key
                   || '?startDate=' || sl.date::text
            WHEN ss.url IS NOT NULL
              THEN ss.url || (CASE WHEN ss.url LIKE '%?%' THEN '&' ELSE '?' END)
                   || 'startDate=' || sl.date::text
            ELSE ss.url
          END AS booking_url,
          s.id      AS studio_id,
          s.name    AS studio_name,
          s.primary_area_id AS studio_primary_area_id,
          a.name    AS studio_primary_area_name,
          s.address AS studio_address,
          CASE
            WHEN s.image_status = 'HIDDEN' THEN NULL
            ELSE COALESCE(s.image_url_manual, s.image_url_scraped)
          END AS studio_image_url,
          s.rating        AS studio_rating,
          s.review_count  AS studio_review_count,
          s.review_keywords AS studio_review_keywords,
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
          SELECT rsx.url, rsx.external_key, src.code
          FROM room_sources rsx
          JOIN sources src ON src.id = rsx.source_id
          WHERE rsx.room_id = r.id ORDER BY rsx.id ASC LIMIT 1
        ) rs ON true
        LEFT JOIN LATERAL (
          SELECT ssx.url, ssx.external_key, src.code
          FROM studio_sources ssx
          JOIN sources src ON src.id = ssx.source_id
          WHERE ssx.studio_id = s.id ORDER BY ssx.id ASC LIMIT 1
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
        studio_image_url,
        studio_rating,
        studio_review_count,
        studio_review_keywords,
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
