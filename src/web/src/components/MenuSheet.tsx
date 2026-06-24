import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { shareApp } from '../lib/share';

const DISMISS_THRESHOLD = 70; // 이 거리 이상 왼쪽으로 끌면 닫는다

const KAKAO_OPENCHAT_URL = 'https://open.kakao.com/o/s5wce6Ai';
const PRIVACY_PATH = '/privacy.html';

// 외부 링크(카카오 오픈채팅 등)는 항상 새 창/외부 앱으로 연다.
function openExternal(url: string) {
  window.open(url, '_blank', 'noopener');
}

// 개인정보처리방침은 빌드에 같이 번들되는 정적 페이지(public/privacy.html)다.
// 웹·네이티브 모두 같은 창으로 이동한다 — 페이지 하단의 "합주실로 돌아가기"(href="/")로
// 복귀하므로 갇히지 않고, 로컬 번들이라 오프라인에서도 열린다.
function openPrivacy() {
  window.location.href = PRIVACY_PATH;
}

interface MenuSheetProps {
  onClose: () => void;
}

export function MenuSheet({ onClose }: MenuSheetProps) {
  const [version, setVersion] = useState<string | null>(null);

  // 버전은 네이티브에서만 의미가 있다(웹은 상시 최신). 실패해도 조용히 숨긴다.
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    CapApp.getInfo()
      .then((info) => setVersion(info.version))
      .catch(() => {});
  }, []);

  const [dragX, setDragX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startX = useRef(0);

  function onDragStart(e: React.PointerEvent) {
    if ((e.target as HTMLElement).closest('button')) return; // 닫기 버튼 탭은 드래그로 보지 않음
    startX.current = e.clientX;
    setDragging(true);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragging) return;
    setDragX(Math.min(0, e.clientX - startX.current));
  }

  function onDragEnd() {
    if (!dragging) return;
    setDragging(false);
    if (dragX < -DISMISS_THRESHOLD) onClose();
    else setDragX(0);
  }

  // 메뉴 항목을 누르면 동작 후 시트를 닫는다.
  const run = (fn: () => void) => () => {
    fn();
    onClose();
  };

  return (
    <div className="sheet-layer">
      <button className="sheet-dim" aria-label="메뉴 닫기" onClick={onClose} />
      <section
        className="menu-drawer"
        role="dialog"
        aria-label="메뉴"
        style={{
          transform: dragX ? `translateX(${dragX}px)` : undefined,
          transition: dragging ? 'none' : undefined,
        }}
      >
        <header
          className="menu-drawer-head"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <h2>합주실닷컴</h2>
          <button className="menu-close" aria-label="메뉴 닫기" onClick={onClose}>
            <CloseIcon />
          </button>
        </header>

        <div className="menu-list">
          {/* 카테고리: 현재는 합주실 하나, 추후 개인 연습실·공연장이 형제로 추가된다. */}
          <nav className="menu-nav" aria-label="카테고리">
            <button className="nav-item active" aria-current="page" onClick={onClose}>
              <span className="nav-item-icon"><BandIcon /></span>
              <span className="nav-item-label">합주실</span>
            </button>
          </nav>

          <div className="menu-section-label">지원</div>
          <button className="menu-item" onClick={run(() => openExternal(KAKAO_OPENCHAT_URL))}>
            <span className="menu-item-icon"><ChatIcon /></span>
            <span className="menu-item-text">
              <span className="menu-item-title">문의 · 제보</span>
              <span className="menu-item-sub">카카오 오픈채팅으로 연결돼요</span>
            </span>
            <ExternalIcon />
          </button>

          <button className="menu-item" onClick={run(() => void shareApp())}>
            <span className="menu-item-icon"><ShareIcon /></span>
            <span className="menu-item-text">
              <span className="menu-item-title">앱 공유</span>
            </span>
          </button>

          <button className="menu-item" onClick={run(openPrivacy)}>
            <span className="menu-item-icon"><DocIcon /></span>
            <span className="menu-item-text">
              <span className="menu-item-title">개인정보처리방침</span>
            </span>
          </button>
        </div>

        <footer className="menu-footer">
          <span>{version ? `v${version}` : 'hapjusil.com'}</span>
        </footer>
      </section>
    </div>
  );
}

function BandIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 18V5l11-2v13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="17" cy="16" r="3" stroke="currentColor" strokeWidth="1.8" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5C6.9 3.5 3 6.8 3 10.7c0 2.5 1.7 4.7 4.2 5.9-.2.7-.7 2.4-.8 2.8 0 .2.1.4.4.2.3-.2 2.6-1.7 3.6-2.4.5.1 1.1.1 1.6.1 5.1 0 9-3.3 9-7.2S17.1 3.5 12 3.5z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="18" cy="5" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="6" cy="12" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="18" cy="19" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M8.1 10.9l7.8-4.6M8.1 13.1l7.8 4.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 3h8l4 4v14H6z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      <path d="M14 3v4h4M9 13h6M9 17h6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg className="menu-item-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6h9v9M18 6l-9 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
