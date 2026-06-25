import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hapjusil.app',
  appName: '합주실',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  ios: {
    // iOS 앱 빌드에서만 viewport-fit=cover 를 켜고, 네이티브 안전영역까지 콘텐츠를 채운다.
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#ffffff',
      showSpinner: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#009aa6',
    },
    // Capgo 라이브 업데이트(OTA). autoUpdate=true 면 앱 실행/복귀 때마다
    // Capgo 클라우드에서 새 웹 번들을 받아 다음 실행 때 자동 적용한다.
    // 스토어 재심사 없이 JS/CSS/HTML 변경을 배포할 수 있다(네이티브 변경은 제외).
    CapacitorUpdater: {
      autoUpdate: true,
      // 스토어로 네이티브 앱이 새로 깔리면 쌓여 있던 OTA 번들을 버리고 내장
      // 번들로 리셋한다 — 구버전 OTA 가 신버전 바이너리를 덮는 일을 막는다.
      resetWhenUpdate: true,
    },
  },
};

export default config;
