import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import { App } from './App';
import { initFavorites } from './lib/favorites';
import './styles.css';

// 저장된 즐겨찾기를 기기에서 미리 불러온다(렌더 전에 시작, 완료되면 구독자에 반영).
void initFavorites();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
    <Analytics />
  </React.StrictMode>,
);
