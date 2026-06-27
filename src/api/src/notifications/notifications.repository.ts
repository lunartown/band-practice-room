import { Inject, Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';

export type Platform = 'ios' | 'android' | 'web';

export interface DeviceRow {
  id: string;
  device_token: string;
  platform: Platform;
  app_version: string | null;
  is_active: boolean;
}

export interface SubscriptionRow {
  id: string;
  device_id: string;
  studio_id: string | null;
  area_id: string | null;
  time_from: string | null;
  time_to: string | null;
  min_duration: number;
  weekdays: number[] | null;
  is_active: boolean;
  created_at: Date;
  studio_name: string | null;
  area_name: string | null;
}

export interface CreateSubscriptionInput {
  deviceId: string;
  studioId: number | null;
  areaId: number | null;
  timeFrom: string | null;
  timeTo: string | null;
  minDuration: number;
  weekdays: number[] | null;
}

@Injectable()
export class NotificationsRepository {
  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  // 같은 토큰이면 갱신(플랫폼/버전/last_seen). 토큰은 디바이스의 자연키다.
  async upsertDevice(input: {
    deviceToken: string;
    platform: Platform;
    appVersion: string | null;
  }): Promise<DeviceRow> {
    const result = await this.database.query<DeviceRow>(
      `
      INSERT INTO devices (device_token, platform, app_version, is_active, last_seen_at)
      VALUES ($1, $2, $3, true, NOW())
      ON CONFLICT (device_token) DO UPDATE SET
        platform = EXCLUDED.platform,
        app_version = EXCLUDED.app_version,
        is_active = true,
        last_seen_at = NOW()
      RETURNING id, device_token, platform, app_version, is_active
      `,
      [input.deviceToken, input.platform, input.appVersion],
    );
    return result.rows[0];
  }

  async findDeviceByToken(deviceToken: string): Promise<DeviceRow | null> {
    const result = await this.database.query<DeviceRow>(
      `SELECT id, device_token, platform, app_version, is_active
       FROM devices WHERE device_token = $1`,
      [deviceToken],
    );
    return result.rows[0] ?? null;
  }

  async createSubscription(input: CreateSubscriptionInput): Promise<SubscriptionRow> {
    const result = await this.database.query<{ id: string }>(
      `
      INSERT INTO notification_subscriptions
        (device_id, studio_id, area_id, time_from, time_to, min_duration, weekdays)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        input.deviceId,
        input.studioId,
        input.areaId,
        input.timeFrom,
        input.timeTo,
        input.minDuration,
        input.weekdays,
      ],
    );
    return (await this.findSubscription(result.rows[0].id))!;
  }

  async findSubscription(id: string): Promise<SubscriptionRow | null> {
    const result = await this.database.query<SubscriptionRow>(
      `${SUBSCRIPTION_SELECT} WHERE ns.id = $1`,
      [id],
    );
    return result.rows[0] ?? null;
  }

  async listSubscriptionsByDevice(deviceId: string): Promise<SubscriptionRow[]> {
    const result = await this.database.query<SubscriptionRow>(
      `${SUBSCRIPTION_SELECT} WHERE ns.device_id = $1 AND ns.is_active = true
       ORDER BY ns.created_at DESC`,
      [deviceId],
    );
    return result.rows;
  }

  // 소유권 확인을 위해 device_id 와 함께 비활성화한다(타 디바이스 구독을 못 지우게).
  async deactivateSubscription(id: string, deviceId: string): Promise<boolean> {
    const result = await this.database.query(
      `UPDATE notification_subscriptions
       SET is_active = false
       WHERE id = $1 AND device_id = $2 AND is_active = true`,
      [id, deviceId],
    );
    return (result.rowCount ?? 0) > 0;
  }
}

const SUBSCRIPTION_SELECT = `
  SELECT
    ns.id, ns.device_id, ns.studio_id, ns.area_id,
    ns.time_from::text AS time_from, ns.time_to::text AS time_to,
    ns.min_duration, ns.weekdays, ns.is_active, ns.created_at,
    st.name AS studio_name, a.name AS area_name
  FROM notification_subscriptions ns
  LEFT JOIN studios st ON st.id = ns.studio_id
  LEFT JOIN areas a ON a.id = ns.area_id
`;
