// 단독 실행 진입점: 오래된 슬롯과 처리 끝난 알림 이벤트를 지운다.
// 스크랩 워크플로 끝에서 `tsx src/database/prune.ts` 로 돈다.
//
// 두 테이블 모두 지우는 코드가 없어 계속 누적되기만 했다. Render Postgres 는
// 스토리지가 1GB 인데 하루 약 5,900 행(1.6MB)씩 늘어, 방치하면 1년 반쯤 뒤
// 한도에 닿는다. 서비스는 오늘 이후만 조회하므로 과거 슬롯은 통계용 보관분이다.
import pg from 'pg';
import { databasePoolConfig } from './database.service.js';

const { Pool } = pg;

// 과거 슬롯 보관 기간(일). 조회에는 쓰이지 않고 시세·통계 분석 여지로만 남긴다.
// 90일이면 정상 상태에서 약 53만 행(190MB 안팎)으로 1GB 한도에 여유가 있다.
const SLOT_RETENTION_DAYS = Number(process.env.SLOT_RETENTION_DAYS ?? 90);
// 처리 끝난 알림 이벤트 보관 기간(일). 소비된 큐라 되짚어 볼 일이 거의 없다.
const EVENT_RETENTION_DAYS = Number(process.env.EVENT_RETENTION_DAYS ?? 14);
// 한 번에 지우는 행 수. 큰 DELETE 로 테이블을 오래 잠그지 않도록 나눠 지운다.
const DELETE_BATCH_SIZE = Number(process.env.PRUNE_BATCH_SIZE ?? 10000);

async function deleteInBatches(pool: pg.Pool, label: string, sql: string, params: unknown[]) {
  let total = 0;
  for (;;) {
    const result = await pool.query(sql, params);
    total += result.rowCount ?? 0;
    if (!result.rowCount || result.rowCount < DELETE_BATCH_SIZE) break;
  }
  console.log(`[prune] ${label}: ${total}행 삭제`);
  return total;
}

async function main() {
  const pool = new Pool(databasePoolConfig());
  try {
    // 지난 날짜 슬롯. 오늘은 남긴다(진행 중인 날이라 조회 대상).
    await deleteInBatches(
      pool,
      `슬롯(${SLOT_RETENTION_DAYS}일 이전)`,
      `DELETE FROM slots WHERE id IN (
         SELECT id FROM slots
         WHERE date < (NOW() AT TIME ZONE 'Asia/Seoul')::date - $1::integer
         LIMIT ${DELETE_BATCH_SIZE}
       )`,
      [SLOT_RETENTION_DAYS],
    );

    // 처리 끝난 이벤트만. 미처리 이벤트는 아직 발송 대상이라 건드리지 않는다.
    await deleteInBatches(
      pool,
      `알림 이벤트(${EVENT_RETENTION_DAYS}일 이전 처리분)`,
      `DELETE FROM slot_available_events WHERE id IN (
         SELECT id FROM slot_available_events
         WHERE processed_at IS NOT NULL
           AND processed_at < NOW() - ($1 || ' days')::interval
         LIMIT ${DELETE_BATCH_SIZE}
       )`,
      [EVENT_RETENTION_DAYS],
    );

    const size = await pool.query<{ size: string }>(
      `SELECT pg_size_pretty(pg_database_size(current_database())) AS size`,
    );
    console.log(`[prune] 완료 · DB 크기 ${size.rows[0]?.size}`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[prune] 실패:', err);
  process.exit(1);
});
