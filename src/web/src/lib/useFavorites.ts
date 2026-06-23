import { useSyncExternalStore } from 'react';
import { getFavoritesSnapshot, subscribeFavorites } from './favorites';

/** 현재 즐겨찾기 ID 집합을 구독한다. 토글되면 리렌더된다. */
export function useFavorites(): ReadonlySet<number> {
  return useSyncExternalStore(subscribeFavorites, getFavoritesSnapshot, getFavoritesSnapshot);
}
