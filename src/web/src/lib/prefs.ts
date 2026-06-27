import { Capacitor } from '@capacitor/core';
import { defaultFilters } from '../components/FilterSheet';
import type { FilterState } from '../components/FilterSheet';
import { todayKst } from './date';

// 마지막 조건은 같은 실행 세션에서 최근에 다시 들어온 경우에만 복원한다.
// 앱을 완전히 종료/재실행하거나 웹을 새 탭으로 열면 sessionStorage가 비므로
// 저장된 localStorage 필터를 무시하고 기본 필터 + 오픈 화면으로 시작한다.
// 네이티브 앱은 부팅 시 저장 필터를 복원하지 않는다. warm resume은 JS/React 상태가
// 그대로 살아있고, 콜드스타트는 WebView 저장소 상태와 무관하게 기본 필터로 시작한다.
const KEY = 'hapjusil:prefs:v1';
// 같은 세션 안에서, 마지막 방문 후 이 시간이 지나면 오픈 화면을 다시 띄운다.
const FRESH_TTL_MS = 6 * 60 * 60 * 1000;
// 이번 실행(세션)에서 이미 진입했는지 표시. WebView/탭이 살아있는 동안만 유지된다.
const SESSION_KEY = 'hapjusil:entered-session';

export interface SavedPrefs {
  filters: FilterState;
  // true면 오픈 화면을 건너뛰고 바로 결과로 진입한다(최근 방문 + 같은 실행 세션).
  fresh: boolean;
}

function enteredThisSession(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

// 진입 상태가 되면 호출해 "이번 실행에서 진입함"을 기록한다.
export function markEntered() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1');
  } catch {
    // 저장 불가 환경은 조용히 무시한다(매번 오픈 화면이 떠도 동작은 정상).
  }
}

export function loadFilters(): SavedPrefs | null {
  try {
    if (Capacitor.isNativePlatform()) {
      localStorage.removeItem(KEY);
      return null;
    }
    if (!enteredThisSession()) return null;

    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { filters?: Partial<FilterState>; savedAt?: number };
    const f = parsed.filters;
    if (!f) return null;

    // 같은 실행 세션이어도 너무 오래 지난 조건은 새 탐색으로 보고 복원하지 않는다.
    const ttlFresh = typeof parsed.savedAt === 'number' && Date.now() - parsed.savedAt < FRESH_TTL_MS;
    if (!ttlFresh) return null;

    // 저장된 날짜 중 이미 지난 날은 버린다. 며칠 전 고른 날짜를 그대로 복원하면
    // API가 과거 날짜를 거부(INVALID_DATE)해 재방문자가 에러 화면에 갇힌다.
    const today = todayKst();
    const dates = Array.isArray(f.dates)
      ? f.dates.filter((d) => typeof d === 'string' && d >= today)
      : defaultFilters.dates;
    // 저장 구조가 바뀌어도 깨지지 않게 기본값 위에 덮어쓴다.
    const filters = {
      ...defaultFilters,
      ...f,
      areaIds: Array.isArray(f.areaIds) ? f.areaIds : defaultFilters.areaIds,
      studioIds: readStudioIds(f),
      dates,
      timeWindows: Array.isArray(f.timeWindows) ? f.timeWindows : defaultFilters.timeWindows,
    };
    return { filters, fresh: true };
  } catch {
    return null;
  }
}

export function saveFilters(filters: FilterState) {
  try {
    if (Capacitor.isNativePlatform()) return;
    localStorage.setItem(KEY, JSON.stringify({ filters, savedAt: Date.now() }));
  } catch {
    // 시크릿 모드 등 저장 불가 환경은 조용히 무시한다.
  }
}

function readStudioIds(f: Partial<FilterState>): number[] {
  if (Array.isArray(f.studioIds)) {
    return f.studioIds.filter((id): id is number => typeof id === 'number');
  }
  const legacy = f as Partial<FilterState> & { studioId?: unknown };
  return typeof legacy.studioId === 'number' ? [legacy.studioId] : defaultFilters.studioIds;
}
