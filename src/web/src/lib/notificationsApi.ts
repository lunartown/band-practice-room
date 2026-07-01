// 빈자리 알림 백엔드(/api/v1/notifications) 연동 클라이언트.
//
// 서버 구독이 알림의 단일 소스다: 목록은 GET 으로 읽고(fetchAlerts),
// 생성/삭제 실패는 예외로 올려 UI 가 사용자에게 알리게 한다(조용히 삼키지 않는다).
// 디바이스는 설치 ID(installId)로 식별하고, FCM 토큰은 회전 가능한 속성으로 등록한다
// → 토큰이 갱신돼도 서버의 구독은 같은 디바이스에 그대로 남는다.
import { alertFromSubscriptionDto, type AlertConditions, type SavedAlert } from './alerts';
import { getInstallId } from './installId';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

export type Platform = 'ios' | 'android' | 'web';

let deviceToken: string | null = null;
let deviceRegistered = false;
let lastDeviceRegistration: { platform: Platform; appVersion: string | null } | null = null;
let deviceRegistrationPromise: Promise<boolean> | null = null;

// 디바이스가 서버에 등록된 순간(=구독 조회·생성이 의미를 가지는 시점)을 알리는 구독자.
const registeredListeners = new Set<() => void>();

export function onDeviceRegistered(listener: () => void): () => void {
  registeredListeners.add(listener);
  if (deviceRegistered) listener();
  return () => {
    registeredListeners.delete(listener);
  };
}

export function setDeviceToken(token: string): void {
  if (deviceToken !== token) {
    deviceRegistered = false;
    deviceRegistrationPromise = null;
  }
  deviceToken = token;
}

// 서버에 연동을 시도할 수 있는 상태인지(실제 토큰 + 실 API).
export function canSyncRemote(): boolean {
  return !USE_MOCK_API && deviceToken !== null;
}

export async function registerDevice(platform: Platform, appVersion: string | null): Promise<boolean> {
  lastDeviceRegistration = { platform, appVersion };
  return ensureDeviceRegistered();
}

// 서버 구독 목록을 SavedAlert 로 돌려준다. 동기화 불가 상태면 null(빈 목록과 구분).
export async function fetchAlerts(): Promise<SavedAlert[] | null> {
  if (!canSyncRemote()) return null;
  await ensureDeviceRegistered();
  const res = await getJson<{ items?: unknown[] }>(
    `/notifications/subscriptions?installId=${encodeURIComponent(getInstallId())}`,
  );
  return (res.items ?? [])
    .map(alertFromSubscriptionDto)
    .filter((alert): alert is SavedAlert => Boolean(alert));
}

// 서버에 구독을 만들고 저장된 알림을 돌려준다. 실패는 예외로 던진다.
export async function createAlert(conditions: AlertConditions): Promise<SavedAlert> {
  if (!canSyncRemote()) throw new Error('푸시 동기화 불가 상태');
  const registered = await ensureDeviceRegistered();
  if (!registered) throw new Error('디바이스 등록 실패');
  const dto = await postJson<unknown>('/notifications/subscriptions', toSubscriptionPayload(conditions));
  const alert = alertFromSubscriptionDto(dto);
  if (!alert) throw new Error('구독 응답 형식이 올바르지 않음');
  return alert;
}

export async function deleteAlert(id: number): Promise<void> {
  if (!canSyncRemote()) throw new Error('푸시 동기화 불가 상태');
  await sendJson('DELETE', `/notifications/subscriptions/${id}`, { installId: getInstallId() });
}

// 수정은 백엔드에 PATCH 가 없어 재생성으로 처리한다.
// 생성을 먼저 해 실패 시 기존 알림이 보존되게 하고, 그다음 옛 구독을 지운다.
export async function replaceAlert(previousId: number, conditions: AlertConditions): Promise<SavedAlert> {
  const created = await createAlert(conditions);
  try {
    await deleteAlert(previousId);
  } catch (err) {
    // 옛 구독이 남아도 다음 목록 조회에서 드러나 사용자가 지울 수 있다.
    console.warn('[notify] 이전 구독 삭제 실패', err);
  }
  return created;
}

// AlertConditions → POST /subscriptions 바디. studios 가 있으면 합주실 대상,
// 없으면 areaIds(빈 배열이면 모든 지역). minCapacity 는 인원(people).
function toSubscriptionPayload(conditions: AlertConditions) {
  const base = {
    installId: getInstallId(),
    dates: conditions.dates,
    timeWindows: conditions.timeWindows,
    minDuration: conditions.minDuration,
    minCapacity: conditions.people,
  };
  if (conditions.scope === 'studios' && conditions.studios.length > 0) {
    return { ...base, studioIds: conditions.studios.map((studio) => studio.id) };
  }
  return { ...base, areaIds: conditions.areaIds };
}

async function ensureDeviceRegistered(): Promise<boolean> {
  if (deviceRegistered) return true;
  if (!canSyncRemote() || !lastDeviceRegistration) return false;
  if (deviceRegistrationPromise) return deviceRegistrationPromise;

  const { platform, appVersion } = lastDeviceRegistration;
  deviceRegistrationPromise = postJson('/notifications/devices', {
    installId: getInstallId(),
    deviceToken,
    platform,
    appVersion,
  })
    .then(() => {
      deviceRegistered = true;
      for (const listener of registeredListeners) listener();
      return true;
    })
    .catch((err) => {
      console.warn('[notify] 디바이스 등록 실패', err);
      return false;
    })
    .finally(() => {
      deviceRegistrationPromise = null;
    });

  return deviceRegistrationPromise;
}

function postJson<T = unknown>(path: string, body: unknown): Promise<T> {
  return sendJson<T>('POST', path, body);
}

async function getJson<T = unknown>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`);
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}

async function sendJson<T = unknown>(method: string, path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}
