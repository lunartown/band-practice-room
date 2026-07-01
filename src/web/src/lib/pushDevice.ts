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

async function appVersion(): Promise<string | null> {
  try {
    const info = await App.getInfo();
    return info.version ?? null;
  } catch {
    return null; // @capacitor/app 미지원 환경
  }
}
