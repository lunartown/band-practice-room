import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { AUDIT_SECTIONS } from './audit.queries.js';

export interface AuditCheckResult {
  id: string;
  title: string;
  rowCount: number;
  rows: Record<string, unknown>[];
}

export interface AuditSectionResult {
  section: string;
  title: string;
  checks: AuditCheckResult[];
}

export interface AuditCollectResult {
  database: string | null;
  serverTime: string | null;
  sections: AuditSectionResult[];
}

// DB 접근은 repository 계층이 소유한다(AGENTS.md: 쿼리는 repository 계층).
// db-audit 스킬의 SELECT 진단을 읽기 전용 트랜잭션 안에서 실행한다.
@Injectable()
export class AuditRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async collect(): Promise<AuditCollectResult> {
    return this.database.transaction(async (client) => {
      // 트랜잭션 첫 문장에서 세션을 읽기 전용으로 고정한다(방어적 안전벨트).
      await client.query('SET TRANSACTION READ ONLY');
      await client.query("SET LOCAL statement_timeout = '20000'");

      const meta = await client.query<{ db: string; server_time: Date }>(
        'SELECT current_database() AS db, now() AS server_time',
      );

      const sections: AuditSectionResult[] = [];
      for (const section of AUDIT_SECTIONS) {
        const checks: AuditCheckResult[] = [];
        for (const check of section.checks) {
          const result = await client.query(check.sql);
          checks.push({
            id: check.id,
            title: check.title,
            rowCount: result.rowCount ?? result.rows.length,
            rows: result.rows as Record<string, unknown>[],
          });
        }
        sections.push({ section: section.section, title: section.title, checks });
      }

      return {
        database: meta.rows[0]?.db ?? null,
        serverTime: meta.rows[0]?.server_time?.toISOString() ?? null,
        sections,
      };
    });
  }
}
