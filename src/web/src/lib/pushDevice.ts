// 네이티브(Capacitor) 푸시 디바이스 등록. 앱 시작 시 1회 호출한다.
// 권한 요청 → 등록 → FCM 토큰 수신 시 서버에 디바이스를 올린다.
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
    const { PushNotifications } = await import('@capacitor/push-notifications');
    const platform = Capacitor.getPlatform() as Platform;

    // 토큰 수신 → 서버 등록. (register() 호출 후 비동기로 도착)
    await PushNotifications.addListener('registration', (token) => {
      setDeviceToken(token.value);
      void registerDevice(platform, null).then(() => resolveAppVersion(platform));
    });
    await PushNotifications.addListener('registrationError', (err) => {
      console.warn('[push] 등록 오류', err);
    });

    let perm = await PushNotifications.checkPermissions();
    if (perm.receive === 'prompt' || perm.receive === 'prompt-with-rationale') {
      perm = await PushNotifications.requestPermissions();
    }
    if (perm.receive !== 'granted') return;

    await PushNotifications.register();
  } catch (err) {
    console.warn('[push] 초기화 실패', err);
  }
}

// 앱 버전을 곁들여 디바이스 정보를 한 번 더 갱신(있으면). 실패해도 무시.
async function resolveAppVersion(platform: Platform): Promise<void> {
  try {
    const info = await App.getInfo();
    await registerDevice(platform, info.version ?? null);
  } catch {
    /* @capacitor/app 미지원 환경 무시 */
  }
}
