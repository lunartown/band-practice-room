/**
 * DB 정합성 점검(db-audit)을 읽기 전용으로 실행하고 결과를 stdout 에 출력한다.
 * GitHub Actions(workflow_dispatch)에서 돌리고, 로그로 결과를 회수하는 용도.
 *
 * - SELECT 전용. 세션을 read-only 로 고정하고 statement_timeout 을 건다.
 * - 각 체크는 독립 실행(암묵 autocommit 트랜잭션)이라 하나가 실패해도 나머지는 계속된다.
 * - 판정/요약은 하지 않고 원자료만 낸다(해석은 db-audit 스킬에 맡김).
 * - 마지막에 ===DB_AUDIT_JSON_BEGIN===/END=== 로 감싼 JSON 을 출력해 로그에서 파싱 가능하게 한다.
 *
 * 사용:
 *   DATABASE_URL=... npx tsx scripts/db-audit.ts
 */
import { end, getClient } from '../src/db.js';
import { AUDIT_SECTIONS } from './db-audit-queries.js';

const STATEMENT_TIMEOUT_MS = 20_000;

interface CheckResult {
  id: string;
  title: string;
  rowCount: number | null;
  rows: Record<string, unknown>[];
  error: string | null;
}

interface SectionResult {
  section: string;
  title: string;
  checks: CheckResult[];
}

async function main() {
  const client = await getClient();
  const sections: SectionResult[] = [];
  let meta: { database: string | null; serverTime: string | null } = {
    database: null,
    serverTime: null,
  };

  try {
    // 세션 자체를 read-only 로 고정한다. 명시적 트랜잭션을 열지 않으므로 각 체크는
    // 독립 autocommit 문장으로 실행되고, 한 체크의 오류가 다음 체크를 오염시키지 않는다.
    await client.query('SET SESSION default_transaction_read_only = on');
    await client.query(`SET SESSION statement_timeout = ${STATEMENT_TIMEOUT_MS}`);

    const metaRes = await client.query<{ db: string; server_time: Date }>(
      'SELECT current_database() AS db, now() AS server_time',
    );
    meta = {
      database: metaRes.rows[0]?.db ?? null,
      serverTime: metaRes.rows[0]?.server_time?.toISOString() ?? null,
    };

    for (const section of AUDIT_SECTIONS) {
      const checks: CheckResult[] = [];
      for (const check of section.checks) {
        try {
          const res = await client.query(check.sql);
          checks.push({
            id: check.id,
            title: check.title,
            rowCount: res.rowCount ?? res.rows.length,
            rows: res.rows as Record<string, unknown>[],
            error: null,
          });
        } catch (err) {
          checks.push({
            id: check.id,
            title: check.title,
            rowCount: null,
            rows: [],
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }
      sections.push({ section: section.section, title: section.title, checks });
    }
  } finally {
    client.release();
  }

  printHuman(meta, sections);

  const payload = { generatedAt: new Date().toISOString(), readOnly: true, ...meta, sections };
  console.log('===DB_AUDIT_JSON_BEGIN===');
  console.log(JSON.stringify(payload));
  console.log('===DB_AUDIT_JSON_END===');

  const failed = sections.flatMap((s) => s.checks).filter((c) => c.error).length;
  console.log(`\n점검 완료: 섹션 ${sections.length}개, 실패한 체크 ${failed}개`);
}

function printHuman(
  meta: { database: string | null; serverTime: string | null },
  sections: SectionResult[],
) {
  console.log(`# DB 정합성 점검 (읽기 전용)`);
  console.log(`- database: ${meta.database ?? '(unknown)'}`);
  console.log(`- server_time: ${meta.serverTime ?? '(unknown)'}`);
  for (const section of sections) {
    console.log(`\n## [${section.section}] ${section.title}`);
    for (const check of section.checks) {
      if (check.error) {
        console.log(`- ${check.id} (${check.title}): ERROR ${check.error}`);
      } else {
        console.log(`- ${check.id} (${check.title}): rows=${check.rowCount}`);
      }
    }
  }
}

main()
  .then(() => end())
  .then(() => process.exit(0))
  .catch(async (err) => {
    // 접속 실패 등 치명적 오류만 여기로 온다(개별 체크 오류는 위에서 흡수).
    console.error('db-audit 실패:', err instanceof Error ? err.message : err);
    await end().catch(() => {});
    process.exit(1);
  });
