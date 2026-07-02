import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// 즐겨찾는 합주실(지점) ID 집합을 기기에 영구 저장한다.
//
// 저장은 Capacitor Preferences 를 쓴다 — 앱에선 iOS UserDefaults / Android
// SharedPreferences 같은 네이티브 저장소에, 웹에선 localStorage 에 떨어진다.
// 단순 웹뷰 래퍼가 아니라 "기기에 내 즐겨찾기를 들고 다니는" 네이티브 가치를
// 만드는 핵심 기능이다.
const KEY = 'hapjusil:favorites:v1';

// useSyncExternalStore 용 스냅샷. 불변 Set 을 두고, 바뀔 때마다 참조를 통째로
// 교체해 React 가 변경을 감지하게 한다.
let ids: ReadonlySet<number> = new Set();
let loaded = false;
const listeners = new Set<() => void>();

function emit() {
  for (const fn of listeners) fn();
}

async function persist() {
  try {
    await Preferences.set({ key: KEY, value: JSON.stringify([...ids]) });
  } catch {
    // 저장 실패(용량 초과 등)는 조용히 무시한다. 메모리 상태는 유지된다.
  }
}

/** 앱 시작 시 1회. 저장된 즐겨찾기를 메모리로 끌어온다. */
export async function initFavorites(): Promise<void> {
  try {
    const { value } = await Preferences.get({ key: KEY });
    if (value) {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        ids = new Set(parsed.filter((x): x is number => typeof x === 'number'));
      }
    }
  } catch {
    // 파싱/읽기 실패 시 빈 집합으로 시작한다.
  } finally {
    loaded = true;
    emit();
  }
}

export function isFavoritesLoaded(): boolean {
  return loaded;
}

/** 즐겨찾기 토글. 햅틱으로 네이티브 촉감 피드백을 준다. */
export function toggleFavorite(id: number): void {
  const next = new Set(ids);
  const willAdd = !next.has(id);
  if (willAdd) next.add(id);
  else next.delete(id);
  ids = next;
  emit();

  // 추가는 또렷하게(Medium), 해제는 가볍게(Light). 웹에선 무음으로 떨어진다.
  void Haptics.impact({ style: willAdd ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {});

  void persist();
}

// --- React 바인딩 (useSyncExternalStore) ---

export function subscribeFavorites(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getFavoritesSnapshot(): ReadonlySet<number> {
  return ids;
}

export function isFavorite(id: number): boolean {
  return ids.has(id);
}
