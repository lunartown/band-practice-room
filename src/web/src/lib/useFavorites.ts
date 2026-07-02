import { useCallback, useSyncExternalStore } from 'react';
import { getFavoritesSnapshot, isFavorite, subscribeFavorites } from './favorites';

const EMPTY_FAVORITES: ReadonlySet<number> = new Set();

interface UseFavoritesOptions {
  enabled?: boolean;
}

/**
 * 현재 즐겨찾기 ID 집합을 구독한다.
 *
 * 결과 목록 같은 큰 화면은 즐겨찾기 필터/검색이 열렸을 때만 전체 집합이 필요하다.
 * `enabled=false` 동안에는 안정적인 빈 Set 을 반환해 즐겨찾기 토글이 App 전체를
 * 다시 렌더링하지 않게 한다.
 */
export function useFavorites(options: UseFavoritesOptions = {}): ReadonlySet<number> {
  const enabled = options.enabled ?? true;
  const getSnapshot = useCallback(
    () => (enabled ? getFavoritesSnapshot() : EMPTY_FAVORITES),
    [enabled],
  );

  return useSyncExternalStore(subscribeFavorites, getSnapshot, getSnapshot);
}

/** 특정 합주실 하나의 즐겨찾기 여부만 구독한다. */
export function useFavorite(id: number): boolean {
  const getSnapshot = useCallback(() => isFavorite(id), [id]);
  return useSyncExternalStore(subscribeFavorites, getSnapshot, getSnapshot);
}
