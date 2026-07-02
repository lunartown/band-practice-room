import type { CapacitorConfig } from '@capacitor/cli';

type AppVariant = 'prod' | 'dev' | 'local';

const appVariant = (process.env.CAPACITOR_APP_VARIANT ?? 'prod') as AppVariant;

const variantConfig: Record<
  AppVariant,
  {
    appId: string;
    appName: string;
    capgoChannel?: string;
    autoUpdate: boolean;
  }
> = {
  prod: {
    appId: 'com.hapjusil.app',
    appName: '합주실',
    capgoChannel: 'production',
    autoUpdate: true,
  },
  dev: {
    appId: 'com.hapjusil.app.dev',
    appName: '합주실 Dev',
    capgoChannel: 'dev',
    autoUpdate: true,
  },
  local: {
    appId: 'com.hapjusil.app.local',
    appName: '합주실 Local',
    autoUpdate: false,
  },
};

const selectedVariant = variantConfig[appVariant] ?? variantConfig.prod;

const config: CapacitorConfig = {
  appId: selectedVariant.appId,
  appName: selectedVariant.appName,
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
    // iOS 는 기본적으로 앱이 포그라운드일 때 알림을 표시하지 않는다.
    // 빈자리 알림은 앱을 보는 중에도 배너로 떠야 의미가 있어 표시 옵션을 켠다.
    // (네이티브 설정이라 cap sync + 스토어 릴리스에만 반영, OTA 로는 안 나간다.)
    FirebaseMessaging: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // 상단바가 흰색(--surface)으로 이어지도록 상태표시줄은 흰 배경 + 어두운 아이콘.
    // (style LIGHT = 밝은 배경용 = 어두운 글자/아이콘.) Android overlay=false 일 때
    // 이 배경색이 칠해진다. 런타임(main.tsx)에서도 같은 값으로 덮어 깜빡임을 줄인다.
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#ffffff',
      overlaysWebView: false,
    },
    SystemBars: {
      style: 'LIGHT',
      insetsHandling: 'css',
    },
    // Capgo 라이브 업데이트(OTA). autoUpdate=true 면 앱 실행/복귀 때마다
    // Capgo 클라우드에서 새 웹 번들을 받아 다음 실행 때 자동 적용한다.
    // 스토어 재심사 없이 JS/CSS/HTML 변경을 배포할 수 있다(네이티브 변경은 제외).
    CapacitorUpdater: {
      appId: selectedVariant.appId,
      autoUpdate: selectedVariant.autoUpdate,
      defaultChannel: selectedVariant.capgoChannel,
      // 스토어로 네이티브 앱이 새로 깔리면 쌓여 있던 OTA 번들을 버리고 내장
      // 번들로 리셋한다 — 구버전 OTA 가 신버전 바이너리를 덮는 일을 막는다.
      resetWhenUpdate: true,
    },
  },
};

export default config;
