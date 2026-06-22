import { useEffect, useState } from 'react';
import type { AvailabilityChip, RoomAvailability, StudioAvailability } from '../lib/availability';
import { toReviewBadges } from '../lib/reviewKeywords';
import { thumbnailUrl } from '../lib/imageUrl';

interface StudioRowProps {
  studio: StudioAvailability;
}

function chipLabel(chip: AvailabilityChip): string {
  return chip.kind === 'single' ? chip.start : `${chip.start}~${chip.end}`;
}

function timesText(chips: AvailabilityChip[]): string {
  return chips.map(chipLabel).join(' · ');
}

function PersonIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7.5v5l3 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RoomRow({ room }: { room: RoomAvailability }) {
  return (
    <div className="room-row">
      <div className="room-info">
        <span className="room-name">{room.room.name}</span>
        {room.capacityLabel && (
          <span className="room-cap">
            <PersonIcon />
            {room.capacityLabel}
          </span>
        )}
        <span className="room-price">{room.priceLabel}</span>
      </div>
      <div className="room-times">{timesText(room.chips)}</div>
      <a className="book-room" href={room.bookingUrl ?? '#'} target="_blank" rel="noreferrer">
        이 방 예약 <span className="book-arrow" aria-hidden>↗</span>
      </a>
    </div>
  );
}

export function StudioRow({ studio }: StudioRowProps) {
  const { name, imageUrl, reviewCount, reviewKeywords } = studio.studio;
  const badges = toReviewBadges(reviewKeywords);
  const [expanded, setExpanded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  // 리사이즈 URL 부터 시도하고, 실패하면 원본 URL 로 한 번 더 시도(self-healing).
  // 리사이즈 타입이 호스트에서 안 먹혀도 이미지가 사라지지 않게 보장한다.
  const [useOriginal, setUseOriginal] = useState(false);
  const resized = thumbnailUrl(imageUrl);

  // studio(이미지)가 바뀌면 폴백 상태를 초기화한다(행 재사용 대비).
  useEffect(() => {
    setImgFailed(false);
    setUseOriginal(false);
  }, [imageUrl]);

  // 아바타는 항상 렌더한다. 이미지가 없거나(또는 로드 실패하면) 이니셜 폴백으로
  // 떨어져, 행마다 좌측 정렬이 흔들리지 않게 한다.
  const showImg = Boolean(imageUrl) && !imgFailed;
  const imgSrc = !useOriginal && resized ? resized : imageUrl!;
  const handleImgError = () => {
    // 1차(리사이즈) 실패 → 원본 재시도, 2차(원본) 실패 → 이니셜.
    if (!useOriginal && resized && resized !== imageUrl) setUseOriginal(true);
    else setImgFailed(true);
  };
  const initial = name.trim().charAt(0);

  return (
    <div className="studio-row">
      <div className="studio-head">
        <div className="studio-avatar" aria-hidden>
          {showImg ? (
            <img src={imgSrc} alt="" loading="lazy" onError={handleImgError} />
          ) : (
            initial
          )}
        </div>
        <div className="studio-name-area">
          <div className="studio-name">{name}</div>
          <div className="studio-meta">
            <span className="studio-area">{studio.areaName}</span>
            {reviewCount != null && reviewCount > 0 && (
              <span className="studio-reviews">리뷰 {reviewCount}</span>
            )}
          </div>
        </div>
        <div className="studio-price">{studio.priceLabel}</div>
      </div>

      {/* 리뷰 배지: 신원(아바타+이름) 헤더 밖, 예약 칩과 같은 게터 라인에 둔다 */}
      {badges.length > 0 && (
        <div className="review-badges">
          {badges.map((word) => (
            <span key={word} className="review-badge">
              {word}
            </span>
          ))}
        </div>
      )}

      {/* 비는 시간 = 정보(액션 아님) */}
      <div className="studio-times">
        <div className="times-label">
          <ClockIcon />
          비는 시간
        </div>
        <div className="times-text">{timesText(studio.chips)}</div>
      </div>

      {/* 카드당 단 하나의 주 액션: 합주실 예약 페이지로(거기서 방 선택) */}
      <a className="book-primary" href={studio.bookingUrl ?? '#'} target="_blank" rel="noreferrer">
        예약하기 <span className="book-arrow" aria-hidden>↗</span>
      </a>

      {/* 방별 보기(보조): 방 1개여도 방별 뎁스를 제공한다 */}
      <button
        type="button"
        className={`room-toggle${expanded ? ' open' : ''}`}
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
      >
        {expanded ? '방별 시간 접기' : `방 ${studio.rooms.length}개 · 방별로 보기`}
        <span className="room-toggle-arrow" aria-hidden>
          ▾
        </span>
      </button>

      {expanded && (
        <div className="room-list">
          {studio.rooms.map((room) => (
            <RoomRow key={room.room.id} room={room} />
          ))}
        </div>
      )}
    </div>
  );
}
