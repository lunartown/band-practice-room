import { sendAlert } from './alert.js';
import { end } from './db.js';
import { collectFailuresSince, runOnce } from './worker.js';

const POLL_INTERVAL_MS = Number(process.env.POLL_INTERVAL_MS ?? 10_000);
// RUN_ONCE=true 면 큐를 한 번 비우고 종료한다 (GitHub Actions 크론용).
const RUN_ONCE = process.env.RUN_ONCE === 'true';

// 처리할 작업이 없을 때까지 돌고 종료. provisionJobs 가 매 호출마다 대상을 채우고,
// 성공한 잡은 run_after=+60분으로 재큐되므로 한 바퀴 돌면 claimable 잡이 사라져 멈춘다.
async function drainAndExit() {
  const startedAt = new Date();
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

  // 이번 실행에서 재시도를 소진해 영구 실패로 넘어간 합주실을 모아 알림.
  const failures = await collectFailuresSince(startedAt);
  if (failures.length > 0) {
    const lines = failures.map((f) => `• ${f.studioName}: ${f.lastError ?? '원인 미상'}`);
    await sendAlert(`[합주실 수집] 영구 실패 ${failures.length}건\n${lines.join('\n')}`);
  }

  console.log(`[main] 원샷 실행 완료: ${processed}건 처리, 영구 실패 ${failures.length}건`);
  await end();

  // FAIL_ON_SCRAPE_ERRORS=true 면 GitHub Actions 가 빨갛게 떠 기본 메일 알림이 가도록 한다.
  if (failures.length > 0 && process.env.FAIL_ON_SCRAPE_ERRORS === 'true') {
    process.exitCode = 1;
  }
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
  // drainAndExit 가 실패 시 process.exitCode 를 1 로 설정할 수 있으므로 그대로 따른다.
  process.exit(process.exitCode ?? 0);
}

console.log(`[main] 스크래퍼 시작 (폴링 간격: ${POLL_INTERVAL_MS}ms)`);
await loop();
