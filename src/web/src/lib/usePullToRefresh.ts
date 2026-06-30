import { useEffect, useRef, useState } from 'react';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// 리스트 맨 위에서 아래로 당기면(scrollTop===0) 새로고침하는 제스처 훅.
// 모바일(터치) 전용 — 데스크톱에선 트리거되지 않는다.
const THRESHOLD = 70; // 이 거리 이상 당기고 놓으면 새로고침
const MAX_PULL = 112; // 시각적으로 늘어나는 최대 거리(고무줄 상한)
const RESISTANCE = 0.5; // 당김 저항(손가락 이동량 대비 늘어나는 비율)

interface Options {
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

interface PullState<T extends HTMLElement> {
  ref: React.RefObject<T>;
  pull: number; // 현재 늘어난 거리(px)
  progress: number; // 0~1, 임계치 대비 진행도
  refreshing: boolean;
  dragging: boolean; // 손가락이 닿아 끌고 있는 중인지(스냅 애니메이션 토글용)
}

export function usePullToRefresh<T extends HTMLElement>({ onRefresh, disabled }: Options): PullState<T> {
  const ref = useRef<T>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [dragging, setDragging] = useState(false);

  // 핸들러가 항상 최신 콜백/상태를 보도록 ref 로 보관한다.
  // 이렇게 하면 리스너를 매 프레임 재바인딩하지 않아도 된다.
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const refreshingRef = useRef(false);
  const gesture = useRef({ startY: 0, pulling: false, armed: false });

  useEffect(() => {
    const scroller = ref.current;
    if (!scroller || disabled) return;

    function onTouchStart(e: TouchEvent) {
      if (refreshingRef.current || scroller!.scrollTop > 0) return;
      gesture.current = { startY: e.touches[0].clientY, pulling: true, armed: false };
    }

    function onTouchMove(e: TouchEvent) {
      const g = gesture.current;
      if (!g.pulling || refreshingRef.current) return;
      const dy = e.touches[0].clientY - g.startY;
      // 위로 끄는 의도거나 이미 스크롤이 내려가 있으면 제스처 취소.
      if (dy <= 0 || scroller!.scrollTop > 0) {
        g.pulling = false;
        setDragging(false);
        setPull(0);
        return;
      }
      // 당기는 동안엔 네이티브 오버스크롤/당겨서-새로고침을 막는다.
      e.preventDefault();
      setDragging(true);
      const dist = Math.min(MAX_PULL, dy * RESISTANCE);
      setPull(dist);
      const armed = dist >= THRESHOLD;
      if (armed !== g.armed) {
        g.armed = armed;
        if (armed) void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      }
    }

    function onTouchEnd() {
      const g = gesture.current;
      if (!g.pulling) return;
      g.pulling = false;
      setDragging(false);
      if (g.armed) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPull(THRESHOLD); // 스피너가 보이는 높이로 스냅
        void Promise.resolve(onRefreshRef.current())
          .catch(() => {})
          .finally(() => {
            refreshingRef.current = false;
            setRefreshing(false);
            setPull(0);
          });
      } else {
        setPull(0);
      }
      g.armed = false;
    }

    scroller.addEventListener('touchstart', onTouchStart, { passive: true });
    scroller.addEventListener('touchmove', onTouchMove, { passive: false });
    scroller.addEventListener('touchend', onTouchEnd);
    scroller.addEventListener('touchcancel', onTouchEnd);
    return () => {
      scroller.removeEventListener('touchstart', onTouchStart);
      scroller.removeEventListener('touchmove', onTouchMove);
      scroller.removeEventListener('touchend', onTouchEnd);
      scroller.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [disabled]);

  return { ref, pull, progress: Math.min(1, pull / THRESHOLD), refreshing, dragging };
}
