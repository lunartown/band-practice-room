import { defaultFilters } from '../components/FilterSheet';
import type { FilterState } from '../components/FilterSheet';
import { todayKst } from './date';

// 재방문 시 마지막 조건을 그대로 복원해 오픈 화면을 건너뛰게 한다.
const KEY = 'hapjusil:prefs:v1';

export function loadFilters(): FilterState | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { filters?: Partial<FilterState> };
    const f = parsed.filters;
    if (!f) return null;
    // 저장된 날짜 중 이미 지난 날은 버린다. 며칠 전 고른 날짜를 그대로 복원하면
    // API가 과거 날짜를 거부(INVALID_DATE)해 재방문자가 에러 화면에 갇힌다.
    const today = todayKst();
    const dates = Array.isArray(f.dates)
      ? f.dates.filter((d) => typeof d === 'string' && d >= today)
      : defaultFilters.dates;
    // 저장 구조가 바뀌어도 깨지지 않게 기본값 위에 덮어쓴다.
    return {
      ...defaultFilters,
      ...f,
      areaIds: Array.isArray(f.areaIds) ? f.areaIds : defaultFilters.areaIds,
      dates,
      timeWindows: Array.isArray(f.timeWindows) ? f.timeWindows : defaultFilters.timeWindows,
    };
  } catch {
    return null;
  }
}

export function saveFilters(filters: FilterState) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ filters }));
  } catch {
    // 시크릿 모드 등 저장 불가 환경은 조용히 무시한다.
  }
}
