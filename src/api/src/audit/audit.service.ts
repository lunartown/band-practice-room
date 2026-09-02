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

export interface AuditResult {
  generatedAt: string;
  database: string | null;
  serverTime: string | null;
  readOnly: boolean;
  sections: AuditSectionResult[];
}

// db-audit 스킬의 SELECT 진단을 서버(내부 DB 접속)에서 실행해 JSON 으로 반환한다.
// 세션을 read-only 로 고정하고 statement_timeout 을 걸어 안전하게 돌린다.
// 판정/요약은 여기서 하지 않는다 — 원자료만 제공하고 해석은 호출측(db-audit)에 맡긴다.
@Injectable()
export class AuditService {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async runAudit(): Promise<AuditResult> {
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
        generatedAt: new Date().toISOString(),
        database: meta.rows[0]?.db ?? null,
        serverTime: meta.rows[0]?.server_time?.toISOString() ?? null,
        readOnly: true,
        sections,
      };
    });
  }
}
