// 빈자리 알림 백엔드(/api/v1/notifications) 연동 클라이언트.
// 디바이스(FCM 토큰) 등록과 구독 생성/삭제를 담당한다.
//
// 동작 전제: 네이티브 푸시 토큰이 있어야 서버 구독이 의미가 있다.
// 토큰이 없거나(웹/권한 거부) 목 API 모드면 모든 호출은 조용히 no-op 한다
// → 알림은 로컬(localStorage)에만 저장되고 푸시만 비활성. UX 는 깨지지 않는다.
import type { SavedAlert } from './alerts';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

export type Platform = 'ios' | 'android' | 'web';

let deviceToken: string | null = null;
let deviceRegistered = false;

export function getDeviceToken(): string | null {
  return deviceToken;
}

export function setDeviceToken(token: string): void {
  deviceToken = token;
}

// 서버에 연동을 시도할 수 있는 상태인지(실제 토큰 + 실 API).
export function canSyncRemote(): boolean {
  return !USE_MOCK_API && deviceToken !== null;
}

export async function registerDevice(platform: Platform, appVersion: string | null): Promise<void> {
  if (!canSyncRemote()) return;
  try {
    await postJson('/notifications/devices', {
      deviceToken,
      platform,
      appVersion,
    });
    deviceRegistered = true;
  } catch (err) {
    console.warn('[notify] 디바이스 등록 실패', err);
  }
}

// 로컬 SavedAlert 를 서버 구독으로 생성한다. 성공 시 서버 구독 id 를 돌려준다(없으면 null).
export async function createSubscription(alert: SavedAlert): Promise<number | null> {
  if (!canSyncRemote()) return null;
  if (!deviceRegistered) return null; // 디바이스 등록이 선행돼야 함
  try {
    const res = await postJson<{ id: number }>(
      '/notifications/subscriptions',
      toSubscriptionPayload(alert),
    );
    return res.id ?? null;
  } catch (err) {
    console.warn('[notify] 구독 생성 실패', err);
    return null;
  }
}

// 수정(edit)은 백엔드에 PATCH 가 없으므로 기존 구독 삭제 후 재생성한다.
export async function resyncSubscription(alert: SavedAlert): Promise<number | null> {
  if (alert.serverId != null) await deleteSubscription(alert.serverId);
  return createSubscription(alert);
}

export async function deleteSubscription(serverId: number): Promise<void> {
  if (!canSyncRemote()) return;
  try {
    await sendJson('DELETE', `/notifications/subscriptions/${serverId}`, { deviceToken });
  } catch (err) {
    console.warn('[notify] 구독 삭제 실패', err);
  }
}

// SavedAlert → POST /subscriptions 바디. studioIds 가 있으면 합주실 대상,
// 없으면 areaIds(빈 배열이면 모든 지역). minCapacity 는 인원(people).
function toSubscriptionPayload(alert: SavedAlert) {
  const base = {
    deviceToken,
    dates: alert.dates,
    timeWindows: alert.timeWindows,
    minDuration: alert.minDuration,
    minCapacity: alert.people,
  };
  if (alert.scope === 'studios' && alert.studios.length > 0) {
    return { ...base, studioIds: alert.studios.map((s) => s.id) };
  }
  return { ...base, areaIds: alert.areaIds };
}

function postJson<T = unknown>(path: string, body: unknown): Promise<T> {
  return sendJson<T>('POST', path, body);
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
