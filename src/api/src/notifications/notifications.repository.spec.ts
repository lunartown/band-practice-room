// 디바이스 등록(설치 ID 자연키) 통합 테스트 — 실제 Postgres 가 필요하다.
// 토큰 회전·레거시 행 승계·토큰 회수(다른 설치로 이동)를 검증한다.
//
// 실행: 로컬에 테스트용 Postgres 를 띄우고
//   RUN_DB_TESTS=1 DATABASE_URL=postgres://user:pw@127.0.0.1:5432/db npm test
// DB 가 없는 CI 에서는 자동으로 skip 된다.
import { DatabaseService } from '../database/database.service.js';
import { NotificationsRepository } from './notifications.repository.js';

const runDbTests = process.env.RUN_DB_TESTS === '1';
const describeDb = runDbTests ? describe : describe.skip;

describeDb('NotificationsRepository devices (integration)', () => {
  let db: DatabaseService;
  let repo: NotificationsRepository;

  beforeAll(() => {
    db = new DatabaseService();
    repo = new NotificationsRepository(db);
  });

  afterAll(async () => {
    await db.onModuleDestroy();
  });

  beforeEach(async () => {
    await db.query(
      `TRUNCATE notification_deliveries, notification_subscriptions, devices RESTART IDENTITY CASCADE`,
    );
  });

  async function addSubscription(deviceId: string): Promise<string> {
    const r = await db.query<{ id: string }>(
      `INSERT INTO notification_subscriptions (device_id, dates) VALUES ($1, '{2099-01-01}') RETURNING id`,
      [deviceId],
    );
    return r.rows[0].id;
  }

  it('같은 설치 ID 로 토큰이 회전해도 디바이스·구독이 유지된다', async () => {
    const first = await repo.upsertDeviceByInstallId({
      installId: 'install-1',
      deviceToken: 'tok-old',
      platform: 'ios',
      appVersion: '1.0.0',
    });
    const subscriptionId = await addSubscription(first.id);

    const rotated = await repo.upsertDeviceByInstallId({
      installId: 'install-1',
      deviceToken: 'tok-new',
      platform: 'ios',
      appVersion: '1.1.0',
    });

    expect(rotated.id).toBe(first.id);
    expect(rotated.device_token).toBe('tok-new');
    expect(rotated.is_active).toBe(true);

    // 구독은 같은 디바이스에 그대로 붙어 있다.
    const sub = await db.query<{ device_id: string }>(
      `SELECT device_id FROM notification_subscriptions WHERE id = $1`,
      [subscriptionId],
    );
    expect(sub.rows[0].device_id).toBe(first.id);
  });

  it('레거시 행(토큰=설치 ID)을 새 설치 ID 가 승계해 구독을 보존한다', async () => {
    // 구버전 앱이 만든 행: install_id 를 토큰으로 백필한 상태.
    const legacy = await repo.upsertDevice({
      deviceToken: 'tok-legacy',
      platform: 'android',
      appVersion: '0.9.0',
    });
    expect(legacy.install_id).toBe('tok-legacy');
    const subscriptionId = await addSubscription(legacy.id);

    const claimed = await repo.upsertDeviceByInstallId({
      installId: 'install-2',
      deviceToken: 'tok-legacy',
      platform: 'android',
      appVersion: '1.0.0',
    });

    expect(claimed.id).toBe(legacy.id);
    expect(claimed.install_id).toBe('install-2');

    const sub = await db.query<{ device_id: string }>(
      `SELECT device_id FROM notification_subscriptions WHERE id = $1`,
      [subscriptionId],
    );
    expect(sub.rows[0].device_id).toBe(legacy.id);
  });

  it('토큰이 다른 설치로 옮겨가면 옛 행에서 회수하고 비활성화한다', async () => {
    const stale = await repo.upsertDeviceByInstallId({
      installId: 'install-lost',
      deviceToken: 'tok-shared',
      platform: 'ios',
      appVersion: '1.0.0',
    });

    // 저장소를 잃은(설치 ID 가 바뀐) 같은 기기가 같은 토큰으로 다시 등록.
    const fresh = await repo.upsertDeviceByInstallId({
      installId: 'install-fresh',
      deviceToken: 'tok-shared',
      platform: 'ios',
      appVersion: '1.0.0',
    });

    expect(fresh.id).not.toBe(stale.id);
    expect(fresh.device_token).toBe('tok-shared');

    const old = await db.query<{ device_token: string | null; is_active: boolean }>(
      `SELECT device_token, is_active FROM devices WHERE id = $1`,
      [stale.id],
    );
    expect(old.rows[0].device_token).toBeNull();
    expect(old.rows[0].is_active).toBe(false);
  });

  it('모든 날짜가 지난 구독은 목록에서 제외된다', async () => {
    const device = await repo.upsertDeviceByInstallId({
      installId: 'install-list',
      deviceToken: 'tok-list',
      platform: 'ios',
      appVersion: null,
    });
    await db.query(
      `INSERT INTO notification_subscriptions (device_id, dates) VALUES ($1, '{2000-01-01}')`,
      [device.id],
    );
    await db.query(
      `INSERT INTO notification_subscriptions (device_id, dates) VALUES ($1, '{2000-01-01,2099-01-01}')`,
      [device.id],
    );

    const rows = await repo.listSubscriptionsByDevice(device.id);
    expect(rows).toHaveLength(1);
    expect(rows[0].dates).toEqual(['2000-01-01', '2099-01-01']);
  });

  it('구버전 등록(토큰만)은 기존 행을 갱신한다', async () => {
    const first = await repo.upsertDevice({
      deviceToken: 'tok-old-app',
      platform: 'ios',
      appVersion: '0.9.0',
    });
    const again = await repo.upsertDevice({
      deviceToken: 'tok-old-app',
      platform: 'ios',
      appVersion: '0.9.1',
    });

    expect(again.id).toBe(first.id);
    expect(again.app_version).toBe('0.9.1');
  });
});
