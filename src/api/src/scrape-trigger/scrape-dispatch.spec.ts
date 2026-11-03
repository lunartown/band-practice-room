import {
  dispatchScrape,
  msUntilNextTick,
  readScrapeDispatchConfig,
  startScrapeDispatchTimer,
  type ScrapeDispatchConfig,
} from './scrape-dispatch.js';

const config: ScrapeDispatchConfig = {
  token: 'test-token',
  repo: 'owner/repo',
  ref: 'main',
  database: 'prod',
  intervalMinutes: 30,
  offsetMinutes: 7,
};

describe('readScrapeDispatchConfig', () => {
  it('토큰이 없으면 꺼진다(null)', () => {
    expect(readScrapeDispatchConfig({})).toBeNull();
    expect(readScrapeDispatchConfig({ SCRAPE_DISPATCH_GITHUB_TOKEN: '  ' })).toBeNull();
    expect(startScrapeDispatchTimer({})).toBeNull();
  });

  it('토큰만 있으면 기본값(prod·main·30분·7분 오프셋)을 쓴다', () => {
    expect(readScrapeDispatchConfig({ SCRAPE_DISPATCH_GITHUB_TOKEN: 't' })).toEqual({
      token: 't',
      repo: 'lunartown/band-practice-room',
      ref: 'main',
      database: 'prod',
      intervalMinutes: 30,
      offsetMinutes: 7,
    });
  });

  it('잘못된 숫자는 기본값으로 대체한다', () => {
    const result = readScrapeDispatchConfig({
      SCRAPE_DISPATCH_GITHUB_TOKEN: 't',
      SCRAPE_DISPATCH_INTERVAL_MINUTES: '0',
      SCRAPE_DISPATCH_OFFSET_MINUTES: 'abc',
    });
    expect(result?.intervalMinutes).toBe(30);
    expect(result?.offsetMinutes).toBe(7);
  });
});

describe('msUntilNextTick', () => {
  const at = (iso: string) => new Date(iso);
  const minutes = (ms: number) => ms / 60_000;

  it('매시 7분·37분에 맞춘다', () => {
    expect(minutes(msUntilNextTick(at('2026-11-04T00:00:00Z'), 30, 7))).toBe(7);
    expect(minutes(msUntilNextTick(at('2026-11-04T00:10:00Z'), 30, 7))).toBe(27);
    expect(minutes(msUntilNextTick(at('2026-11-04T00:40:00Z'), 30, 7))).toBe(27);
    expect(minutes(msUntilNextTick(at('2026-11-04T00:59:00Z'), 30, 7))).toBe(8);
  });

  it('정확히 실행 시각이면 다음 회차를 고른다', () => {
    expect(minutes(msUntilNextTick(at('2026-11-04T00:07:00Z'), 30, 7))).toBe(30);
  });
});

describe('dispatchScrape', () => {
  it('seed=false 로 workflow_dispatch 를 호출한다', async () => {
    const fetchMock = jest.fn(async () => new Response(null, { status: 204 }));
    await dispatchScrape(config, fetchMock as unknown as typeof fetch);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe('https://api.github.com/repos/owner/repo/actions/workflows/scrape.yml/dispatches');
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer test-token');
    expect(JSON.parse(init.body as string)).toEqual({
      ref: 'main',
      inputs: { database: 'prod', seed: 'false' },
    });
  });

  it('204 가 아니면 상태 코드를 담아 실패한다', async () => {
    const fetchMock = jest.fn(async () => new Response('{"message":"Unexpected inputs"}', { status: 422 }));
    await expect(dispatchScrape(config, fetchMock as unknown as typeof fetch)).rejects.toThrow('HTTP 422');
  });
});
