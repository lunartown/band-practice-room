// 네이티브(Capacitor) 푸시 디바이스 등록. @capacitor-firebase/messaging 으로
// iOS·Android 모두 FCM 토큰을 받는다(백엔드 firebase-admin 이 FCM 토큰을 기대).
//
// - 부팅 시(initPushDevice): 권한을 새로 묻지 않고, 이미 허용된 경우에만 토큰을 받아
//   조용히 서버에 등록한다(토큰 회전 반영 포함).
// - 알림 등록 직전(ensurePushReady): 그때 권한을 요청하고 토큰까지 확보한다.
//   권한은 사용자가 알림을 원한 시점에 묻는 게 맥락상 자연스럽다.
// 웹/PWA 에서는 네이티브 푸시를 쓰지 않으므로 unavailable 로 처리한다.
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { registerDevice, setDeviceToken, type Platform } from './notificationsApi';

let initialized = false;

export type PushReadiness = 'granted' | 'denied' | 'unavailable';

// 알림 데이터(slot_available)에서 화면 이동에 필요한 값만 추린 대상.
export interface SlotAlertTarget {
  studioId: number | null;
  date: string | null; // YYYY-MM-DD
}

type TapListener = (target: SlotAlertTarget) => void;
const tapListeners = new Set<TapListener>();
// 콜드스타트 직후 앱이 구독하기 전에 도착한 탭은 보관했다가 첫 구독자에게 넘긴다.
let pendingTap: SlotAlertTarget | null = null;

const foregroundListeners = new Set<() => void>();

// 알림 탭 구독. 탭한 알림이 가리키는 날짜·합주실로 화면을 이동시키는 데 쓴다.
export function onNotificationTap(listener: TapListener): () => void {
  tapListeners.add(listener);
  if (pendingTap) {
    const target = pendingTap;
    pendingTap = null;
    listener(target);
  }
  return () => {
    tapListeners.delete(listener);
  };
}

// 앱을 보는 중(포그라운드) 알림 수신 구독. 슬롯 새로고침 트리거로 쓴다.
export function onForegroundNotification(listener: () => void): () => void {
  foregroundListeners.add(listener);
  return () => {
    foregroundListeners.delete(listener);
  };
}

export async function initPushDevice(): Promise<void> {
  if (initialized) return;
  initialized = true;
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

    // 토큰 갱신(refresh) 시 서버에 다시 등록.
    // 디바이스가 설치 ID 기준이라 구독은 새 토큰으로 그대로 이어진다.
    await FirebaseMessaging.addListener('tokenReceived', (event) => {
      if (event.token) void registerToken(event.token);
    });

    // 알림 탭(백그라운드/콜드스타트 포함) → 해당 화면으로 라우팅할 수 있게 앱에 알린다.
    await FirebaseMessaging.addListener('notificationActionPerformed', (event) => {
      handleNotificationTap(event.notification?.data);
    });

    // 앱을 보는 중 수신 → 시스템 배너 대신 화면 데이터를 갱신하는 트리거로 쓴다.
    await FirebaseMessaging.addListener('notificationReceived', () => {
      for (const listener of foregroundListeners) listener();
    });

    // 안드로이드: 빈자리 알림은 시간이 생명이라 헤드업 배너가 뜨는 HIGH 중요도
    // 채널을 만든다. 서버 발송이 이 채널 id 를 지정한다(fcm.ts 의 channelId 와 동일).
    if (Capacitor.getPlatform() === 'android') {
      await FirebaseMessaging.createChannel({
        id: 'slot-alerts',
        name: '빈자리 알림',
        description: '등록한 조건에 빈 시간이 생기면 알려드려요',
        importance: 4, // IMPORTANCE_HIGH
      }).catch((err) => console.warn('[push] 알림 채널 생성 실패', err));
    }

    const perm = await FirebaseMessaging.checkPermissions();
    if (perm.receive !== 'granted') return; // 권한 요청은 ensurePushReady 가 한다.

    const { token } = await FirebaseMessaging.getToken();
    if (token) await registerToken(token);
  } catch (err) {
    console.warn('[push] 초기화 실패', err);
  }
}

// 알림 등록 직전에 호출: 권한 확인·요청 → 토큰 확보 → 서버 디바이스 등록.
export async function ensurePushReady(): Promise<PushReadiness> {
  if (!Capacitor.isNativePlatform()) return 'unavailable';

  try {
    await initPushDevice(); // 토큰 갱신 리스너 등록을 보장한다.
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

    let perm = await FirebaseMessaging.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await FirebaseMessaging.requestPermissions();
    }
    if (perm.receive !== 'granted') return 'denied';

    const { token } = await FirebaseMessaging.getToken();
    if (!token) return 'denied';
    await registerToken(token);
    return 'granted';
  } catch (err) {
    console.warn('[push] 준비 실패', err);
    return 'denied';
  }
}

async function registerToken(token: string): Promise<void> {
  setDeviceToken(token);
  await registerDevice(Capacitor.getPlatform() as Platform, await appVersion());
}

function handleNotificationTap(data: unknown): void {
  const target = parseSlotAlertTarget(data);
  if (!target) return;
  if (tapListeners.size === 0) {
    pendingTap = target;
    return;
  }
  for (const listener of tapListeners) listener(target);
}

// FCM data 는 모두 문자열이다. slot_available 알림만 라우팅 대상으로 삼는다.
function parseSlotAlertTarget(data: unknown): SlotAlertTarget | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;
  if (record.type !== 'slot_available') return null;
  const studioId =
    typeof record.studioId === 'string' && /^\d+$/.test(record.studioId)
      ? Number(record.studioId)
      : null;
  const date =
    typeof record.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(record.date) ? record.date : null;
  if (studioId === null && date === null) return null;
  return { studioId, date };
}

async function appVersion(): Promise<string | null> {
  try {
    const info = await App.getInfo();
    return info.version ?? null;
  } catch {
    return null; // @capacitor/app 미지원 환경
  }
}
