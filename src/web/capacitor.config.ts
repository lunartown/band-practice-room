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
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#009aa6',
    },
  },
};

export default config;
