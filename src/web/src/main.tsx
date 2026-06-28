import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Analytics } from '@vercel/analytics/react';
import { AdminApp } from './AdminApp';
import { App } from './App';
import { initFavorites } from './lib/favorites';
import { notifyLiveUpdateReady } from './lib/liveUpdate';
import { initPushDevice } from './lib/pushDevice';
import './styles.css';

// 네이티브 앱(Capacitor)에서 상단 상태표시줄 처리. 플랫폼별 클래스(is-ios/is-android)도
// 붙여 CSS에서 구분한다. 웹/PWA에는 어떤 클래스도 붙지 않아 기존 최소 여백을 그대로 쓴다.
if (Capacitor.isNativePlatform()) {
  const root = document.documentElement;
  const platform = Capacitor.getPlatform();

  root.classList.add('is-native');
  root.classList.add(`is-${platform}`);

  // 네이티브 앱에서는 WebView 가 상태표시줄 아래에서 시작하게 한다.
  // iOS 의 CSS env(safe-area-inset-top) 값이 0으로 떨어지는 케이스가 있어,
  // CSS padding 대신 StatusBar 플러그인의 native inset 처리를 사용한다.
  if (platform === 'ios' || platform === 'android') {
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    // 상단바가 흰색(--surface)으로 이어지도록 상태표시줄도 흰 배경 + 어두운 아이콘.
    // (Style.Light = 밝은 배경용 = 어두운 글자/아이콘.)
    StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  }
}

// 저장된 즐겨찾기를 기기에서 미리 불러온다(렌더 전에 시작, 완료되면 구독자에 반영).
void initFavorites();

// 네이티브 푸시 디바이스 등록(권한 요청 → 토큰 → 서버 등록). 웹/PWA 에선 무동작.
void initPushDevice();

// 앱(Capacitor)에서 OTA 번들이 정상 부팅됐음을 Capgo 에 알린다(웹에선 무동작).
// 호출이 없으면 새 번들이 자동 롤백되므로 진입 직후 부른다.
void notifyLiveUpdateReady();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {window.location.pathname.startsWith('/admin') ? <AdminApp /> : <App />}
    <Analytics />
  </React.StrictMode>,
);
