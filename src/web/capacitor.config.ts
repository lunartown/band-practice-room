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
    },
    // 상단바가 흰색(--surface)으로 이어지도록 상태표시줄은 흰 배경 + 어두운 아이콘.
    // (style LIGHT = 밝은 배경용 = 어두운 글자/아이콘.) Android overlay=false 일 때
    // 이 배경색이 칠해진다. 런타임(main.tsx)에서도 같은 값으로 덮어 깜빡임을 줄인다.
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
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
