import { end } from './db.js';
import { runOnce } from './worker.js';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 10_000);
// RUN_ONCE=true 면 큐를 한 번 비우고 종료한다 (GitHub Actions 크론용).
const RUN_ONCE = process.env.RUN_ONCE === 'true';

// 처리할 작업이 없을 때까지 돌고 종료. provisionJobs 가 매 호출마다 대상을 채우고,
// 성공한 잡은 run_after=+60분으로 재큐되므로 한 바퀴 돌면 claimable 잡이 사라져 멈춘다.
async function drainAndExit() {
  let processed = 0;
  for (;;) {
    let didWork: boolean;
    try {
      didWork = await runOnce();
    } catch (error) {
      console.error('[main] 처리 중 오류:', error);
      break;
    }
    if (!didWork) break;
    processed += 1;
  }
  console.log(`[main] 원샷 실행 완료: ${processed}건 처리`);
  await end();
}

async function loop() {
  while (true) {
    try {
      const didWork = await runOnce();
      if (!didWork) {
        await sleep(POLL_INTERVAL_MS);
      }
    } catch (error) {
      console.error('[main] 예기치 않은 오류:', error);
      await sleep(POLL_INTERVAL_MS);
    }
  }
}

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

process.on('SIGINT', async () => {
  console.log('\n[main] 종료 중...');
  await end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await end();
  process.exit(0);
});

if (RUN_ONCE) {
  console.log('[main] 원샷 모드 (RUN_ONCE=true)');
  await drainAndExit();
  process.exit(0);
}

console.log(`[main] 스크래퍼 시작 (폴링 간격: ${POLL_INTERVAL_MS}ms)`);
await loop();
