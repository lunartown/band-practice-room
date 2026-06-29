import { getNowHourInKst, parseDates } from './date-range.js';

describe('parseDates', () => {
  it('returns 7 days from today when no dates provided', () => {
    const result = parseDates(undefined, '2026-06-16');
    expect(result).toHaveLength(7);
    expect(result[0]).toBe('2026-06-16');
    expect(result[6]).toBe('2026-06-22');
  });

  it('accepts valid dates array', () => {
    expect(parseDates(['2026-06-16', '2026-06-18'], '2026-06-16')).toEqual([
      '2026-06-16',
      '2026-06-18',
    ]);
  });

  it('deduplicates and sorts dates', () => {
    expect(parseDates(['2026-06-18', '2026-06-16', '2026-06-16'], '2026-06-16')).toEqual([
      '2026-06-16',
      '2026-06-18',
    ]);
  });

  it('accepts comma-separated dates as a single string', () => {
    expect(parseDates('2026-06-16,2026-06-18', '2026-06-16')).toEqual([
      '2026-06-16',
      '2026-06-18',
    ]);
  });

  it('rejects invalid date format', () => {
    expect(() => parseDates(['not-a-date'], '2026-06-16')).toThrow(
      expect.objectContaining({ code: 'INVALID_DATE' }),
    );
  });

  it('rejects invalid calendar date', () => {
    expect(() => parseDates(['2026-02-31'], '2026-02-01')).toThrow(
      expect.objectContaining({ code: 'INVALID_DATE' }),
    );
  });

  it('rejects past dates', () => {
    expect(() => parseDates(['2026-06-15'], '2026-06-16')).toThrow(
      expect.objectContaining({ code: 'INVALID_DATE' }),
    );
  });

  it('rejects more than 30 dates', () => {
    const dates = Array.from({ length: 31 }, (_, i) => {
      const d = new Date('2026-06-16T00:00:00.000Z');
      d.setUTCDate(d.getUTCDate() + i);
      return d.toISOString().slice(0, 10);
    });
    expect(() => parseDates(dates, '2026-06-16')).toThrow(
      expect.objectContaining({ code: 'INVALID_PARAMETER' }),
    );
  });
});

describe('getNowHourInKst', () => {
  it('floors to the hour in KST (UTC+9)', () => {
    // 05:30 UTC = 14:30 KST → 14:00 으로 내림
    expect(getNowHourInKst(new Date('2026-06-29T05:30:00.000Z'))).toEqual({
      date: '2026-06-29',
      time: '14:00:00',
    });
  });

  it('keeps the current hour at exactly :00', () => {
    // 05:00 UTC = 14:00 KST
    expect(getNowHourInKst(new Date('2026-06-29T05:00:00.000Z'))).toEqual({
      date: '2026-06-29',
      time: '14:00:00',
    });
  });

  it('rolls the date forward across the KST day boundary', () => {
    // 15:00 UTC = 다음날 00:00 KST → 자정은 '00:00:00'
    expect(getNowHourInKst(new Date('2026-06-28T15:00:00.000Z'))).toEqual({
      date: '2026-06-29',
      time: '00:00:00',
    });
  });
});
