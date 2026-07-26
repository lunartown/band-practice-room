import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const DISMISS_THRESHOLD = 110; // 이 거리 이상 아래로 끌면 닫는다
const CLOSE_DURATION_MS = 260;

interface BottomSheetRenderProps {
  requestClose: () => void;
}

interface BottomSheetProps {
  ariaLabel: string;
  onClose: () => void;
  /** .filter-sheet 뒤에 덧붙는 모디파이어 클래스 (예: 'alert-sheet', 'area-sheet') */
  sheetClassName?: string;
  /** .sheet-dim 뒤에 덧붙는 모디파이어 클래스. 페이드 애니메이션이 필요하면 'filter-dim' */
  dimClassName?: string;
  header: (props: BottomSheetRenderProps) => ReactNode;
  footer?: (props: BottomSheetRenderProps) => ReactNode;
  children: ReactNode;
}

// 하단에서 올라오는 시트 공용 컴포넌트. 드래그로 끌어 닫기·닫힘 애니메이션을 담당하고,
// header/footer는 requestClose를 받아 각자 버튼에 연결한다(즉시 unmount 대신 슬라이드 아웃 후 onClose).
export function BottomSheet({
  ariaLabel,
  onClose,
  sheetClassName,
  dimClassName,
  header,
  footer,
  children,
}: BottomSheetProps) {
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [closing, setClosing] = useState(false);
  const startY = useRef(0);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, []);

  function requestClose() {
    if (closing || closeTimer.current !== null) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onClose();
      return;
    }

    setDragging(false);
    setClosing(true);
    closeTimer.current = window.setTimeout(onClose, CLOSE_DURATION_MS + 80);
  }

  function finishClose(e: React.TransitionEvent<HTMLElement>) {
    if (!closing || e.target !== e.currentTarget || e.propertyName !== 'transform') return;
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = null;
    onClose();
  }

  function onDragStart(e: React.PointerEvent) {
    if (closing) return;
    if ((e.target as HTMLElement).closest('button')) return; // 버튼 탭은 드래그로 보지 않음
    startY.current = e.clientY;
    setDragging(true);
    (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
  }

  function onDragMove(e: React.PointerEvent) {
    if (!dragging || closing) return;
    setDragY(Math.max(0, e.clientY - startY.current));
  }

  function onDragEnd() {
    if (!dragging) return;
    setDragging(false);
    if (dragY > DISMISS_THRESHOLD) requestClose();
    else setDragY(0);
  }

  const sheetTransform = closing
    ? 'translateY(calc(100% + var(--sp-4)))'
    : dragY
      ? `translateY(${dragY}px)`
      : undefined;

  return (
    <div className="sheet-layer sheet-layer--safe">
      <div
        className={`sheet-dim${dimClassName ? ` ${dimClassName}` : ''}${closing ? ' closing' : ''}`}
        aria-hidden="true"
        onClick={requestClose}
      />
      <section
        className={`filter-sheet filter-sheet-motion${sheetClassName ? ` ${sheetClassName}` : ''}${closing ? ' closing' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={ariaLabel}
        onTransitionEnd={finishClose}
        style={{
          transform: sheetTransform,
          transition: dragging ? 'none' : undefined,
        }}
      >
        <div
          className="sheet-drag"
          onPointerDown={onDragStart}
          onPointerMove={onDragMove}
          onPointerUp={onDragEnd}
          onPointerCancel={onDragEnd}
        >
          <div className="sheet-handle" />
          {header({ requestClose })}
        </div>

        <div className="sheet-body">{children}</div>

        {footer?.({ requestClose })}
      </section>
    </div>
  );
}
