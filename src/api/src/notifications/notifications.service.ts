import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ApiError } from '../shared/api-error.js';
import {
  NotificationsRepository,
  Platform,
  SubscriptionRow,
  TimeWindow,
} from './notifications.repository.js';

const PLATFORMS: Platform[] = ['ios', 'android', 'web'];
const TIME_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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

    // 대상: studioIds 가 있으면 합주실 대상, 없고 areaIds 가 있으면 지역 대상,
    // 둘 다 비면 모든 지역(전체 검색) 대상. 빈 배열은 NULL 로 저장한다.
    const studioIds = optionalPositiveIntegerArray(input.studioIds, 'studioIds');
    const areaIds = studioIds ? null : optionalPositiveIntegerArray(input.areaIds, 'areaIds');

    const dates = parseDatesRequired(input.dates);
    const timeWindows = parseTimeWindows(input.timeWindows);

    const minDuration = optionalPositiveInteger(input.minDuration, 'minDuration') ?? 1;
    if (minDuration < 1 || minDuration > 4) {
      throw new ApiError(
        'INVALID_PARAMETER',
        'minDuration must be between 1 and 4',
        HttpStatus.BAD_REQUEST,
      );
    }
    const minCapacity = optionalPositiveInteger(input.minCapacity, 'minCapacity') ?? null;

    const row = await this.repository.createSubscription({
      deviceId: device.id,
      studioIds,
      areaIds,
      dates,
      timeWindows,
      minDuration,
      minCapacity,
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
  // scope 는 대상 형태로 역산한다(프런트 표시용).
  const scope: 'studios' | 'search' = row.studio_ids && row.studio_ids.length > 0 ? 'studios' : 'search';
  return {
    id: Number(row.id),
    scope,
    studioIds: row.studio_ids ? row.studio_ids.map(Number) : [],
    studios: row.studios ?? [],
    areaIds: row.area_ids ? row.area_ids.map(Number) : [],
    areas: row.areas ?? [],
    dates: row.dates,
    timeWindows: row.time_windows,
    minDuration: row.min_duration,
    minCapacity: row.min_capacity,
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

// 빈 배열/미지정은 NULL 로 정규화(매칭에서 "전체" 의미와 구분하기 위해).
function optionalPositiveIntegerArray(value: unknown, name: string): number[] | null {
  if (value === undefined || value === null) return null;
  if (!Array.isArray(value)) {
    throw new ApiError('INVALID_PARAMETER', `${name} must be an array`, HttpStatus.BAD_REQUEST);
  }
  const result: number[] = [];
  for (const item of value) {
    const num = typeof item === 'number' ? item : Number(item);
    if (!Number.isInteger(num) || num < 1) {
      throw new ApiError(
        'INVALID_PARAMETER',
        `${name} must contain positive integers`,
        HttpStatus.BAD_REQUEST,
      );
    }
    if (!result.includes(num)) result.push(num);
  }
  return result.length > 0 ? result : null;
}

function parseDatesRequired(value: unknown): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new ApiError('INVALID_PARAMETER', 'dates is required (YYYY-MM-DD[])', HttpStatus.BAD_REQUEST);
  }
  const result: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !DATE_PATTERN.test(item) || Number.isNaN(Date.parse(item))) {
      throw new ApiError('INVALID_PARAMETER', 'dates must be YYYY-MM-DD', HttpStatus.BAD_REQUEST);
    }
    if (!result.includes(item)) result.push(item);
  }
  return result;
}

function parseTimeWindows(value: unknown): TimeWindow[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    throw new ApiError('INVALID_PARAMETER', 'timeWindows must be an array', HttpStatus.BAD_REQUEST);
  }
  const result: TimeWindow[] = [];
  for (const item of value) {
    if (typeof item !== 'object' || item === null) {
      throw new ApiError('INVALID_PARAMETER', 'timeWindows items must be {from,to}', HttpStatus.BAD_REQUEST);
    }
    const { from, to } = item as Record<string, unknown>;
    const validFrom = typeof from === 'string' && TIME_PATTERN.test(from);
    const validTo = typeof to === 'string' && (TIME_PATTERN.test(to) || to === '24:00');
    if (!validFrom || !validTo || (from as string) >= (to as string)) {
      throw new ApiError(
        'INVALID_PARAMETER',
        'timeWindows must be {from:"HH:MM", to:"HH:MM"|"24:00"} with from < to',
        HttpStatus.BAD_REQUEST,
      );
    }
    result.push({ from: from as string, to: to as string });
  }
  return result;
}
