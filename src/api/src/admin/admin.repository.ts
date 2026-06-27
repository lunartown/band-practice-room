import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export type MappingStatus = 'ACTIVE' | 'NEEDS_MAPPING' | 'DISABLED' | 'NOT_FOUND';
export type ImageStatus = 'OK' | 'MISSING' | 'BAD' | 'NEEDS_REVIEW' | 'MANUAL_OVERRIDE' | 'HIDDEN';

export interface SourcePatch {
  externalKey?: string | null;
  url?: string | null;
  mappingStatus?: MappingStatus;
  mappingNote?: string | null;
  lastLookupError?: string | null;
}

export interface StudioImagePatch {
  imageUrlManual?: string | null;
  imageStatus?: ImageStatus;
  imageNote?: string | null;
}

export interface AdminSourceRow {
  id: string;
  source_id: string;
  source_code: string | null;
  source_name: string;
  studio_id: string;
  studio_name: string;
  room_id?: string | null;
  room_name?: string | null;
  external_key: string | null;
  url: string | null;
  mapping_status: MappingStatus;
  mapping_note: string | null;
  last_lookup_error: string | null;
  last_verified_at: Date | null;
  manual_updated_at: Date | null;
}

export interface MappingIssueRow extends AdminSourceRow {
  kind: 'studio_source' | 'room_source';
  latest_run_status: 'SUCCESS' | 'FAILED' | 'PARTIAL' | null;
  latest_error_kind: string | null;
  latest_error_message: string | null;
  latest_finished_at: Date | null;
}

export interface ImageIssueRow {
  id: string;
  slug: string | null;
  name: string;
  primary_area_name: string | null;
  is_active: boolean;
  image_url_manual: string | null;
  image_url_scraped: string | null;
  image_status: ImageStatus;
  image_note: string | null;
  image_reviewed_at: Date | null;
  image_updated_at: Date | null;
}

@Injectable()
export class AdminRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async getOverview() {
    const result = await this.database.query<{
      mapping_issue_count: string;
      image_issue_count: string;
      disabled_studio_count: string;
      disabled_room_count: string;
      failed_run_count_24h: string;
    }>(`
      SELECT
        (
          SELECT COUNT(*)
          FROM (
            SELECT id FROM studio_sources
            WHERE mapping_status <> 'ACTIVE' OR last_lookup_error IS NOT NULL
            UNION ALL
            SELECT id FROM room_sources
            WHERE mapping_status <> 'ACTIVE' OR last_lookup_error IS NOT NULL
          ) issues
        ) AS mapping_issue_count,
        (
          SELECT COUNT(*)
          FROM studios
          WHERE image_status <> 'OK'
            OR COALESCE(image_url_manual, image_url_scraped) IS NULL
        ) AS image_issue_count,
        (SELECT COUNT(*) FROM studios WHERE is_active = false) AS disabled_studio_count,
        (SELECT COUNT(*) FROM rooms WHERE is_active = false) AS disabled_room_count,
        (
          SELECT COUNT(*)
          FROM scrape_runs
          WHERE status IN ('FAILED', 'PARTIAL')
            AND finished_at > NOW() - INTERVAL '24 hours'
        ) AS failed_run_count_24h
    `);

