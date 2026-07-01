import type { RefreshTargetRow } from './refresh.repository.js';
import { buildRefreshPlan, compareRefreshTargets } from './refresh.service.js';

describe('refresh planning', () => {
  const now = Date.parse('2026-07-01T12:00:00.000Z');

  function target(
    studioId: number,
    overrides: Partial<RefreshTargetRow> = {},
  ): RefreshTargetRow {
    return {
      id: String(studioId),
      studio_id: String(studioId),
      source_id: '1',
      source_code: 'naver',
      url: null,
      external_key: null,
      studio_name: `합주실 ${studioId}`,
      manual_updated_at: null,
      last_scraped_at: new Date(now - 60 * 60_000),
      ...overrides,
    };
  }

  it('orders never-scraped targets first, then older scraped targets', () => {
    const targets = [
      target(1, { last_scraped_at: new Date(now - 20 * 60_000) }),
      target(2, { last_scraped_at: null }),
      target(3, { last_scraped_at: new Date(now - 3 * 60 * 60_000) }),
    ];

    expect([...targets].sort(compareRefreshTargets).map((t) => Number(t.studio_id))).toEqual([
      2,
      3,
      1,
    ]);
  });

  it('skips fresh and cooldown targets, then caps remaining eligible targets', () => {
    const plan = buildRefreshPlan(
      [
        target(1, { last_scraped_at: new Date(now - 2 * 60_000) }),
        target(2, {
          last_scraped_at: null,
          manual_updated_at: new Date(now - 60_000),
        }),
        target(3, { last_scraped_at: null }),
        target(4, { last_scraped_at: new Date(now - 3 * 60 * 60_000) }),
        target(5, { last_scraped_at: new Date(now - 2 * 60 * 60_000) }),
      ],
      {
        now,
        freshMs: 10 * 60_000,
        cooldownMs: 5 * 60_000,
        maxSources: 2,
      },
    );

    expect(plan.toScrape.map((t) => Number(t.studio_id))).toEqual([3, 4]);
    expect(plan.skipped).toEqual(
      expect.arrayContaining([
        { studioId: 1, sourceCode: 'naver', reason: 'fresh' },
        { studioId: 2, sourceCode: 'naver', reason: 'cooldown' },
        { studioId: 5, sourceCode: 'naver', reason: 'capped' },
      ]),
    );
  });
});
