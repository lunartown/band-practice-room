import { Inject, Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service.js';
import { PushMessage, SendResult, isConfigured, sendPush } from './fcm.js';

// 한 배치에서 소비할 이벤트 수. 큐가 빌 때까지 배치를 반복한다(아래 MAX_ROUNDS 참고).
// 테스트에서 배치 크기를 바꿀 수 있게 호출 시점에 읽는다.
function eventBatchSize(): number {
  return Number(process.env.NOTIFY_EVENT_BATCH ?? 500);
}

// 한 실행이 소진할 최대 배치 수(폭주 백스톱). 자정에 새 날짜가 열리며 이벤트가
// 수천 건 쏟아져도 기본 500 × 40 = 2만 건까지 한 번에 처리한다.
const MAX_ROUNDS = Number(process.env.NOTIFY_MAX_ROUNDS ?? 40);

interface ClaimedEvent {
  id: string;
  room_id: string;
  slot_date: string;
  slot_start_time: string;
}

export interface CandidateRow {
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

interface CoalescedCandidates {
  pushCandidates: PushCandidate[];
  skippedCandidates: CandidateRow[];
}

interface PushCandidate {
  candidate: CandidateRow;
  slotCount: number;
}

export interface DispatchSummary {
  claimedEvents: number;
  candidates: number;
  sent: number;
  failed: number;
  deactivatedDevices: number;
  expiredSubscriptions: number;
  dryRun: boolean;
}

@Injectable()
export class NotificationDispatcher {
  private readonly logger = new Logger(NotificationDispatcher.name);

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  async dispatch(): Promise<DispatchSummary> {
    const dryRun = !(await isConfigured());

    // 0) 지난 날짜만 남은 구독은 더 매칭될 수 없으므로 비활성화한다(내 알림 목록에서도 사라진다).
    const expiredSubscriptions = await this.deactivateExpiredSubscriptions();

    const summary: DispatchSummary = {
      claimedEvents: 0,
      candidates: 0,
      sent: 0,
      failed: 0,
      deactivatedDevices: 0,
      expiredSubscriptions,
      dryRun,
    };

    // 이벤트 큐가 빌 때까지 배치 단위로 소진한다. 새 날짜가 수집 범위에 들어오며
    // 이벤트가 한꺼번에 쌓여도 이번 실행에서 처리해, 뒤에 온 실시간 변동이 다음
    // 실행(최대 1시간 뒤)으로 밀리지 않게 한다.
    const invalidDeviceIds = new Set<string>();
    let skippedTotal = 0;
    for (let round = 0; round < MAX_ROUNDS; round++) {
      // 1) 미처리 이벤트를 클레임(processed_at 표시). 매칭 여부와 무관하게 다시 처리되지 않는다.
      const events = await this.claimEvents(eventBatchSize());
      if (events.length === 0) break;
      summary.claimedEvents += events.length;

      // 2) 클레임한 이벤트를 구독과 매칭.
      const candidates = await this.matchCandidates(events);
      if (candidates.length === 0) continue;

      // 3) 같은 디바이스에 매칭된 후보는 푸시 1건으로 묶는다.
      const { pushCandidates, skippedCandidates } = coalesceDeviceCandidates(candidates);
      summary.candidates += pushCandidates.length;
      skippedTotal += skippedCandidates.length;

      // 4) FCM 메시지 구성 + 전송.
      const messages: PushMessage[] = pushCandidates.map(({ candidate: c, slotCount }) => ({
        token: c.device_token,
        title: slotCount === 1 ? `${c.studio_name} 빈자리` : `빈자리 ${slotCount}개`,
        body:
          slotCount === 1
            ? `${c.room_name} · ${formatDate(c.slot_date)} ${c.slot_start_time.slice(0, 5)} 예약 가능`
            : `${c.studio_name} ${c.room_name} · ${formatDate(c.slot_date)} ${c.slot_start_time.slice(0, 5)} 외 ${slotCount - 1}건`,
        data: {
          type: 'slot_available',
          studioId: String(c.studio_id),
          roomId: String(c.room_id),
          date: c.slot_date,
          startTime: c.slot_start_time.slice(0, 5),
          slotCount: String(slotCount),
        },
      }));

      const results = await sendPush(messages);

      // 5) 발송 로그 기록 + 무효 토큰 수집.
      for (let i = 0; i < pushCandidates.length; i++) {
        const c = pushCandidates[i].candidate;
        const r: SendResult = results[i];
        if (r.success) summary.sent++;
        else summary.failed++;
        if (r.invalidToken) invalidDeviceIds.add(c.device_id);
        await this.recordDelivery(c, r.success ? 'SENT' : 'FAILED', r.error ?? null);
      }

      for (const c of skippedCandidates) {
        await this.recordDelivery(c, 'SKIPPED', 'bundled into device notification');
      }
    }

    // 6) 무효 토큰 디바이스 비활성화.
    for (const deviceId of invalidDeviceIds) {
      await this.database.query(`UPDATE devices SET is_active = false WHERE id = $1`, [deviceId]);
    }
    summary.deactivatedDevices = invalidDeviceIds.size;

    const remaining = await this.countUnprocessedEvents();
    if (remaining > 0) {
      this.logger.warn(`이벤트 ${remaining}건이 남았습니다(라운드 상한 ${MAX_ROUNDS} 도달). 다음 실행에서 이어집니다.`);
    }
    this.logger.log(
      `dispatch 완료: 이벤트 ${summary.claimedEvents} / 발송 후보 ${summary.candidates}` +
        (skippedTotal ? ` / 묶음 제외 ${skippedTotal}` : '') +
        ` / 발송 ${summary.sent} / 실패 ${summary.failed}` +
        (expiredSubscriptions ? ` / 만료 구독 ${expiredSubscriptions}` : '') +
        (dryRun ? ' (dry-run: FCM 미설정)' : ''),
    );
    return summary;
  }

  // 모든 날짜가 지난(KST) 구독을 비활성화한다. 매시 dispatch 앞에서 정리된다.
  private async deactivateExpiredSubscriptions(): Promise<number> {
    const result = await this.database.query(
      `
      UPDATE notification_subscriptions ns
      SET is_active = false
      WHERE ns.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM unnest(ns.dates) AS d(date)
          WHERE d.date >= (NOW() AT TIME ZONE 'Asia/Seoul')::date
        )
      `,
    );
    return result.rowCount ?? 0;
  }

  private async countUnprocessedEvents(): Promise<number> {
    const result = await this.database.query<{ count: string }>(
      `SELECT count(*) AS count FROM slot_available_events WHERE processed_at IS NULL`,
    );
    return Number(result.rows[0].count);
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
      -- 1) 클레임한 이벤트 슬롯(미래만). 트리거가 막 가용으로 바꾼 시각들.
      WITH ev AS (
        SELECT DISTINCT t.room_id, t.slot_date, t.slot_start_time
        FROM unnest($1::bigint[], $2::date[], $3::time[])
               AS t(room_id, slot_date, slot_start_time)
        -- 지나간 전이는 알릴 의미가 없다(KST 기준 미래 슬롯만).
        WHERE t.slot_date > (NOW() AT TIME ZONE 'Asia/Seoul')::date
           OR (t.slot_date = (NOW() AT TIME ZONE 'Asia/Seoul')::date
               AND t.slot_start_time > (NOW() AT TIME ZONE 'Asia/Seoul')::time)
      ),
      -- 2) 이벤트가 가리키는 방·날짜의 모든 가용 슬롯(연속 구간 계산용, 과거 시각도 포함해야 인접 판정 가능).
      avail AS (
        SELECT s.room_id, s.date, EXTRACT(HOUR FROM s.start_time)::int AS h
        FROM slots s
        JOIN (SELECT DISTINCT room_id, slot_date FROM ev) rd
          ON rd.room_id = s.room_id AND rd.slot_date = s.date
        WHERE s.status = 'AVAILABLE'
      ),
      -- 3) gaps-and-islands: 연속된 시(時)는 (h - row_number) 가 일정 → 같은 구간(grp).
      islands AS (
        SELECT room_id, date, h,
               h - ROW_NUMBER() OVER (PARTITION BY room_id, date ORDER BY h) AS grp
        FROM avail
      ),
      -- 4) 각 가용 시각에 자신이 속한 연속 구간의 시작 시(時)·길이를 붙인다.
      runs AS (
        SELECT room_id, date, h,
               MIN(h) OVER (PARTITION BY room_id, date, grp) AS run_start_hour,
               COUNT(*) OVER (PARTITION BY room_id, date, grp) AS run_len
        FROM islands
      ),
      -- 5) 이벤트 슬롯이 속한 연속 구간으로 환원. 같은 구간을 가리키는 여러 이벤트는 하나로 모은다
      --    → 알림은 "구간 시작 시각" 1건만(블록당 1알림). 늦게 열려 완성된 블록도 여기서 잡힌다.
      blocks AS (
        SELECT DISTINCT
          ev.room_id, ev.slot_date,
          make_time(r.run_start_hour, 0, 0) AS slot_start_time,
          r.run_start_hour,
          r.run_len,
          rm.studio_id, rm.name AS room_name, rm.capacity_max, st.name AS studio_name
        FROM ev
        JOIN runs r ON r.room_id = ev.room_id AND r.date = ev.slot_date
                   AND r.h = EXTRACT(HOUR FROM ev.slot_start_time)::int
        INNER JOIN rooms rm ON rm.id = ev.room_id AND rm.is_active = true
        INNER JOIN studios st ON st.id = rm.studio_id AND st.is_active = true
      )
      SELECT
        ns.id AS subscription_id,
        d.id AS device_id,
        d.device_token,
        b.studio_id,
        b.studio_name,
        b.room_id,
        b.room_name,
        b.slot_date::text AS slot_date,
        b.slot_start_time::text AS slot_start_time,
        ns.min_duration
      FROM blocks b
      INNER JOIN notification_subscriptions ns ON ns.is_active = true
        -- 대상: 합주실 목록 / 지역 목록 / (둘 다 NULL 이면) 모든 지역
        AND (
          (ns.studio_ids IS NOT NULL AND b.studio_id = ANY(ns.studio_ids))
          OR (ns.studio_ids IS NULL AND ns.area_ids IS NOT NULL AND EXISTS (
                SELECT 1 FROM studio_areas sa
                WHERE sa.studio_id = b.studio_id AND sa.area_id = ANY(ns.area_ids)
             ))
          OR (ns.studio_ids IS NULL AND ns.area_ids IS NULL)
        )
      -- 토큰이 회수된(다른 설치로 옮겨간) 디바이스는 발송 대상에서 제외한다.
      INNER JOIN devices d ON d.id = ns.device_id AND d.is_active = true AND d.device_token IS NOT NULL
      WHERE
        -- 특정 날짜 필터
        b.slot_date = ANY(ns.dates)
        -- 최소 연속 가능 시간: 이벤트 슬롯이 속한 구간 길이가 N 이상이어야 한다(시작 순서 무관).
        AND b.run_len >= ns.min_duration
        -- 시간대 필터: 윈도우가 없으면 모든 시간. 있으면 "윈도우 안에서 시작하는
        -- min_duration 연속 가용"이 존재해야 한다. 구간이 윈도우보다 일찍 시작해도
        -- (예: 18시부터 비어 있고 윈도우가 19시~) 시작점을 윈도우 안으로 당겨(GREATEST)
        -- 판정하므로 놓치지 않는다. 윈도우가 분 단위면 시(時) 경계로 보수적으로 올림한다.
        AND (
          jsonb_array_length(ns.time_windows) = 0
          OR EXISTS (
            SELECT 1
            FROM jsonb_array_elements(ns.time_windows) AS w
            CROSS JOIN LATERAL (
              SELECT
                EXTRACT(HOUR FROM (w->>'from')::time)::int
                  + CASE WHEN EXTRACT(MINUTE FROM (w->>'from')::time) > 0 THEN 1 ELSE 0 END
                  AS start_h,
                CASE
                  WHEN (w->>'to') = '24:00' THEN 24
                  ELSE EXTRACT(HOUR FROM (w->>'to')::time)::int
                    + CASE WHEN EXTRACT(MINUTE FROM (w->>'to')::time) > 0 THEN 1 ELSE 0 END
                END AS end_h
            ) AS win
            -- 윈도우 안 시작점(구간 시작을 윈도우 시작으로 당긴 값)이 윈도우 안이고,
            -- 그 시작점부터 min_duration 시간이 구간 끝을 넘지 않아야 한다.
            WHERE GREATEST(b.run_start_hour, win.start_h) < win.end_h
              AND GREATEST(b.run_start_hour, win.start_h) + ns.min_duration
                  <= b.run_start_hour + b.run_len
          )
        )
        -- 인원 필터: capacity_max 가 없으면(미상) 통과
        AND (ns.min_capacity IS NULL OR b.capacity_max IS NULL OR b.capacity_max >= ns.min_capacity)
        -- 같은 구독·구간 시작에 이미 보냈으면 제외(블록당 1회).
        AND NOT EXISTS (
          SELECT 1 FROM notification_deliveries nd
          WHERE nd.subscription_id = ns.id
            AND nd.room_id = b.room_id
            AND nd.slot_date = b.slot_date
            AND nd.slot_start_time = b.slot_start_time
        )
      ORDER BY b.slot_date, b.slot_start_time, b.room_id, d.id, ns.id
      `,
      [roomIds, dates, starts],
    );
    return result.rows;
  }

  private async recordDelivery(
    c: CandidateRow,
    status: 'SENT' | 'FAILED' | 'SKIPPED',
    error: string | null,
  ): Promise<void> {
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
        status,
        error,
      ],
    );
  }
}

export function coalesceDeviceCandidates(candidates: CandidateRow[]): CoalescedCandidates {
  const pushCandidates: PushCandidate[] = [];
  const skippedCandidates: CandidateRow[] = [];
  const byDevice = new Map<string, CandidateRow[]>();

  for (const candidate of candidates) {
    const group = byDevice.get(candidate.device_id);
    if (group) group.push(candidate);
    else byDevice.set(candidate.device_id, [candidate]);
  }

  for (const group of byDevice.values()) {
    group.sort(compareCandidateForDeviceBundle);
    pushCandidates.push({
      candidate: group[0],
      slotCount: new Set(group.map(deviceSlotKey)).size,
    });
    skippedCandidates.push(...group.slice(1));
  }

  return { pushCandidates, skippedCandidates };
}

function deviceSlotKey(candidate: CandidateRow): string {
  return [
    candidate.room_id,
    candidate.slot_date,
    candidate.slot_start_time,
  ].join('|');
}

function compareCandidateForDeviceBundle(a: CandidateRow, b: CandidateRow): number {
  const slotCompare =
    a.slot_date.localeCompare(b.slot_date) ||
    a.slot_start_time.localeCompare(b.slot_start_time) ||
    compareBigIntString(a.room_id, b.room_id);
  if (slotCompare !== 0) return slotCompare;
  return compareBigIntString(a.subscription_id, b.subscription_id);
}

function compareBigIntString(a: string, b: string): number {
  const aid = BigInt(a);
  const bid = BigInt(b);
  if (aid < bid) return -1;
  if (aid > bid) return 1;
  return 0;
}

function formatDate(isoDate: string): string {
  // YYYY-MM-DD → M/D
  const [, m, d] = isoDate.split('-');
  return `${Number(m)}/${Number(d)}`;
}
