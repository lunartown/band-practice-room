import { defaultFilters } from '../components/FilterSheet';
import type { FilterState } from '../components/FilterSheet';
import { todayKst } from './date';

// 재방문 시 마지막 조건은 그대로 복원하되, 오픈 화면은 다음 두 경우에 다시 띄운다.
//  1) 콜드스타트  — 이번 실행(세션)에서 아직 진입한 적이 없을 때.
//     앱을 완전히 종료/재실행하거나 웹을 새 탭으로 열면 sessionStorage가 비므로
//     매 콜드스타트마다 오픈 화면이 다시 뜬다(같은 탭 새로고침·warm resume은 유지).
//  2) TTL 초과   — 마지막 방문 후 충분히 오래 지났을 때(오랜만의 재방문).
// 자주 오는 사람도 앱을 껐다 켜면 예쁜 오픈 화면을 다시 보게 된다.
const KEY = 'hapjusil:prefs:v1';
// 같은 세션 안에서, 마지막 방문 후 이 시간이 지나면 오픈 화면을 다시 띄운다.
const FRESH_TTL_MS = 6 * 60 * 60 * 1000;
// 이번 실행(세션)에서 이미 진입했는지 표시. WebView/탭이 살아있는 동안만 유지된다.
const SESSION_KEY = 'hapjusil:entered-session';

export interface SavedPrefs {
  filters: FilterState;
  // true면 오픈 화면을 건너뛰고 바로 결과로 진입한다(최근 방문 + 같은 세션).
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
    // 오픈 화면을 건너뛰려면 (1) 이번 실행에서 이미 진입했고(=콜드스타트 아님)
    // (2) 마지막 방문이 TTL 이내여야 한다. savedAt이 없으면(구버전) 오랜만으로 본다.
    const ttlFresh = typeof parsed.savedAt === 'number' && Date.now() - parsed.savedAt < FRESH_TTL_MS;
    const fresh = ttlFresh && enteredThisSession();
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
