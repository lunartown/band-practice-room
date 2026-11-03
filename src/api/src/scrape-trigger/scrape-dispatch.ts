// 스크랩 워크플로(.github/workflows/scrape.yml)의 정기 실행을 API 서버가 직접 건다.
// GitHub schedule 은 예약 실행을 대부분 버린다('7,37 * * * *' 중 하루 3~4회만 실행).
// 그러면 슬롯이 신선도 기준(SLOT_FRESHNESS_HOURS)을 넘겨 빈 화면이 되므로,
// 30분마다 workflow_dispatch API 를 호출한다.
// - SCRAPE_DISPATCH_GITHUB_TOKEN 이 없으면 꺼진다. prod API 에만 설정한다(dev API·로컬·CI 는 미설정).
// - 스크랩 자체는 계속 GitHub Actions 에서 돈다. 여기서는 실행만 건다.
// - 실행이 겹쳐도 워크플로의 concurrency: scrape 가 순서대로 처리한다.
// - HTTP 서버(main.ts)에서만 시작한다. Nest 컨텍스트만 띄우는 CLI(notify:dispatch 등)에서는 돌지 않는다.
import { Logger } from '@nestjs/common';

const WORKFLOW_FILE = 'scrape.yml';
const REQUEST_TIMEOUT_MS = 15_000;

export interface ScrapeDispatchConfig {
  token: string;
  repo: string;
  ref: string;
  database: string;
  intervalMinutes: number;
  offsetMinutes: number;
}

type Env = Record<string, string | undefined>;

function readInt(value: string | undefined, fallback: number, min: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= min ? parsed : fallback;
}

export function readScrapeDispatchConfig(env: Env = process.env): ScrapeDispatchConfig | null {
  const token = env.SCRAPE_DISPATCH_GITHUB_TOKEN?.trim();
  if (!token) return null;

  return {
    token,
    repo: env.SCRAPE_DISPATCH_REPO?.trim() || 'lunartown/band-practice-room',
    ref: env.SCRAPE_DISPATCH_REF?.trim() || 'main',
    database: env.SCRAPE_DISPATCH_DATABASE?.trim() || 'prod',
    intervalMinutes: readInt(env.SCRAPE_DISPATCH_INTERVAL_MINUTES, 30, 1),
    // 정각은 GitHub 전체가 붐비는 시각이라 피한다. 기본값이면 매시 7분·37분에 건다.
    offsetMinutes: readInt(env.SCRAPE_DISPATCH_OFFSET_MINUTES, 7, 0),
  };
}

// 다음 실행 시각까지 남은 ms. 분이 offset(간격으로 나눈 나머지)에 맞는 시각을 고른다.
// 지금이 정확히 실행 시각이면 바로 다음 회차(간격 전체)를 돌려준다.
export function msUntilNextTick(now: Date, intervalMinutes: number, offsetMinutes: number): number {
  const intervalMs = intervalMinutes * 60_000;
  const offsetMs = (offsetMinutes % intervalMinutes) * 60_000;
  const t = now.getTime();
  const next = Math.floor((t - offsetMs) / intervalMs) * intervalMs + offsetMs + intervalMs;
  return next - t;
}

export async function dispatchScrape(
  config: ScrapeDispatchConfig,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const url = `https://api.github.com/repos/${config.repo}/actions/workflows/${WORKFLOW_FILE}/dispatches`;
  const res = await fetchImpl(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    // 정기 실행은 시드 없이 스크랩만 한다.
    body: JSON.stringify({ ref: config.ref, inputs: { database: config.database, seed: 'false' } }),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (res.status !== 204) {
    const text = (await res.text().catch(() => '')).slice(0, 300);
    throw new Error(`workflow_dispatch 실패: HTTP ${res.status} ${text}`);
  }
}

export interface ScrapeDispatchTimer {
  stop(): void;
}

export function startScrapeDispatchTimer(env: Env = process.env): ScrapeDispatchTimer | null {
  const logger = new Logger('ScrapeDispatch');
  const config = readScrapeDispatchConfig(env);
  if (!config) {
    logger.log('SCRAPE_DISPATCH_GITHUB_TOKEN 미설정 → 스크랩 정기 실행 트리거 꺼짐');
    return null;
  }

  let stopped = false;
  let timer: NodeJS.Timeout | undefined;

  const scheduleNext = () => {
    if (stopped) return;
    const delay = msUntilNextTick(new Date(), config.intervalMinutes, config.offsetMinutes);
    timer = setTimeout(async () => {
      try {
        await dispatchScrape(config);
        logger.log(`dispatch 성공 (${config.repo}@${config.ref}, database=${config.database})`);
      } catch (err) {
        logger.error(err instanceof Error ? err.message : String(err));
      }
      scheduleNext();
    }, delay);
    timer.unref();
  };

  scheduleNext();
  logger.log(
    `스크랩 정기 실행 트리거 켜짐: ${config.intervalMinutes}분 간격(오프셋 ${config.offsetMinutes}분), ` +
      `${config.repo}@${config.ref}, database=${config.database}`,
  );

  return {
    stop() {
      stopped = true;
      if (timer) clearTimeout(timer);
    },
  };
}
