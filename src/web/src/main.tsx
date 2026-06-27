import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Analytics } from '@vercel/analytics/react';
import { AdminApp } from './AdminApp';
import { App } from './App';
import { initFavorites } from './lib/favorites';
import { notifyLiveUpdateReady } from './lib/liveUpdate';
import './styles.css';

// 네이티브 앱(Capacitor)에서 상단 상태표시줄 처리. 플랫폼별 클래스(is-ios/is-android)도
// 붙여 CSS에서 구분한다. 웹/PWA에는 어떤 클래스도 붙지 않아 기존 최소 여백을 그대로 쓴다.
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('is-native');
  document.documentElement.classList.add(`is-${Capacitor.getPlatform()}`);

  // iOS: contentInset:never + viewport-fit=cover 로 edge-to-edge 유지하고,
  //      상단 안전영역(노치)은 CSS env(safe-area-inset-top)로 민다.
  // Android: env(safe-area-inset-top)이 노치 없는/특정 기종(예: Galaxy A16)에서
  //      0으로 잡혀 WebView가 상태표시줄을 덮었다. overlay를 꺼 네이티브가
  //      상태표시줄 공간을 직접 확보하게 하면 기기 상관없이 콘텐츠가 그 아래에서
  //      시작한다. (이때 env 는 더하지 않는다 — styles.css 에서 iOS 로만 한정.)
  if (Capacitor.getPlatform() === 'android') {
    StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
    // 상단바가 흰색(--surface)으로 이어지도록 상태표시줄도 흰 배경 + 어두운 아이콘.
    // (Style.Light = 밝은 배경용 = 어두운 글자/아이콘.) config 의 teal 기본값을 덮는다.
    StatusBar.setBackgroundColor({ color: '#ffffff' }).catch(() => {});
    StatusBar.setStyle({ style: Style.Light }).catch(() => {});
  }
}

// 저장된 즐겨찾기를 기기에서 미리 불러온다(렌더 전에 시작, 완료되면 구독자에 반영).
void initFavorites();

// 앱(Capacitor)에서 OTA 번들이 정상 부팅됐음을 Capgo 에 알린다(웹에선 무동작).
// 호출이 없으면 새 번들이 자동 롤백되므로 진입 직후 부른다.
void notifyLiveUpdateReady();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {window.location.pathname.startsWith('/admin') ? <AdminApp /> : <App />}
    <Analytics />
  </React.StrictMode>,
);
