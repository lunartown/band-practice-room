import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApiError } from '../shared/api-error.js';
import {
  NotificationsRepository,
  Platform,
  SubscriptionRow,
} from './notifications.repository.js';

const PLATFORMS: Platform[] = ['ios', 'android', 'web'];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;

@Injectable()
export class NotificationsService {
  constructor(
    @Inject(NotificationsRepository) private readonly repository: NotificationsRepository,
  ) {}

  async registerDevice(body: unknown) {
    const input = assertRecord(body);
    const deviceToken = assertNonEmptyString(input.deviceToken, 'deviceToken');
    const platform = assertEnum(input.platform, 'platform', PLATFORMS);
    const appVersion = optionalString(input.appVersion, 'appVersion');

    const device = await this.repository.upsertDevice({ deviceToken, platform, appVersion });
    return { deviceId: Number(device.id), platform: device.platform };
  }

  async createSubscription(body: unknown) {
    const input = assertRecord(body);
    const deviceToken = assertNonEmptyString(input.deviceToken, 'deviceToken');
    const device = await this.repository.findDeviceByToken(deviceToken);
    if (!device) {
      throw new ApiError('DEVICE_NOT_FOUND', '먼저 디바이스를 등록해 주세요', HttpStatus.NOT_FOUND);
    }

    const studioId = optionalPositiveInteger(input.studioId, 'studioId');
    const areaId = optionalPositiveInteger(input.areaId, 'areaId');
    if (studioId === null && areaId === null) {
      throw new ApiError(
        'INVALID_PARAMETER',
        'studioId 또는 areaId 중 최소 하나는 필요합니다',
        HttpStatus.BAD_REQUEST,
      );
    }

    const timeFrom = optionalTime(input.timeFrom, 'timeFrom');
    const timeTo = optionalTime(input.timeTo, 'timeTo');
    if (timeFrom !== null && timeTo !== null && timeFrom >= timeTo) {
      throw new ApiError('INVALID_PARAMETER', 'timeFrom must be < timeTo', HttpStatus.BAD_REQUEST);
    }

    const minDuration = optionalPositiveInteger(input.minDuration, 'minDuration') ?? 1;
    if (minDuration < 1 || minDuration > 4) {
      throw new ApiError(
        'INVALID_PARAMETER',
        'minDuration must be between 1 and 4',
        HttpStatus.BAD_REQUEST,
      );
    }

    const weekdays = optionalWeekdays(input.weekdays, 'weekdays');

    const row = await this.repository.createSubscription({
      deviceId: device.id,
      studioId,
      areaId,
      timeFrom,
      timeTo,
      minDuration,
      weekdays,
    });
    return toSubscriptionDto(row);
  }

  async listSubscriptions(deviceToken: unknown) {
    const token = assertNonEmptyString(deviceToken, 'deviceToken');
    const device = await this.repository.findDeviceByToken(token);
    if (!device) {
      return { items: [] };
    }
    const rows = await this.repository.listSubscriptionsByDevice(device.id);
    return { items: rows.map(toSubscriptionDto) };
  }

  async deleteSubscription(id: number, body: unknown) {
    const input = assertRecord(body);
    const deviceToken = assertNonEmptyString(input.deviceToken, 'deviceToken');
    const device = await this.repository.findDeviceByToken(deviceToken);
    if (!device) {
      throw new ApiError('DEVICE_NOT_FOUND', '디바이스를 찾을 수 없습니다', HttpStatus.NOT_FOUND);
    }
    const removed = await this.repository.deactivateSubscription(String(id), device.id);
    if (!removed) {
      throw new ApiError('SUBSCRIPTION_NOT_FOUND', '구독을 찾을 수 없습니다', HttpStatus.NOT_FOUND);
    }
    return { ok: true };
  }
}

function toSubscriptionDto(row: SubscriptionRow) {
  return {
    id: Number(row.id),
    studioId: row.studio_id == null ? null : Number(row.studio_id),
    studioName: row.studio_name,
    areaId: row.area_id == null ? null : Number(row.area_id),
    areaName: row.area_name,
    timeFrom: row.time_from,
    timeTo: row.time_to,
    minDuration: row.min_duration,
    weekdays: row.weekdays,
    createdAt: row.created_at instanceof Date ? row.created_at.toISOString() : row.created_at,
  };
}

function assertRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ApiError('INVALID_BODY', '요청 본문이 올바르지 않습니다', HttpStatus.BAD_REQUEST);
  }
  return value as Record<string, unknown>;
}

function assertNonEmptyString(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ApiError('INVALID_PARAMETER', `${name} is required`, HttpStatus.BAD_REQUEST);
  }
  return value.trim();
}

function optionalString(value: unknown, name: string): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== 'string') {
    throw new ApiError('INVALID_PARAMETER', `${name} must be a string`, HttpStatus.BAD_REQUEST);
  }
  return value.trim() || null;
}

function assertEnum<T extends string>(value: unknown, name: string, allowed: T[]): T {
  if (typeof value !== 'string' || !allowed.includes(value as T)) {
    throw new ApiError(
      'INVALID_PARAMETER',
      `${name} must be one of ${allowed.join(', ')}`,
      HttpStatus.BAD_REQUEST,
    );
  }
  return value as T;
}

function optionalPositiveInteger(value: unknown, name: string): number | null {
  if (value === undefined || value === null) return null;
  const num = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(num) || num < 1) {
    throw new ApiError(
      'INVALID_PARAMETER',
      `${name} must be a positive integer`,
      HttpStatus.BAD_REQUEST,
    );
  }
  return num;
}

function optionalTime(value: unknown, name: string): string | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value !== 'string' || !TIME_PATTERN.test(value)) {
    throw new ApiError('INVALID_PARAMETER', `${name} must be HH:MM`, HttpStatus.BAD_REQUEST);
  }
  return value;
}

function optionalWeekdays(value: unknown, name: string): number[] | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) {
    throw new ApiError('INVALID_PARAMETER', `${name} must be an array`, HttpStatus.BAD_REQUEST);
  }
  const result: number[] = [];
  for (const item of value) {
    const num = typeof item === 'number' ? item : Number(item);
    if (!Number.isInteger(num) || num < 0 || num > 6) {
      throw new ApiError(
        'INVALID_PARAMETER',
        `${name} must contain integers 0(Sun)~6(Sat)`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!result.includes(num)) result.push(num);
  }
  return result.length > 0 ? result : null;
}
