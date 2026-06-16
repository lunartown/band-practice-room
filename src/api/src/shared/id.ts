import { HttpStatus } from '@nestjs/common';
import { ApiError } from './api-error.js';

export function parseOptionalPositiveInteger(value: unknown, name: string) {
  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) {
    throw new ApiError(
      'INVALID_PARAMETER',
      `${name} must be a positive integer`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return Number(value);
}

export function parseOptionalPositiveIntegers(
  value: string | string[] | undefined,
  name: string,
): number[] | undefined {
  if (value === undefined) return undefined;

  const inputs = Array.isArray(value) ? value : value.split(',');
  const results: number[] = [];

  for (const item of inputs) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (!/^[1-9]\d*$/.test(trimmed)) {
      throw new ApiError(
        'INVALID_PARAMETER',
        `${name} must contain positive integers`,
        HttpStatus.BAD_REQUEST,
      );
    }
    results.push(Number(trimmed));
  }

  return results.length > 0 ? results : undefined;
}

const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/;

export function parseOptionalTime(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;

  if (typeof value !== 'string' || !timePattern.test(value)) {
    throw new ApiError(
      'INVALID_PARAMETER',
      `${name} must be HH:MM (e.g. 19:00)`,
      HttpStatus.BAD_REQUEST,
    );
  }

  return value;
}

export interface TimeWindow {
  from: string;
  to: string;
}

// 'from'은 00:00~23:59, 'to'는 00:01~24:00 (하루 끝 허용). from < to.
function isValidFrom(t: string) {
  return timePattern.test(t);
}
function isValidTo(t: string) {
  return timePattern.test(t) || t === '24:00';
}

/**
 * 다중 시간 윈도우를 파싱한다. 각 항목은 "HH:MM-HH:MM" 형식이며,
 * 반복 쿼리 파라미터(string[]) 또는 콤마 구분 문자열을 받는다.
 */
export function parseOptionalTimeWindows(
  value: string | string[] | undefined,
  name: string,
): TimeWindow[] | undefined {
  if (value === undefined) return undefined;

  const inputs = Array.isArray(value) ? value : value.split(',');
  const windows: TimeWindow[] = [];

  for (const item of inputs) {
    const trimmed = item.trim();
    if (!trimmed) continue;
    const [from, to] = trimmed.split('-');
    if (!from || !to || !isValidFrom(from) || !isValidTo(to) || from >= to) {
      throw new ApiError(
        'INVALID_PARAMETER',
        `${name} must be HH:MM-HH:MM with from < to (e.g. 18:00-22:00)`,
        HttpStatus.BAD_REQUEST,
      );
    }
    windows.push({ from, to });
  }

  return windows.length > 0 ? windows : undefined;
}
