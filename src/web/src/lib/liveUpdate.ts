import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';

// Capgo 라이브 업데이트(OTA) 부팅 신호.
//
// capacitor.config 의 autoUpdate 모드에서, 플러그인은 앱 실행/복귀 때마다
// Capgo 클라우드에 새 웹 번들이 있는지 확인하고 백그라운드로 받아 둔 뒤
// 다음 실행 때 갈아끼운다. 단, 새 번들이 켜진 직후 일정 시간 안에
// notifyAppReady() 가 호출되지 않으면 "번들이 깨졌다"고 판단해 직전(또는
// 스토어에 심사된 내장) 번들로 자동 롤백한다.
//
// 따라서 앱이 정상적으로 떴다는 증거로, 진입 직후 이 함수를 반드시 부른다.
export async function notifyLiveUpdateReady(): Promise<void> {
  // 웹(Vercel) 환경엔 OTA 개념이 없다 — Vercel 배포가 곧 최신이다.
  if (!Capacitor.isNativePlatform()) return;
  try {
    await CapacitorUpdater.notifyAppReady();
  } catch {
    // 플러그인 미탑재/구버전 등은 조용히 무시한다. 앱 동작 자체엔 영향 없다.
  }
}
