import { defaultFilters } from '../components/FilterSheet';
import type { FilterState } from '../components/FilterSheet';
import { todayKst } from './date';

// 재방문 시 마지막 조건을 그대로 복원하되, 마지막 방문이 충분히 오래됐으면
// (TTL 초과) 오픈 화면을 다시 보여준다. 자주 오는 사람은 바로 결과로,
// 오랜만에 오는 사람은 다시 오픈 화면으로.
const KEY = 'hapjusil:prefs:v1';
// 마지막 방문 후 이 시간이 지나면 오픈 화면을 다시 띄운다.
const FRESH_TTL_MS = 6 * 60 * 60 * 1000;

export interface SavedPrefs {
  filters: FilterState;
  // true면 오픈 화면을 건너뛰고 바로 결과로 진입한다(최근 방문).
  fresh: boolean;
}

export function loadFilters(): SavedPrefs | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { filters?: Partial<FilterState>; savedAt?: number };
    const f = parsed.filters;
    if (!f) return null;
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
      dates,
      timeWindows: Array.isArray(f.timeWindows) ? f.timeWindows : defaultFilters.timeWindows,
    };
    // savedAt이 없거나(구버전 저장값) TTL을 넘겼으면 오랜만의 방문으로 본다.
    const fresh = typeof parsed.savedAt === 'number' && Date.now() - parsed.savedAt < FRESH_TTL_MS;
    return { filters, fresh };
  } catch {
    return null;
  }
}

export function saveFilters(filters: FilterState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ filters, savedAt: Date.now() }));
  } catch {
    // 시크릿 모드 등 저장 불가 환경은 조용히 무시한다.
  }
}
