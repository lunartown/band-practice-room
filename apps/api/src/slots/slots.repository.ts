import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface SlotRow {
  date: string;
  start_time: string;
  end_time: string;
  status: 'AVAILABLE' | 'UNAVAILABLE';
  price: number | null;
  price_source: 'SCRAPED' | 'MANUAL' | 'UNKNOWN';
  scraped_at: Date;
  booking_url: string | null;
  studio_id: string;
  studio_name: string;
  studio_primary_area_id: string | null;
  studio_address: string | null;
  room_id: string;
  room_name: string;
  room_price_per_hour: number | null;
  room_capacity_min: number | null;
  room_capacity_max: number | null;
}

export interface SlotFilters {
  dateFrom: string;
  dateTo: string;
  areaId?: number;
  studioId?: number;
}

@Injectable()
export class SlotsRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async findSlots(filters: SlotFilters) {
    const params: unknown[] = [filters.dateFrom, filters.dateTo];
    const where = [
      'sl.date >= $1',
      'sl.date <= $2',
      "sl.status IN ('AVAILABLE', 'UNAVAILABLE')",
      'r.is_active = true',
      's.is_active = true',
    ];

    if (filters.areaId !== undefined) {
      params.push(filters.areaId);
      where.push(`
        EXISTS (
          SELECT 1
          FROM studio_areas filter_sa
          WHERE filter_sa.studio_id = s.id
            AND filter_sa.area_id = $${params.length}
        )
      `);
    }

    if (filters.studioId !== undefined) {
      params.push(filters.studioId);
      where.push(`s.id = $${params.length}`);
    }

    const result = await this.database.query<SlotRow>(
      `
        SELECT
          sl.date::text AS date,
          sl.start_time::text AS start_time,
          sl.end_time::text AS end_time,
          sl.status,
          sl.price,
          sl.price_source,
          sl.scraped_at,
          COALESCE(rs.url, ss.url) AS booking_url,
          s.id AS studio_id,
          s.name AS studio_name,
          s.primary_area_id AS studio_primary_area_id,
          s.address AS studio_address,
          r.id AS room_id,
          r.name AS room_name,
          r.price_per_hour AS room_price_per_hour,
          r.capacity_min AS room_capacity_min,
          r.capacity_max AS room_capacity_max
        FROM slots sl
        INNER JOIN rooms r ON r.id = sl.room_id
        INNER JOIN studios s ON s.id = r.studio_id
        LEFT JOIN LATERAL (
          SELECT url
          FROM room_sources
          WHERE room_id = r.id
          ORDER BY id ASC
          LIMIT 1
        ) rs ON true
        LEFT JOIN LATERAL (
          SELECT url
          FROM studio_sources
          WHERE studio_id = s.id
          ORDER BY id ASC
          LIMIT 1
        ) ss ON true
        WHERE ${where.join(' AND ')}
        ORDER BY sl.date ASC, sl.start_time ASC, s.name ASC, r.name ASC
      `,
      params,
    );

    return result.rows;
  }
}
