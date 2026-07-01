import { ApiError } from '../shared/api-error.js';
import { NotificationsService } from './notifications.service.js';
import {
  CreateSubscriptionInput,
  DeviceRow,
  SubscriptionRow,
} from './notifications.repository.js';

// 레포지토리를 목으로 대체해 서비스의 검증·정규화·DTO 매핑만 검증한다(DB 비의존).
function makeRepo(overrides: Partial<Record<keyof RepoShape, jest.Mock>> = {}) {
  const repo = {
    upsertDevice: jest.fn(),
    upsertDeviceByInstallId: jest.fn(),
    findDeviceByToken: jest.fn(),
    findDeviceByInstallId: jest.fn(),
    createSubscription: jest.fn(),
    listSubscriptionsByDevice: jest.fn(),
    deactivateSubscription: jest.fn(),
    ...overrides,
  };
  return repo;
}

type RepoShape = {
  upsertDevice: unknown;
  upsertDeviceByInstallId: unknown;
  findDeviceByToken: unknown;
  findDeviceByInstallId: unknown;
  createSubscription: unknown;
  listSubscriptionsByDevice: unknown;
  deactivateSubscription: unknown;
};

const device: DeviceRow = {
  id: '7',
  install_id: 'install-1',
  device_token: 'tok-abc',
  platform: 'ios',
  app_version: '1.2.3',
  is_active: true,
};

function rowFrom(input: CreateSubscriptionInput, extra: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    id: '11',
    device_id: input.deviceId,
    studio_ids: input.studioIds ? input.studioIds.map(String) : null,
    area_ids: input.areaIds ? input.areaIds.map(String) : null,
    dates: input.dates,
    time_windows: input.timeWindows,
    min_duration: input.minDuration,
    min_capacity: input.minCapacity,
    is_active: true,
    created_at: new Date('2026-06-28T00:00:00.000Z'),
    studios: null,
    areas: null,
    ...extra,
  };
}