    return result.rows[0];
  }

  async listMappingIssues(): Promise<MappingIssueRow[]> {
    const result = await this.database.query<MappingIssueRow>(`
      WITH studio_items AS (
        SELECT
          'studio_source'::text AS kind,
          ss.id,
          ss.source_id,
          src.code AS source_code,
          src.name AS source_name,
          st.id AS studio_id,
          st.name AS studio_name,
          NULL::bigint AS room_id,
          NULL::text AS room_name,
          ss.external_key,
          ss.url,
          ss.mapping_status,
          ss.mapping_note,
          ss.last_lookup_error,
          ss.last_verified_at,
          ss.manual_updated_at,
          latest.status AS latest_run_status,
          latest.error_kind AS latest_error_kind,
          latest.error_message AS latest_error_message,
          latest.finished_at AS latest_finished_at
        FROM studio_sources ss
        JOIN studios st ON st.id = ss.studio_id
        JOIN sources src ON src.id = ss.source_id
        LEFT JOIN LATERAL (
          SELECT status, error_kind, error_message, finished_at
          FROM scrape_runs sr
          WHERE sr.studio_id = ss.studio_id AND sr.source_id = ss.source_id
          ORDER BY finished_at DESC NULLS LAST, id DESC
          LIMIT 1
        ) latest ON true
      ),
      room_items AS (
        SELECT
          'room_source'::text AS kind,
          rs.id,
          rs.source_id,
          src.code AS source_code,
          src.name AS source_name,
          st.id AS studio_id,
          st.name AS studio_name,
          r.id AS room_id,
          r.name AS room_name,
          rs.external_key,
          rs.url,
          rs.mapping_status,
          rs.mapping_note,
          rs.last_lookup_error,
          rs.last_verified_at,
          rs.manual_updated_at,
          latest.status AS latest_run_status,
          latest.error_kind AS latest_error_kind,
          latest.error_message AS latest_error_message,
          latest.finished_at AS latest_finished_at
        FROM room_sources rs
        JOIN rooms r ON r.id = rs.room_id
        JOIN studios st ON st.id = r.studio_id
        JOIN sources src ON src.id = rs.source_id
        LEFT JOIN LATERAL (
          SELECT status, error_kind, error_message, finished_at
          FROM scrape_runs sr
          WHERE sr.studio_id = st.id AND sr.source_id = rs.source_id
          ORDER BY finished_at DESC NULLS LAST, id DESC
          LIMIT 1
        ) latest ON true
      )
      SELECT *
      FROM (
        SELECT * FROM studio_items
        UNION ALL
        SELECT * FROM room_items
      ) items
      WHERE mapping_status <> 'ACTIVE'
        OR last_lookup_error IS NOT NULL
        OR latest_run_status IN ('FAILED', 'PARTIAL')
      ORDER BY
        CASE mapping_status
          WHEN 'NEEDS_MAPPING' THEN 0
          WHEN 'DISABLED' THEN 1
          WHEN 'NOT_FOUND' THEN 2
          ELSE 3
        END,
        latest_finished_at DESC NULLS LAST,
        studio_name ASC,
        room_name ASC NULLS FIRST
    `);

    return result.rows;
  }

  async listImageIssues(): Promise<ImageIssueRow[]> {
    const result = await this.database.query<ImageIssueRow>(`
      SELECT
        s.id,
        s.slug,
        s.name,
        a.name AS primary_area_name,
        s.is_active,
        s.image_url_manual,
        s.image_url_scraped,
        s.image_status,
        s.image_note,
        s.image_reviewed_at,
        s.image_updated_at
      FROM studios s
      LEFT JOIN areas a ON a.id = s.primary_area_id
      WHERE s.image_status <> 'OK'
        OR COALESCE(s.image_url_manual, s.image_url_scraped) IS NULL
        OR s.image_url_manual IS NOT NULL
      ORDER BY
        CASE
          WHEN s.image_status = 'MISSING' THEN 0
          WHEN s.image_status = 'BAD' THEN 1
          WHEN s.image_status = 'NEEDS_REVIEW' THEN 2
          WHEN s.image_status = 'HIDDEN' THEN 3
          WHEN s.image_status = 'MANUAL_OVERRIDE' THEN 4
          ELSE 5
        END,
        s.name ASC
    `);
    return result.rows;
  }

  async getStudioSource(id: number) {
    return this.findOneSource('studio_sources', id);
  }

  async getRoomSource(id: number) {
    return this.findOneSource('room_sources', id);
  }

  async updateStudioSource(id: number, patch: SourcePatch) {
    return this.updateSource('studio_sources', id, patch);
  }

  async updateRoomSource(id: number, patch: SourcePatch) {
    return this.updateSource('room_sources', id, patch);
  }

  async verifyStudioSource(id: number) {
    const current = await this.getStudioSource(id);
    if (!current) return null;
    const missing: string[] = [];
    if (!current.external_key) missing.push('external_key');
    if (!current.url) missing.push('url');
    return this.updateStudioSource(id, {
      mappingStatus: missing.length ? 'NEEDS_MAPPING' : 'ACTIVE',
      lastLookupError: missing.length ? `필수 값 누락: ${missing.join(', ')}` : null,
    });
  }

  async verifyRoomSource(id: number) {
    const current = await this.getRoomSource(id);
    if (!current) return null;
    return this.updateRoomSource(id, {
      mappingStatus: current.external_key ? 'ACTIVE' : 'NEEDS_MAPPING',
      lastLookupError: current.external_key ? null : '필수 값 누락: external_key',
    });
  }

  async updateStudioImage(id: number, patch: StudioImagePatch) {
    const before = await this.getStudio(id);
    if (!before) return null;

    const fields: string[] = [];
    const params: unknown[] = [];
    const add = (column: string, value: unknown) => {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    };

    if (patch.imageUrlManual !== undefined) add('image_url_manual', patch.imageUrlManual);
    if (patch.imageStatus !== undefined) {
      add('image_status', patch.imageStatus);
      if (patch.imageStatus === 'OK' || patch.imageStatus === 'MANUAL_OVERRIDE') {
        fields.push('image_reviewed_at = NOW()');
      }
    }
    if (patch.imageNote !== undefined) add('image_note', patch.imageNote);
    fields.push('image_updated_at = NOW()');

    params.push(id);
    const result = await this.database.query(
      `
      UPDATE studios
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
      RETURNING *
    `,
      params,
    );

    return { before, after: result.rows[0] };
  }

  async updateStudioActive(id: number, isActive: boolean) {
    return this.updateActive('studios', id, isActive);
  }

  async updateRoomActive(id: number, isActive: boolean) {
    return this.updateActive('rooms', id, isActive);
  }

  async listAuditLogs(limit: number) {
    const result = await this.database.query<{
      id: string;
      actor: string;
      action: string;
      target_type: string;
      target_id: string;
      before_value: unknown;
      after_value: unknown;
      created_at: Date;
    }>(
      `
      SELECT id, actor, action, target_type, target_id, before_value, after_value, created_at
      FROM admin_audit_logs
      ORDER BY created_at DESC, id DESC
      LIMIT $1
    `,
      [limit],
    );
    return result.rows;
  }

  async createAuditLog(params: {
    actor: string;
    action: string;
    targetType: string;
    targetId: number;
    beforeValue: unknown;
    afterValue: unknown;
  }) {
    await this.database.query(
      `
      INSERT INTO admin_audit_logs
        (actor, action, target_type, target_id, before_value, after_value)
      VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb)
    `,
      [
        params.actor,
        params.action,
        params.targetType,
        params.targetId,
        JSON.stringify(params.beforeValue),
        JSON.stringify(params.afterValue),
      ],
    );
  }

  private async findOneSource(table: 'studio_sources' | 'room_sources', id: number) {
    const result = await this.database.query<AdminSourceRow>(
      `
      SELECT
        s.id,
        s.source_id,
        src.code AS source_code,
        src.name AS source_name,
        ${
          table === 'studio_sources'
            ? 'st.id AS studio_id, st.name AS studio_name, NULL::bigint AS room_id, NULL::text AS room_name'
            : 'st.id AS studio_id, st.name AS studio_name, r.id AS room_id, r.name AS room_name'
        },
        s.external_key,
        s.url,
        s.mapping_status,
        s.mapping_note,
        s.last_lookup_error,
        s.last_verified_at,
        s.manual_updated_at
      FROM ${table} s
      ${
        table === 'studio_sources'
          ? 'JOIN studios st ON st.id = s.studio_id'
          : 'JOIN rooms r ON r.id = s.room_id JOIN studios st ON st.id = r.studio_id'
      }
      JOIN sources src ON src.id = s.source_id
      WHERE s.id = $1
    `,
      [id],
    );
    return result.rows[0] ?? null;
  }

  private async updateSource(table: 'studio_sources' | 'room_sources', id: number, patch: SourcePatch) {
    const before = await this.findOneSource(table, id);
    if (!before) return null;

    const fields: string[] = [];
    const params: unknown[] = [];
    const add = (column: string, value: unknown) => {
      params.push(value);
      fields.push(`${column} = $${params.length}`);
    };

    if (patch.externalKey !== undefined) add('external_key', patch.externalKey);
    if (patch.url !== undefined) add('url', patch.url);
    if (patch.mappingStatus !== undefined) add('mapping_status', patch.mappingStatus);
    if (patch.mappingNote !== undefined) add('mapping_note', patch.mappingNote);
    if (patch.lastLookupError !== undefined) add('last_lookup_error', patch.lastLookupError);

    if (fields.length === 0) return { before, after: before };

    fields.push('manual_updated_at = NOW()');
    if (patch.mappingStatus === 'ACTIVE') {
      fields.push('last_verified_at = NOW()');
    }

    params.push(id);
    await this.database.query(
      `
      UPDATE ${table}
      SET ${fields.join(', ')}
      WHERE id = $${params.length}
    `,
      params,
    );

    const after = await this.findOneSource(table, id);
    return { before, after: after! };
  }

  private async getStudio(id: number) {
    const result = await this.database.query(
      `
      SELECT *
      FROM studios
      WHERE id = $1
    `,
      [id],
    );
    return result.rows[0] ?? null;
  }

  private async updateActive(table: 'studios' | 'rooms', id: number, isActive: boolean) {
    const beforeResult = await this.database.query(`SELECT * FROM ${table} WHERE id = $1`, [id]);
    const before = beforeResult.rows[0] ?? null;
    if (!before) return null;

    const afterResult = await this.database.query(
      `
      UPDATE ${table}
      SET is_active = $2
      WHERE id = $1
      RETURNING *
    `,
      [id, isActive],
    );
    return { before, after: afterResult.rows[0] };
  }
}
