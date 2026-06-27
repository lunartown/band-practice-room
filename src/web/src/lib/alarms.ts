import { Preferences } from '@capacitor/preferences';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

// "자리 나면 알려줘" 알림을 건 합주실(지점) ID 집합을 기기에 저장한다.
//
// 즐겨찾기(favorites)와 같은 패턴이지만 의미가 다르다. 즐겨찾기는 "내가 자주 가는
// 곳"(상시 선호)이고, 알림은 "지금은 다 찼지만 자리 나면 옮겨가고 싶은 곳"(일시적
// 의도)이다. 그래서 빈자리가 없는 행(이름순 정렬에서 드러나는 빈 행)에서 건다.
//
// NOTE: 실제 푸시 발송(스크래퍼가 자리를 발견하면 알림)은 후속 작업이다. 여기서는
// "어디에 알림을 걸지"라는 구독 의도만 기기에 영구 저장한다 — 합주실 검색의 핵심
// 난제였던 "결과가 없을 때 알림을 걸 자리가 없다"를 빈 행으로 풀어낸 것이다.
const KEY = 'hapjusil:alarms:v1';

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
    // 저장 실패는 조용히 무시한다. 메모리 상태는 유지된다.
  }
}

/** 앱 시작 시 1회. 저장된 알림 구독을 메모리로 끌어온다. */
export async function initAlarms(): Promise<void> {
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

export function isAlarmsLoaded(): boolean {
  return loaded;
}

/** 알림 토글. 햅틱으로 네이티브 촉감 피드백을 준다. */
export async function toggleAlarm(id: number): Promise<void> {
  const next = new Set(ids);
  const willAdd = !next.has(id);
  if (willAdd) next.add(id);
  else next.delete(id);
  ids = next;
  emit();

  try {
    await Haptics.impact({ style: willAdd ? ImpactStyle.Medium : ImpactStyle.Light });
  } catch {
    /* 햅틱 미지원 환경 무시 */
  }

  await persist();
}

// --- React 바인딩 (useSyncExternalStore) ---

export function subscribeAlarms(fn: () => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function getAlarmsSnapshot(): ReadonlySet<number> {
  return ids;
}