describe('NotificationsService.registerDevice', () => {
  it('등록/갱신 결과를 반환한다', async () => {
    const upsertDevice = jest.fn().mockResolvedValue({ id: '7', platform: 'ios' });
    const service = new NotificationsService(makeRepo({ upsertDevice }) as never);

    await expect(
      service.registerDevice({ deviceToken: ' tok-abc ', platform: 'ios', appVersion: '1.2.3' }),
    ).resolves.toEqual({ deviceId: 7, platform: 'ios' });

    // 토큰은 trim 되어 저장된다.
    expect(upsertDevice).toHaveBeenCalledWith({
      deviceToken: 'tok-abc',
      platform: 'ios',
      appVersion: '1.2.3',
    });
  });

  it('installId 가 있으면 설치 ID 기준으로 등록한다(토큰 회전 대비)', async () => {
    const upsertDeviceByInstallId = jest.fn().mockResolvedValue({ id: '7', platform: 'ios' });
    const upsertDevice = jest.fn();
    const service = new NotificationsService(
      makeRepo({ upsertDevice, upsertDeviceByInstallId }) as never,
    );

    await expect(
      service.registerDevice({
        installId: 'install-1',
        deviceToken: 'tok-abc',
        platform: 'ios',
        appVersion: '1.2.3',
      }),
    ).resolves.toEqual({ deviceId: 7, platform: 'ios' });

    expect(upsertDeviceByInstallId).toHaveBeenCalledWith({
      installId: 'install-1',
      deviceToken: 'tok-abc',
      platform: 'ios',
      appVersion: '1.2.3',
    });
    expect(upsertDevice).not.toHaveBeenCalled();
  });

  it('platform 이 허용값이 아니면 거부한다', async () => {
    const service = new NotificationsService(makeRepo() as never);
    await expect(
      service.registerDevice({ deviceToken: 'tok', platform: 'desktop' }),
    ).rejects.toMatchObject({ code: 'INVALID_PARAMETER' });
  });

  it('deviceToken 이 비면 거부한다', async () => {
    const service = new NotificationsService(makeRepo() as never);
    await expect(
      service.registerDevice({ deviceToken: '   ', platform: 'ios' }),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it('본문이 객체가 아니면 거부한다', async () => {
    const service = new NotificationsService(makeRepo() as never);
    await expect(service.registerDevice(['x'])).rejects.toMatchObject({ code: 'INVALID_BODY' });
  });
});

describe('NotificationsService.createSubscription', () => {
  function serviceWith(createSubscription: jest.Mock) {
    const findDeviceByToken = jest.fn().mockResolvedValue(device);
    const repo = makeRepo({ findDeviceByToken, createSubscription });
    return { service: new NotificationsService(repo as never), createSubscription };
  }

  it('디바이스가 없으면 DEVICE_NOT_FOUND', async () => {
    const findDeviceByToken = jest.fn().mockResolvedValue(null);
    const service = new NotificationsService(makeRepo({ findDeviceByToken }) as never);
    await expect(
      service.createSubscription({ deviceToken: 'tok', dates: ['2026-06-30'] }),
    ).rejects.toMatchObject({ code: 'DEVICE_NOT_FOUND' });
  });

  it('studioIds 가 있으면 areaIds 를 무시하고 scope=studios 로 저장한다', async () => {
    const createSubscription = jest.fn((input: CreateSubscriptionInput) => Promise.resolve(rowFrom(input)));
    const { service } = serviceWith(createSubscription);

    const dto = await service.createSubscription({
      deviceToken: 'tok',
      studioIds: [3, 3, 5], // 중복 제거됨
      areaIds: [1, 2], // studioIds 가 있으므로 무시
      dates: ['2026-06-30'],
    });

    expect(createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ studioIds: [3, 5], areaIds: null }),
    );
    expect(dto.scope).toBe('studios');
    expect(dto.studioIds).toEqual([3, 5]);
  });

  it('studioIds 가 없고 areaIds 만 있으면 scope=search', async () => {
    const createSubscription = jest.fn((input: CreateSubscriptionInput) => Promise.resolve(rowFrom(input)));
    const { service } = serviceWith(createSubscription);

    const dto = await service.createSubscription({
      deviceToken: 'tok',
      areaIds: [1, 2],
      dates: ['2026-06-30'],
    });

    expect(createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ studioIds: null, areaIds: [1, 2] }),
    );
    expect(dto.scope).toBe('search');
  });

  it('대상이 모두 비면 studioIds/areaIds 둘 다 null(전체 검색)', async () => {
    const createSubscription = jest.fn((input: CreateSubscriptionInput) => Promise.resolve(rowFrom(input)));
    const { service } = serviceWith(createSubscription);

    await service.createSubscription({ deviceToken: 'tok', dates: ['2026-06-30'] });

    expect(createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ studioIds: null, areaIds: null }),
    );
  });

  it('dates 가 없으면 거부한다', async () => {
    const { service } = serviceWith(jest.fn());
    await expect(service.createSubscription({ deviceToken: 'tok' })).rejects.toMatchObject({
      code: 'INVALID_PARAMETER',
    });
  });

  it('dates 형식이 틀리면 거부한다', async () => {
    const { service } = serviceWith(jest.fn());
    await expect(
      service.createSubscription({ deviceToken: 'tok', dates: ['2026/06/30'] }),
    ).rejects.toMatchObject({ code: 'INVALID_PARAMETER' });
  });

  it('minDuration 기본값은 1, 범위(1~4) 밖이면 거부', async () => {
    const createSubscription = jest.fn((input: CreateSubscriptionInput) => Promise.resolve(rowFrom(input)));
    const { service } = serviceWith(createSubscription);

    await service.createSubscription({ deviceToken: 'tok', dates: ['2026-06-30'] });
    expect(createSubscription).toHaveBeenCalledWith(expect.objectContaining({ minDuration: 1 }));

    await expect(
      service.createSubscription({ deviceToken: 'tok', dates: ['2026-06-30'], minDuration: 5 }),
    ).rejects.toMatchObject({ code: 'INVALID_PARAMETER' });
  });

  it('timeWindows 를 검증하고 from<to 가 아니면 거부', async () => {
    const createSubscription = jest.fn((input: CreateSubscriptionInput) => Promise.resolve(rowFrom(input)));
    const { service } = serviceWith(createSubscription);

    await service.createSubscription({
      deviceToken: 'tok',
      dates: ['2026-06-30'],
      timeWindows: [{ from: '18:00', to: '24:00' }],
    });
    expect(createSubscription).toHaveBeenCalledWith(
      expect.objectContaining({ timeWindows: [{ from: '18:00', to: '24:00' }] }),
    );

    await expect(
      service.createSubscription({
        deviceToken: 'tok',
        dates: ['2026-06-30'],
        timeWindows: [{ from: '20:00', to: '20:00' }],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_PARAMETER' });
  });

  it('minCapacity 가 양의 정수가 아니면 거부', async () => {
    const { service } = serviceWith(jest.fn());
    await expect(
      service.createSubscription({ deviceToken: 'tok', dates: ['2026-06-30'], minCapacity: 0 }),
    ).rejects.toMatchObject({ code: 'INVALID_PARAMETER' });
  });

  it('createdAt 을 ISO 문자열로 직렬화한다', async () => {
    const createSubscription = jest.fn((input: CreateSubscriptionInput) => Promise.resolve(rowFrom(input)));
    const { service } = serviceWith(createSubscription);
    const dto = await service.createSubscription({ deviceToken: 'tok', dates: ['2026-06-30'] });
    expect(dto.createdAt).toBe('2026-06-28T00:00:00.000Z');
  });
});

describe('NotificationsService.listSubscriptions', () => {
  it('디바이스가 없으면 빈 목록', async () => {
    const findDeviceByToken = jest.fn().mockResolvedValue(null);
    const service = new NotificationsService(makeRepo({ findDeviceByToken }) as never);
    await expect(service.listSubscriptions({ deviceToken: 'tok' })).resolves.toEqual({ items: [] });
  });

  it('installId 가 있으면 설치 ID 로 디바이스를 찾는다', async () => {
    const findDeviceByInstallId = jest.fn().mockResolvedValue(device);
    const findDeviceByToken = jest.fn();
    const listSubscriptionsByDevice = jest.fn().mockResolvedValue([]);
    const service = new NotificationsService(
      makeRepo({ findDeviceByInstallId, findDeviceByToken, listSubscriptionsByDevice }) as never,
    );

    await expect(service.listSubscriptions({ installId: 'install-1' })).resolves.toEqual({ items: [] });
    expect(findDeviceByInstallId).toHaveBeenCalledWith('install-1');
    expect(findDeviceByToken).not.toHaveBeenCalled();
  });

  it('구독 행을 DTO 로 매핑한다', async () => {
    const findDeviceByToken = jest.fn().mockResolvedValue(device);
    const listSubscriptionsByDevice = jest.fn().mockResolvedValue([
      rowFrom(
        {
          deviceId: '7',
          studioIds: [3],
          areaIds: null,
          dates: ['2026-06-30'],
          timeWindows: [],
          minDuration: 2,
          minCapacity: 4,
        },
        { studios: [{ id: 3, name: 'A합주실' }] },
      ),
    ]);
    const service = new NotificationsService(
      makeRepo({ findDeviceByToken, listSubscriptionsByDevice }) as never,
    );

    const result = await service.listSubscriptions({ deviceToken: 'tok' });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject({
      scope: 'studios',
      studioIds: [3],
      studios: [{ id: 3, name: 'A합주실' }],
      minDuration: 2,
      minCapacity: 4,
    });
  });
});

describe('NotificationsService.deleteSubscription', () => {
  it('소유 디바이스의 구독을 비활성화한다', async () => {
    const findDeviceByToken = jest.fn().mockResolvedValue(device);
    const deactivateSubscription = jest.fn().mockResolvedValue(true);
    const service = new NotificationsService(
      makeRepo({ findDeviceByToken, deactivateSubscription }) as never,
    );
    await expect(service.deleteSubscription(11, { deviceToken: 'tok' })).resolves.toEqual({ ok: true });
    expect(deactivateSubscription).toHaveBeenCalledWith('11', '7');
  });

  it('구독이 없으면 SUBSCRIPTION_NOT_FOUND', async () => {
    const findDeviceByToken = jest.fn().mockResolvedValue(device);
    const deactivateSubscription = jest.fn().mockResolvedValue(false);
    const service = new NotificationsService(
      makeRepo({ findDeviceByToken, deactivateSubscription }) as never,
    );
    await expect(service.deleteSubscription(11, { deviceToken: 'tok' })).rejects.toMatchObject({
      code: 'SUBSCRIPTION_NOT_FOUND',
    });
  });

  it('디바이스가 없으면 DEVICE_NOT_FOUND', async () => {
    const findDeviceByToken = jest.fn().mockResolvedValue(null);
    const service = new NotificationsService(makeRepo({ findDeviceByToken }) as never);
    await expect(service.deleteSubscription(11, { deviceToken: 'tok' })).rejects.toMatchObject({
      code: 'DEVICE_NOT_FOUND',
    });
  });
});
