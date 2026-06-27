import { Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { PushMessage, SendResult, isConfigured, sendPush } from './fcm.js';

// 한 번 실행에서 소비할 최대 이벤트 수(폭주 방지).
const EVENT_BATCH = Number(process.env.NOTIFY_EVENT_BATCH ?? 500);

interface ClaimedEvent {
  id: string;
  room_id: string;
  slot_date: string;
  slot_start_time: string;
}

interface CandidateRow {
  subscription_id: string;
  device_id: string;
  device_token: string;
  studio_id: string;
  studio_name: string;
  room_id: string;
  room_name: string;
  slot_date: string;
  slot_start_time: string;
  min_duration: number;
}

export interface DispatchSummary {
  claimedEvents: number;
  candidates: number;
  sent: number;
  failed: number;
  deactivatedDevices: number;
  dryRun: boolean;
}

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async dispatch(): Promise<DispatchSummary> {
    const dryRun = !(await isConfigured());

    // 1) 미처리 이벤트를 클레임(processed_at 표시). 매칭 여부와 무관하게 다시 처리되지 않는다.
    const events = await this.claimEvents(EVENT_BATCH);
    if (events.length === 0) {
      return { claimedEvents: 0, candidates: 0, sent: 0, failed: 0, deactivatedDevices: 0, dryRun };
    }

    // 2) 클레임한 이벤트를 구독과 매칭.
    const candidates = await this.matchCandidates(events);
    if (candidates.length === 0) {
      return {
        claimedEvents: events.length,
        candidates: 0,
        sent: 0,
        failed: 0,
        deactivatedDevices: 0,
        dryRun,
      };
    }

    // 3) FCM 메시지 구성 + 전송.
    const messages: PushMessage[] = candidates.map((c) => ({
      token: c.device_token,
      title: `${c.studio_name} 빈자리`,
      body: `${c.room_name} · ${formatDate(c.slot_date)} ${c.slot_start_time.slice(0, 5)} 예약 가능`,
      data: {
        type: 'slot_available',
        studioId: String(c.studio_id),
        roomId: String(c.room_id),
        date: c.slot_date,
        startTime: c.slot_start_time.slice(0, 5),
      },
    }));

    const results = await sendPush(messages);

    // 4) 발송 로그 기록 + 무효 토큰 디바이스 비활성화.
    let sent = 0;
    let failed = 0;
    const invalidDeviceIds = new Set<string>();
    for (let i = 0; i < candidates.length; i++) {
      const c = candidates[i];
      const r: SendResult = results[i];
      if (r.success) sent++;
      else failed++;
      if (r.invalidToken) invalidDeviceIds.add(c.device_id);
      await this.recordDelivery(c, r);
    }

    for (const deviceId of invalidDeviceIds) {
      await this.database.query(`UPDATE devices SET is_active = false WHERE id = $1`, [deviceId]);
    }

    const summary: DispatchSummary = {
      claimedEvents: events.length,
      candidates: candidates.length,
      sent,
      failed,
      deactivatedDevices: invalidDeviceIds.size,
      dryRun,
    };
    this.logger.log(
      `dispatch 완료: 이벤트 ${events.length} / 후보 ${candidates.length} / 발송 ${sent} / 실패 ${failed}` +
        (dryRun ? ' (dry-run: FCM 미설정)' : ''),
    );
    return summary;
  }

  private async claimEvents(limit: number): Promise<ClaimedEvent[]> {
    const result = await this.database.query<ClaimedEvent>(
      `
      UPDATE slot_available_events
      SET processed_at = NOW()
      WHERE id IN (
        SELECT id FROM slot_available_events
        WHERE processed_at IS NULL
        ORDER BY detected_at ASC
        LIMIT $1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING id, room_id, slot_date::text AS slot_date, slot_start_time::text AS slot_start_time
      `,
      [limit],
    );
    return result.rows;
  }

  private async matchCandidates(events: ClaimedEvent[]): Promise<CandidateRow[]> {
    // 클레임한 이벤트를 (room_id, date, start_time) 배열로 풀어 매칭 대상으로 쓴다.
    const roomIds = events.map((e) => e.room_id);
    const dates = events.map((e) => e.slot_date);
    const starts = events.map((e) => e.slot_start_time);

    const result = await this.database.query<CandidateRow>(
      `
      WITH events AS (
        SELECT DISTINCT ev.room_id, ev.slot_date, ev.slot_start_time, r.studio_id,
               r.name AS room_name, s.name AS studio_name
        FROM unnest($1::bigint[], $2::date[], $3::time[])
               AS ev(room_id, slot_date, slot_start_time)
        INNER JOIN rooms r ON r.id = ev.room_id AND r.is_active = true
        INNER JOIN studios s ON s.id = r.studio_id AND s.is_active = true
        -- 지나간 시간대는 알릴 의미가 없다(KST 기준 미래 슬롯만).
        WHERE ev.slot_date > (NOW() AT TIME ZONE 'Asia/Seoul')::date
           OR (ev.slot_date = (NOW() AT TIME ZONE 'Asia/Seoul')::date
               AND ev.slot_start_time > (NOW() AT TIME ZONE 'Asia/Seoul')::time)
      )
      SELECT
        ns.id AS subscription_id,
        d.id AS device_id,
        d.device_token,
        e.studio_id,
        e.studio_name,
        e.room_id,
        e.room_name,
        e.slot_date::text AS slot_date,
        e.slot_start_time::text AS slot_start_time,
        ns.min_duration
      FROM events e
      INNER JOIN notification_subscriptions ns ON ns.is_active = true
        AND (
          (ns.studio_id IS NOT NULL AND ns.studio_id = e.studio_id)
          OR (ns.area_id IS NOT NULL AND EXISTS (
                SELECT 1 FROM studio_areas sa
                WHERE sa.studio_id = e.studio_id AND sa.area_id = ns.area_id
             ))
        )
      INNER JOIN devices d ON d.id = ns.device_id AND d.is_active = true
      WHERE
        (ns.weekdays IS NULL OR EXTRACT(DOW FROM e.slot_date)::int = ANY(ns.weekdays))
        AND (ns.time_from IS NULL OR e.slot_start_time >= ns.time_from)
        AND (ns.time_to IS NULL OR e.slot_start_time < ns.time_to)
        -- 최소 연속 가능 시간: 같은 방·날짜에서 시작시각부터 N시간 연속 AVAILABLE 인지 확인.
        AND (
          SELECT count(*) FROM slots x
          WHERE x.room_id = e.room_id
            AND x.date = e.slot_date
            AND x.status = 'AVAILABLE'
            AND EXTRACT(HOUR FROM x.start_time) >= EXTRACT(HOUR FROM e.slot_start_time)
            AND EXTRACT(HOUR FROM x.start_time) < EXTRACT(HOUR FROM e.slot_start_time) + ns.min_duration
        ) >= ns.min_duration
        -- 같은 구독·슬롯에 이미 보냈으면 제외.
        AND NOT EXISTS (
          SELECT 1 FROM notification_deliveries nd
          WHERE nd.subscription_id = ns.id
            AND nd.room_id = e.room_id
            AND nd.slot_date = e.slot_date
            AND nd.slot_start_time = e.slot_start_time
        )
      `,
      [roomIds, dates, starts],
    );
    return result.rows;
  }

  private async recordDelivery(c: CandidateRow, r: SendResult): Promise<void> {
    await this.database.query(
      `
      INSERT INTO notification_deliveries
        (subscription_id, device_id, room_id, slot_date, slot_start_time, status, error)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (subscription_id, room_id, slot_date, slot_start_time) DO NOTHING
      `,
      [
        c.subscription_id,
        c.device_id,
        c.room_id,
        c.slot_date,
        c.slot_start_time,
        r.success ? 'SENT' : 'FAILED',
        r.error ?? null,
      ],
    );
  }
}

function formatDate(isoDate: string): string {
  // YYYY-MM-DD → M/D
  const [, m, d] = isoDate.split('-');
  return `${Number(m)}/${Number(d)}`;
}
