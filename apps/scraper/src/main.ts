import { end } from './db.js';
import { runOnce } from './worker.js';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 10_000);

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

console.log(`[main] 스크래퍼 시작 (폴링 간격: ${POLL_INTERVAL_MS}ms)`);
await loop();
