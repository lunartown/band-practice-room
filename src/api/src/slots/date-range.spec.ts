import { validateDateRange } from './date-range.js';

describe('validateDateRange', () => {
  it('accepts a 30-day included range', () => {
    expect(validateDateRange('2026-06-15', '2026-07-14', '2026-06-15')).toEqual({
      dateFrom: '2026-06-15',
      dateTo: '2026-07-14',
    });
  });

  it('rejects a missing parameter', () => {
    expect(() => validateDateRange('2026-06-15', undefined, '2026-06-15')).toThrow(
      expect.objectContaining({ code: 'MISSING_PARAMETER' }),
    );
  });

  it('rejects an invalid calendar date', () => {
    expect(() => validateDateRange('2026-02-31', '2026-03-01', '2026-02-01')).toThrow(
      expect.objectContaining({ code: 'INVALID_DATE' }),
    );
  });

  it('rejects a past dateFrom', () => {
    expect(() => validateDateRange('2026-06-14', '2026-06-15', '2026-06-15')).toThrow(
      expect.objectContaining({ code: 'INVALID_DATE_RANGE' }),
    );
  });

  it('rejects ranges longer than 30 included days', () => {
    expect(() => validateDateRange('2026-06-15', '2026-07-15', '2026-06-15')).toThrow(
      expect.objectContaining({ code: 'INVALID_DATE_RANGE' }),
    );
  });
});
