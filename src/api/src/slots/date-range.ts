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

// KST 기준 "지금"을 (오늘 날짜, 현재 시각 HH:MM:SS)으로 돌려준다.
// 오늘 날짜 조회 시 현재 시각보다 늦게 시작하는 슬롯만 남기는 컷오프로 쓴다.
// 시간 단위 슬롯이라, 지금이 2시 몇 분이면 진행 중인 2시 슬롯은 빠지고 3시부터 노출된다.
export function getNowInKst(now: Date = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  let hour = get('hour');
  if (hour === '24') hour = '00'; // 일부 런타임은 자정을 '24'로 반환한다.
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${hour}:${get('minute')}:${get('second')}`,
  };
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
