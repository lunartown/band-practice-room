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
