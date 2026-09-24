import { useEffect, useRef } from 'react';
import { track } from '../lib/analytics';
import type { PendingBookingSurvey } from '../lib/bookingSurvey';
import { BottomSheet } from './BottomSheet';

interface BookingSurveySheetProps {
  survey: PendingBookingSurvey;
  onClose: () => void;
}

// 예약 페이지에 다녀온 사용자에게 실제로 예약했는지 묻는다. 배경은 lib/bookingSurvey.ts 참고.
// 이벤트는 shown → answer(booked | not_booked) 또는 dismiss 로 끝난다.
export function BookingSurveySheet({ survey, onClose }: BookingSurveySheetProps) {
  const answered = useRef(false);
  const shownSent = useRef(false);
  const props = {
    source: survey.source,
    studio_id: survey.studio_id,
    studio_name: survey.studio_name,
    ...(survey.room_id != null ? { room_id: survey.room_id } : {}),
    away_sec: survey.away_sec,
  };

  // 한 번 뜬 설문에 대해 한 번만 보낸다(StrictMode 의 이중 실행 포함).
  useEffect(() => {
    if (shownSent.current) return;
    shownSent.current = true;
    track('booking_survey_shown', props);
  }, []);

  function answer(value: 'booked' | 'not_booked', requestClose: () => void) {
    if (answered.current) return;
    answered.current = true;
    track('booking_survey_answer', { ...props, answer: value });
    requestClose();
  }

  function handleClose() {
    if (!answered.current) track('booking_survey_dismiss', props);
    onClose();
  }

  return (
    <BottomSheet
      ariaLabel="예약 완료 여부"
      sheetClassName="alert-sheet booking-survey-sheet"
      onClose={handleClose}
      header={({ requestClose }) => (
        <header>
          <h2>예약하셨나요?</h2>
          <button type="button" onClick={requestClose}>닫기</button>
        </header>
      )}
      footer={({ requestClose }) => (
        <footer>
          <button type="button" className="secondary" onClick={() => answer('not_booked', requestClose)}>
            안 했어요
          </button>
          <button type="button" className="primary" onClick={() => answer('booked', requestClose)}>
            예약했어요
          </button>
        </footer>
      )}
    >
      <div className="alert-summary">
        <CalendarCheckIcon />
        <div>
          <strong>{survey.studio_name}</strong>
          <span>예약 페이지에서 예약을 마치셨는지 알려주시면 서비스 개선에 쓸게요</span>
        </div>
      </div>
    </BottomSheet>
  );
}

function CalendarCheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4" y="5" width="16" height="15" rx="2.5" stroke="currentColor" strokeWidth="1.9" />
      <path d="M8 3v4M16 3v4M4 10h16" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
      <path d="m9 15 2 2 4-4" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
