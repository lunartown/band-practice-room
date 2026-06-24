import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hapjusil.app',
  appName: '합주실',
  webDir: 'dist',
  backgroundColor: '#ffffff',
  ios: {
    // iOS 노치/홈 인디케이터 영역까지 콘텐츠가 채워지도록 (웹의 viewport-fit=cover와 맞춤)
    contentInset: 'never',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 800,
      backgroundColor: '#ffffff',
      showSpinner: false,
      // launchAutoHide 기본(true) 유지 — 800ms 뒤 스플래시 자동 숨김.
      // (capgo init 가 false 로 바꿔 Capgo 가 스플래시를 붙잡게 만든 걸 되돌림)
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#009aa6',
    },
    // Capgo 라이브 업데이트(OTA). 업데이트는 백그라운드에서만 받아 다음 실행
    // 때 적용한다. 스토어 재심사 없이 JS/CSS/HTML 변경을 배포할 수 있다.
    //
    // ⚠️ autoSplashscreen / directUpdate / autoUpdate:'always' 를 켜면 Capgo 가
    // 앱 실행 시 스플래시를 점유한 채 업데이트 확인을 기다리다 10초 세마포어
    // 타임아웃이 나, 매번 앱이 10초 멈췄다 뜨고 데이터 로딩도 그만큼 밀린다.
    // capgo init 마법사가 이를 켜놨던 걸 모두 비공격적 기본값으로 되돌린다.
    CapacitorUpdater: {
      autoUpdate: true, // = atBackground. 실행을 막지 않고 뒤에서 받음.
      autoSplashscreen: false, // Capgo 스플래시 점유 OFF → 10초 멈춤 제거
      directUpdate: false, // 실행 시 강제 설치 OFF
      // 스토어로 네이티브 앱이 새로 깔리면 쌓여 있던 OTA 번들을 버리고 내장
      // 번들로 리셋한다 — 구버전 OTA 가 신버전 바이너리를 덮는 일을 막는다.
      resetWhenUpdate: true,
      appId: 'com.hapjusil.app',
      version: '0.0.0',
    },
  },
};

export default config;
