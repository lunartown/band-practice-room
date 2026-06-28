// 네이티브(Capacitor) 푸시 디바이스 등록. 앱 시작 시 1회 호출한다.
// @capacitor-firebase/messaging 으로 iOS·Android 모두 FCM 토큰을 받는다
// (백엔드 firebase-admin 이 FCM 토큰을 기대하므로 양 플랫폼을 FCM 으로 통일).
// 웹/PWA 에서는 네이티브 푸시를 쓰지 않으므로 아무 것도 하지 않는다.
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { registerDevice, setDeviceToken, type Platform } from './notificationsApi';

let initialized = false;

export async function initPushDevice(): Promise<void> {
  if (initialized) return;
  initialized = true;
  if (!Capacitor.isNativePlatform()) return;

  try {
    const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');
    const platform = Capacitor.getPlatform() as Platform;

    // 토큰 갱신(refresh) 시 서버에 다시 등록.
    await FirebaseMessaging.addListener('tokenReceived', (event) => {
      if (event.token) void registerToken(platform, event.token);
    });

    let perm = await FirebaseMessaging.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await FirebaseMessaging.requestPermissions();
    }
    if (perm.receive !== 'granted') return;

    const { token } = await FirebaseMessaging.getToken();
    if (token) await registerToken(platform, token);
  } catch (err) {
    console.warn('[push] 초기화 실패', err);
  }
}

async function registerToken(platform: Platform, token: string): Promise<void> {
  setDeviceToken(token);
  await registerDevice(platform, await appVersion());
}

async function appVersion(): Promise<string | null> {
  try {
    const info = await App.getInfo();
    return info.version ?? null;
  } catch {
    return null; // @capacitor/app 미지원 환경
  }
}
