import { SlotsRepository } from './slots.repository.js';

async function captureSql(minDuration?: number) {
  const query = jest.fn().mockResolvedValue({ rows: [] });
  const repository = new SlotsRepository({ query } as never);
  await repository.findSlots({ dates: ['2026-06-15'], minDuration });
  return query.mock.calls[0][0] as string;
}

describe('SlotsRepository', () => {
  it('skips consecutive-run window functions for one-hour queries', async () => {
    for (const minDuration of [undefined, 1]) {
      const sql = await captureSql(minDuration);
      expect(sql).not.toContain('OVER (');
      expect(sql).not.toContain('with_island_stats');
      expect(sql).toContain('FROM base');
    }
  });

  it('filters by consecutive runs for longer queries', async () => {
    const sql = await captureSql(2);
    expect(sql).toContain('with_island_stats');
    expect(sql).toContain('WHERE pos_in_island <= island_size - ');
  });

  it('evaluates booking URL regexes in the studio lateral, not per slot', async () => {
    const sql = await captureSql();
    expect(sql).toContain("substring(ssx.url from '/booking/");
    expect(sql).toContain("substring(ssx.url from '/bizes/");
    expect(sql).not.toContain('substring(ss.url');
  });
});
