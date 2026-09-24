// 예약 완료 여부 설문. booking_click 뒤의 실제 예약은 외부 사이트(네이버·스페이스클라우드)에서
// 일어나 관측할 수 없다(analytics.ts 의 META_STANDARD_EVENTS 주석 참고). 그래서 예약 페이지로
// 넘어갔다가 일정 시간 뒤 돌아온 사용자에게 직접 물어 실제 예약 완료 수를 집계한다.
//
// 웹 전용이다. 클릭 기록은 이 탭의 메모리에 두고, 모바일 브라우저가 다녀오는 사이 탭을 버렸다가
// 새로 불러오는 경우를 위해 sessionStorage 에도 둔다. localStorage 는 쓰지 않는다 — 같은 사이트의
// 다른 탭과 공유되어, 복귀 순간 다른 탭이 기록을 먼저 꺼내 가는 것을 iOS Safari 에서 확인했다.
// 복귀는 첫 로드와 아래 useBookingSurvey 의 이벤트들에서 본다.
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// 이보다 빨리 돌아오면 예약 페이지를 훑어보기만 한 것으로 보고 묻지 않는다.
// 판단 근거가 데이터는 아니라, 실제 분포는 booking_survey_shown 의 away_sec 로 보고 조정한다.
export const MIN_AWAY_MS = 60 * 1000;
// 너무 늦게 돌아온 방문은 그 예약 클릭과의 연결이 약하다고 보고 묻지 않는다.
export const MAX_AWAY_MS = 3 * 60 * 60 * 1000;

const STORAGE_KEY = 'hapjusil.booking-survey.v1';

export interface BookingSurveyTarget {
  source: 'studio' | 'room';
  studio_id: number;
  studio_name: string;
  room_id?: number;
}

export interface PendingBookingSurvey extends BookingSurveyTarget {
  clicked_at: number;
  away_sec: number;
}

interface StoredClick extends BookingSurveyTarget {
  clicked_at: number;
}

const enabled = !Capacitor.isNativePlatform();

// 이 탭에서 누른 클릭. 탭이 살아 있는 동안은 이 값을, 새로 로드된 뒤에는 sessionStorage 를 본다.
let lastClick: StoredClick | null = null;

// 예약 링크를 누른 순간 기록한다. 여러 곳을 연달아 눌렀으면 마지막 것만 묻는다.
export function rememberBookingClick(target: BookingSurveyTarget): void {
  if (!enabled) return;
  const stored: StoredClick = { ...target, clicked_at: Date.now() };
  lastClick = stored;
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // 저장소를 못 쓰면 묻지 않을 뿐이다.
  }
}

// 물어볼 대상이 있으면 꺼내면서 기록을 지운다. 한 클릭에 한 번만 묻는다.
function takeDueSurvey(): PendingBookingSurvey | null {
  let stored: StoredClick | null = lastClick;
  if (!stored) {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      stored = raw ? (JSON.parse(raw) as StoredClick) : null;
    } catch {
      return null;
    }
  }
  if (!stored || typeof stored.clicked_at !== 'number') return null;

  const away = Date.now() - stored.clicked_at;
  // 아직 1분이 안 됐으면 기록을 남겨 다음 복귀 때 다시 본다.
  if (away < MIN_AWAY_MS) return null;

  lastClick = null;
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // 지우지 못하면 다음 복귀 때 한 번 더 물을 수 있다.
  }
  if (away > MAX_AWAY_MS) return null;

  return { ...stored, away_sec: Math.round(away / 1000) };
}

export function useBookingSurvey(): [PendingBookingSurvey | null, () => void] {
  const [survey, setSurvey] = useState<PendingBookingSurvey | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const check = () => {
      if (document.visibilityState !== 'visible') return;
      const due = takeDueSurvey();
      if (due) setSurvey((current) => current ?? due);
    };

    // 새 탭에서 돌아오면 visibilitychange 가, 같은 탭에서 뒤로가기로 돌아오면(인앱 브라우저 등)
    // bfcache 복원이라 visibilitychange 없이 pageshow 만 오는 브라우저가 있다(iOS Safari).
    // 셋 다 걸어두고, 한 번 꺼낸 기록은 지워지므로 여러 번 불려도 한 번만 뜬다.
    check();
    document.addEventListener('visibilitychange', check);
    window.addEventListener('pageshow', check);
    window.addEventListener('focus', check);
    return () => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('pageshow', check);
      window.removeEventListener('focus', check);
    };
  }, []);

  return [survey, () => setSurvey(null)];
}
