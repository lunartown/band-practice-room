import { HttpStatus } from '@nestjs/common';
import { ApiError } from '../shared/api-error.js';

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const millisecondsPerDay = 24 * 60 * 60 * 1000;

export interface DateRange {
  dateFrom: string;
  dateTo: string;
}

export function validateDateRange(
  dateFrom: unknown,
  dateTo: unknown,
  today = getTodayInKst(),
): DateRange {
  if (dateFrom === undefined || dateTo === undefined) {
    throw new ApiError(
      'MISSING_PARAMETER',
      'dateFrom and dateTo are required',
      HttpStatus.BAD_REQUEST,
    );
  }

  if (typeof dateFrom !== 'string' || typeof dateTo !== 'string') {
    throwInvalidDate();
  }

  if (!isValidDateString(dateFrom) || !isValidDateString(dateTo)) {
    throwInvalidDate();
  }

  if (dateFrom < today) {
    throw new ApiError(
      'INVALID_DATE_RANGE',
      'dateFrom must not be in the past',
      HttpStatus.BAD_REQUEST,
    );
  }

  if (dateTo < dateFrom) {
    throw new ApiError(
      'INVALID_DATE_RANGE',
      'dateTo must be greater than or equal to dateFrom',
      HttpStatus.BAD_REQUEST,
    );
  }

  const includedDays = getIncludedDays(dateFrom, dateTo);
  if (includedDays > 30) {
    throw new ApiError(
      'INVALID_DATE_RANGE',
      'dateTo must be within 30 included days from dateFrom',
      HttpStatus.BAD_REQUEST,
    );
  }

  return { dateFrom, dateTo };
}

export function getTodayInKst() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function isValidDateString(value: string) {
  if (!datePattern.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function getIncludedDays(dateFrom: string, dateTo: string) {
  const from = Date.parse(`${dateFrom}T00:00:00.000Z`);
  const to = Date.parse(`${dateTo}T00:00:00.000Z`);
  return Math.floor((to - from) / millisecondsPerDay) + 1;
}

function throwInvalidDate(): never {
  throw new ApiError(
    'INVALID_DATE',
    'dateFrom and dateTo must be YYYY-MM-DD',
    HttpStatus.BAD_REQUEST,
  );
}
