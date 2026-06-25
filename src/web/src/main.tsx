import React from 'react';
import ReactDOM from 'react-dom/client';
import { Capacitor } from '@capacitor/core';
import { Analytics } from '@vercel/analytics/react';
import { App } from './App';
import { initFavorites } from './lib/favorites';
import { notifyLiveUpdateReady } from './lib/liveUpdate';
import './styles.css';

// 네이티브 앱(Capacitor)은 WebView가 상태표시줄/노치 아래까지 채우므로
// (contentInset:never + viewport-fit=cover) 상단 안전영역을 CSS로 따로 밀어줘야 한다.
// 웹/PWA에는 이 클래스가 붙지 않아 기존 최소 여백을 그대로 쓴다.
if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('is-native');
}

// 저장된 즐겨찾기를 기기에서 미리 불러온다(렌더 전에 시작, 완료되면 구독자에 반영).
void initFavorites();

// 앱(Capacitor)에서 OTA 번들이 정상 부팅됐음을 Capgo 에 알린다(웹에선 무동작).
// 호출이 없으면 새 번들이 자동 롤백되므로 진입 직후 부른다.
void notifyLiveUpdateReady();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
);
