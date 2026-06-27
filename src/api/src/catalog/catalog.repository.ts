import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export interface AreaRow {
  id: string;
  slug: string;
  name: string;
}

export interface StudioRow {
  id: string;
  slug: string | null;
  name: string;
  primary_area_id: string | null;
  area_ids: string[];
  address: string | null;
  image_url: string | null;
  rating: string | null;
  review_count: number | null;
  has_online_booking: boolean;
}

@Injectable()
export class CatalogRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async findActiveAreas() {
    const result = await this.database.query<AreaRow>(`
      SELECT id, slug, name
      FROM areas
      WHERE is_active = true
      ORDER BY "order" ASC, id ASC
    `);

    return result.rows;
  }

  async existsActiveArea(areaId: number) {
    const result = await this.database.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM areas
          WHERE id = $1 AND is_active = true
        ) AS exists
      `,
      [areaId],
    );

    return result.rows[0]?.exists ?? false;
  }

  async existsActiveStudio(studioId: number) {
    const result = await this.database.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM studios
          WHERE id = $1 AND is_active = true
        ) AS exists
      `,
      [studioId],
    );

    return result.rows[0]?.exists ?? false;
  }

  async findActiveStudios(filters: { areaId?: number }) {
    const params: unknown[] = [];
    const where = ['s.is_active = true'];

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

    const result = await this.database.query<StudioRow>(
      `
        SELECT
          s.id,
          s.slug,
          s.name,
          s.primary_area_id,
          COALESCE(
            ARRAY_AGG(sa.area_id ORDER BY sa.area_id)
              FILTER (WHERE sa.area_id IS NOT NULL),
            '{}'
          ) AS area_ids,
          s.address,
          CASE
            WHEN s.image_status = 'HIDDEN' THEN NULL
            ELSE COALESCE(s.image_url_manual, s.image_url_scraped)
          END AS image_url,
          s.rating,
          s.review_count,
          -- 방이 실제 온라인 소스에 매핑(room_sources)됐는지. studio_sources만 있고
          -- bizId가 죽은 곳(매핑 0)은 슬롯이 안 나오므로 전화예약으로 본다(프론트 뱃지/안내용).
          EXISTS (
            SELECT 1 FROM room_sources rs
            JOIN rooms r2 ON r2.id = rs.room_id
            WHERE r2.studio_id = s.id
          ) AS has_online_booking
        FROM studios s
        LEFT JOIN studio_areas sa ON sa.studio_id = s.id
        WHERE ${where.join(' AND ')}
        GROUP BY s.id
        ORDER BY s.name ASC, s.id ASC
      `,
      params,
    );

    return result.rows;
  }
}
