// Dispatcher 통합 테스트 — 실제 Postgres 가 필요하다.
// 트리거(전이 감지)·매칭 SQL(대상/시간대/인원/연속시간/중복 제외)·멱등성을 한 번에 검증한다.
//
// 실행: 로컬에 테스트용 Postgres 를 띄우고
//   RUN_DB_TESTS=1 DATABASE_URL=postgres://user:pw@127.0.0.1:5432/db DATABASE_SSL=false npm test
// DB 가 없는 CI 에서는 자동으로 skip 된다(공유/운영 DB 에는 절대 붙지 않는다).
import { DatabaseService } from '../database/database.service.js';
import { NotificationDispatcher } from './dispatcher.service.js';

const runDbTests = process.env.RUN_DB_TESTS === '1';
const describeDb = runDbTests ? describe : describe.skip;

describeDb('NotificationDispatcher (integration)', () => {
  let db: DatabaseService;
  let dispatcher: NotificationDispatcher;

  // beforeAll 에서 채우는 고정 fixture.
  let areaId: number;
  let otherAreaId: number;
  let studioId: number;
  let otherStudioId: number;
  let roomId: number; // capacity_max 4, studioId 소속
  let otherRoomId: number; // otherStudioId 소속
  let futureDate: string; // KST 기준 미래 날짜(필터 통과 보장)

  // beforeAll 전용: base fixture(area/studio/room)까지 싹 비워 재실행에도 멱등하게 만든다.
  async function reset() {
    await db.query(
      `TRUNCATE notification_deliveries, slot_available_events, notification_subscriptions,
                devices, slots, studio_areas, rooms, studios, areas RESTART IDENTITY CASCADE`,
    );
  }

  // 슬롯을 AVAILABLE 로 INSERT → 트리거가 이벤트를 만든다(실제 경로).
  async function insertAvailableSlot(room: number, date: string, start: string, end: string) {
    await db.query(
      `INSERT INTO slots (room_id, date, start_time, end_time, status, price_source, scraped_at)
       VALUES ($1, $2, $3, $4, 'AVAILABLE', 'UNKNOWN', NOW())`,
      [room, date, start, end],
    );
  }

  async function createDevice(token: string): Promise<number> {
    const r = await db.query<{ id: string }>(
      `INSERT INTO devices (device_token, platform) VALUES ($1, 'ios') RETURNING id`,
      [token],
    );
    return Number(r.rows[0].id);
  }

  async function createSubscription(input: {
    deviceId: number;
    studioIds?: number[] | null;
    areaIds?: number[] | null;
    dates: string[];
    timeWindows?: Array<{ from: string; to: string }>;
    minDuration?: number;
    minCapacity?: number | null;
  }): Promise<number> {
    const r = await db.query<{ id: string }>(
      `INSERT INTO notification_subscriptions
         (device_id, studio_ids, area_ids, dates, time_windows, min_duration, min_capacity)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7) RETURNING id`,
      [
        input.deviceId,
        input.studioIds ?? null,
        input.areaIds ?? null,
        input.dates,
        JSON.stringify(input.timeWindows ?? []),
        input.minDuration ?? 1,
        input.minCapacity ?? null,
      ],
    );
    return Number(r.rows[0].id);
  }

  beforeAll(async () => {
    process.env.DATABASE_URL ??=
      'postgres://notif_test:notif_test@127.0.0.1:5432/notif_test';
    process.env.DATABASE_SSL = 'false';
    db = new DatabaseService();
    dispatcher = new NotificationDispatcher(db as never);

    await reset();

    const area = await db.query<{ id: string }>(
      `INSERT INTO areas (slug, name, "order") VALUES ('hongdae', '홍대', 1) RETURNING id`,
    );
    areaId = Number(area.rows[0].id);
    const otherArea = await db.query<{ id: string }>(
      `INSERT INTO areas (slug, name, "order") VALUES ('gangnam', '강남', 2) RETURNING id`,
    );
    otherAreaId = Number(otherArea.rows[0].id);

    const studio = await db.query<{ id: string }>(
      `INSERT INTO studios (name, primary_area_id, is_active) VALUES ('홍대합주실', $1, true) RETURNING id`,
      [areaId],
    );
    studioId = Number(studio.rows[0].id);
    const otherStudio = await db.query<{ id: string }>(
      `INSERT INTO studios (name, primary_area_id, is_active) VALUES ('강남합주실', $1, true) RETURNING id`,
      [otherAreaId],
    );
    otherStudioId = Number(otherStudio.rows[0].id);

    await db.query(`INSERT INTO studio_areas (studio_id, area_id) VALUES ($1, $2)`, [studioId, areaId]);
    await db.query(`INSERT INTO studio_areas (studio_id, area_id) VALUES ($1, $2)`, [
      otherStudioId,
      otherAreaId,
    ]);

    const room = await db.query<{ id: string }>(
      `INSERT INTO rooms (studio_id, name, capacity_max, is_active) VALUES ($1, 'A룸', 4, true) RETURNING id`,
      [studioId],
    );
    roomId = Number(room.rows[0].id);
    const otherRoom = await db.query<{ id: string }>(
      `INSERT INTO rooms (studio_id, name, capacity_max, is_active) VALUES ($1, 'B룸', 8, true) RETURNING id`,
      [otherStudioId],
    );
    otherRoomId = Number(otherRoom.rows[0].id);

    const fd = await db.query<{ d: string }>(
      `SELECT ((NOW() AT TIME ZONE 'Asia/Seoul')::date + 7)::text AS d`,
    );
    futureDate = fd.rows[0].d;
  });

  afterAll(async () => {
    if (db) await db.onModuleDestroy();
  });

  // 각 테스트는 슬롯/이벤트/구독/디바이스/딜리버리만 비우고 area/studio/room 은 유지한다.
  beforeEach(async () => {
    await db.query(
      `TRUNCATE notification_deliveries, slot_available_events, notification_subscriptions,
                devices, slots RESTART IDENTITY CASCADE`,
    );
  });

  describe('trg_slot_available 트리거', () => {
    it('UNAVAILABLE 삽입은 이벤트를 만들지 않고, AVAILABLE 로 전이할 때만 만든다', async () => {
      await db.query(
        `INSERT INTO slots (room_id, date, start_time, end_time, status, price_source, scraped_at)
         VALUES ($1, $2, '19:00', '20:00', 'UNAVAILABLE', 'UNKNOWN', NOW())`,
        [roomId, futureDate],
      );
      let cnt = await db.query<{ c: string }>(`SELECT count(*) c FROM slot_available_events`);
      expect(Number(cnt.rows[0].c)).toBe(0);

      // UNAVAILABLE → AVAILABLE 전이
      await db.query(
        `UPDATE slots SET status = 'AVAILABLE' WHERE room_id = $1 AND date = $2 AND start_time = '19:00'`,
        [roomId, futureDate],
      );
      cnt = await db.query<{ c: string }>(`SELECT count(*) c FROM slot_available_events`);
      expect(Number(cnt.rows[0].c)).toBe(1);

      // AVAILABLE → AVAILABLE 재설정은 새 이벤트를 만들지 않는다
      await db.query(
        `UPDATE slots SET status = 'AVAILABLE' WHERE room_id = $1 AND date = $2 AND start_time = '19:00'`,
        [roomId, futureDate],
      );
      cnt = await db.query<{ c: string }>(`SELECT count(*) c FROM slot_available_events`);
      expect(Number(cnt.rows[0].c)).toBe(1);
    });

    it('AVAILABLE 신규 INSERT 는 이벤트를 만든다', async () => {
      await insertAvailableSlot(roomId, futureDate, '19:00', '20:00');
      const cnt = await db.query<{ c: string }>(`SELECT count(*) c FROM slot_available_events`);
      expect(Number(cnt.rows[0].c)).toBe(1);
    });
  });

  describe('dispatch 매칭·멱등성', () => {
    it('구독과 매칭해 발송(dry-run)하고 딜리버리를 기록하며, 재실행은 중복 발송하지 않는다', async () => {
      const deviceId = await createDevice('tok-1');
      await createSubscription({ deviceId, studioIds: [studioId], dates: [futureDate] });
      await insertAvailableSlot(roomId, futureDate, '19:00', '20:00');

      const s1 = await dispatcher.dispatch();
      expect(s1.dryRun).toBe(true); // FCM 미설정
      expect(s1.claimedEvents).toBe(1);
      expect(s1.candidates).toBe(1);
      expect(s1.sent).toBe(1);
      expect(s1.failed).toBe(0);

      const del = await db.query<{ status: string }>(`SELECT status FROM notification_deliveries`);
      expect(del.rows).toHaveLength(1);
      expect(del.rows[0].status).toBe('SENT');

      // 재실행: 처리할 이벤트가 없다.
      const s2 = await dispatcher.dispatch();
      expect(s2.claimedEvents).toBe(0);
      expect(s2.sent).toBe(0);

      // 같은 슬롯에 대한 이벤트가 다시 생겨도(예: 재스크랩) 딜리버리 dedup 으로 재발송하지 않는다.
      await db.query(
        `INSERT INTO slot_available_events (room_id, slot_date, slot_start_time)
         VALUES ($1, $2, '19:00')`,
        [roomId, futureDate],
      );
      const s3 = await dispatcher.dispatch();
      expect(s3.claimedEvents).toBe(1);
      expect(s3.candidates).toBe(0); // 이미 보낸 슬롯이라 후보에서 제외
      const delCnt = await db.query<{ c: string }>(`SELECT count(*) c FROM notification_deliveries`);
      expect(Number(delCnt.rows[0].c)).toBe(1);
    });

    it('이벤트가 없으면 빈 요약을 돌려준다', async () => {
      const s = await dispatcher.dispatch();
      expect(s).toMatchObject({ claimedEvents: 0, candidates: 0, sent: 0, failed: 0 });
    });
  });

  describe('매칭 필터', () => {
    it('time_windows 밖의 시간은 제외, 안의 시간은 포함', async () => {
      const deviceId = await createDevice('tok-tw');
      await createSubscription({
        deviceId,
        studioIds: [studioId],
        dates: [futureDate],
        timeWindows: [{ from: '18:00', to: '20:00' }],
      });
      await insertAvailableSlot(roomId, futureDate, '21:00', '22:00'); // 윈도우 밖
      await insertAvailableSlot(roomId, futureDate, '19:00', '20:00'); // 윈도우 안

      const s = await dispatcher.dispatch();
      expect(s.candidates).toBe(1);
      const d = await db.query<{ slot_start_time: string }>(
        `SELECT slot_start_time::text FROM notification_deliveries`,
      );
      expect(d.rows[0].slot_start_time).toBe('19:00:00');
    });

    it('min_capacity 가 방 capacity_max 보다 크면 제외', async () => {
      const deviceId = await createDevice('tok-cap');
      // roomId capacity_max=4, 6 이상 요구 → 제외
      await createSubscription({ deviceId, studioIds: [studioId], dates: [futureDate], minCapacity: 6 });
      await insertAvailableSlot(roomId, futureDate, '19:00', '20:00');

      const s = await dispatcher.dispatch();
      expect(s.candidates).toBe(0);
    });

    it('min_duration 미충족(단일 시간)이면 매칭되지 않는다', async () => {
      const deviceId = await createDevice('tok-dur');
      await createSubscription({
        deviceId,
        studioIds: [studioId],
        dates: [futureDate],
        minDuration: 2,
      });
      // 19:00 만 가용 → 2시간 연속 미충족
      await insertAvailableSlot(roomId, futureDate, '19:00', '20:00');
      const s1 = await dispatcher.dispatch();
      expect(s1.candidates).toBe(0);
    });

    it('연속 2시간이 함께 열리면 블록당 1건만, 시작 시각을 앵커로 매칭된다', async () => {
      const deviceId = await createDevice('tok-dur2');
      await createSubscription({
        deviceId,
        studioIds: [studioId],
        dates: [futureDate],
        minDuration: 2,
      });
      // 19:00, 20:00 함께 가용 → 19:00 시작 2시간 블록. 두 슬롯 이벤트가 같은 구간으로 모여
      // 후보는 1건(중복 방지), 알림은 구간 시작(19:00) 기준.
      await insertAvailableSlot(roomId, futureDate, '19:00', '20:00');
      await insertAvailableSlot(roomId, futureDate, '20:00', '21:00');
      const s = await dispatcher.dispatch();
      expect(s.candidates).toBe(1);
      const d = await db.query<{ slot_start_time: string }>(
        `SELECT slot_start_time::text FROM notification_deliveries`,
      );
      expect(d.rows.map((r) => r.slot_start_time)).toEqual(['19:00:00']);
    });

    it('연속 슬롯이 나중에 열려 블록이 완성돼도 놓치지 않는다(순서 무관)', async () => {
      const deviceId = await createDevice('tok-order');
      await createSubscription({
        deviceId,
        studioIds: [studioId],
        dates: [futureDate],
        minDuration: 2,
      });
      // 19:00 만 먼저 열림 → 단독이라 미매칭, 이벤트는 소비된다.
      await insertAvailableSlot(roomId, futureDate, '19:00', '20:00');
      const s1 = await dispatcher.dispatch();
      expect(s1.candidates).toBe(0);

      // 20:00 이 나중에 열려 19:00~21:00 2시간 블록 완성 → 시작(19:00) 기준으로 매칭된다.
      await insertAvailableSlot(roomId, futureDate, '20:00', '21:00');
      const s2 = await dispatcher.dispatch();
      expect(s2.candidates).toBe(1);
      const d = await db.query<{ slot_start_time: string }>(
        `SELECT slot_start_time::text FROM notification_deliveries`,
      );
      expect(d.rows.map((r) => r.slot_start_time)).toEqual(['19:00:00']);
    });

    it('다른 스튜디오만 구독하면 매칭되지 않는다', async () => {
      const deviceId = await createDevice('tok-scope');
      await createSubscription({ deviceId, studioIds: [otherStudioId], dates: [futureDate] });
      await insertAvailableSlot(roomId, futureDate, '19:00', '20:00');

      const s = await dispatcher.dispatch();
      expect(s.candidates).toBe(0);
    });

    it('area 구독은 해당 지역 스튜디오의 슬롯과 매칭된다', async () => {
      const deviceId = await createDevice('tok-area');
      await createSubscription({ deviceId, areaIds: [areaId], dates: [futureDate] });
      await insertAvailableSlot(roomId, futureDate, '19:00', '20:00');

      const s = await dispatcher.dispatch();
      expect(s.candidates).toBe(1);
    });
  });
});
