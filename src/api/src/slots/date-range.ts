import { HttpStatus } from '@nestjs/common';
import { ApiError } from '../shared/api-error.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DATES = 30;
const DEFAULT_DAYS = 7;

export function parseDates(
  raw: string | string[] | undefined,
  today = getTodayInKst(),
): string[] {
  if (!raw || (Array.isArray(raw) && raw.length === 0)) {
    return defaultDates(today);
  }

  const inputs = Array.isArray(raw) ? raw : raw.split(',');
  const dates = inputs.map((d) => d.trim()).filter(Boolean);

  if (dates.length === 0) return defaultDates(today);

  if (dates.length > MAX_DATES) {
    throw new ApiError(
      'INVALID_PARAMETER',
      `dates must not exceed ${MAX_DATES}`,
      HttpStatus.BAD_REQUEST,
    );
  }

  for (const date of dates) {
    if (!isValidDateString(date)) {
      throw new ApiError(
        'INVALID_DATE',
        `Invalid date: ${date}. Must be YYYY-MM-DD`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (date < today) {
      throw new ApiError(
        'INVALID_DATE',
        `Date must not be in the past: ${date}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  return [...new Set(dates)].sort();
}

export function getTodayInKst() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function defaultDates(today: string): string[] {
  return Array.from({ length: DEFAULT_DAYS }, (_, i) => addDays(today, i));
}

function isValidDateString(value: string) {
  if (!datePattern.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function addDays(date: string, days: number) {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}
