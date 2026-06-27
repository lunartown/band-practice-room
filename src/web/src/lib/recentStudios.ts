const KEY = 'hapjusil:recent-studios:v1';
const MAX_RECENT_STUDIOS = 6;

export function loadRecentStudioIds(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is number => typeof id === 'number');
  } catch {
    return [];
  }
}

export function recordRecentStudioSelection(studioId: number): number[] {
  return recordRecentStudioSelections([studioId]);
}

export function recordRecentStudioSelections(studioIds: number[]): number[] {
  const current = loadRecentStudioIds();
  let next = current;
  for (const studioId of studioIds) {
    next = [studioId, ...next.filter((id) => id !== studioId)];
  }
  next = next.slice(0, MAX_RECENT_STUDIOS);
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // 저장 불가 환경은 조용히 무시한다. 현재 선택 동작은 그대로 유지된다.
  }
  return next;
}
