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
