import { useState } from 'react';
import type { AvailabilityChip, RoomAvailability, StudioAvailability } from '../lib/availability';
import { toReviewBadges } from '../lib/reviewKeywords';
import { thumbnailUrl } from '../lib/imageUrl';

interface StudioRowProps {
  studio: StudioAvailability;
}

function chipLabel(chip: AvailabilityChip): string {
  return chip.kind === 'single' ? chip.start : `${chip.start}~${chip.end}`;
}

function TimeChip({ chip, href }: { chip: AvailabilityChip; href: string | null }) {
  return (
    <a className="time-chip" href={href ?? '#'} target="_blank" rel="noreferrer">
      {chipLabel(chip)}
    </a>
  );
}

function PersonIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="12" cy="7" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
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
      <div className="room-chips">
        {room.chips.map((chip, i) => (
          <TimeChip key={i} chip={chip} href={room.bookingUrl} />
        ))}
      </div>
    </div>
  );
}

export function StudioRow({ studio }: StudioRowProps) {
  const { name, imageUrl, reviewCount, reviewKeywords } = studio.studio;
  const badges = toReviewBadges(reviewKeywords);
  const [expanded, setExpanded] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  // 아바타는 항상 렌더한다. 이미지가 없거나(또는 로드 실패하면) 이니셜 폴백으로
  // 떨어져, 행마다 좌측 정렬이 흔들리지 않게 한다.
  const showImg = Boolean(imageUrl) && !imgFailed;
  const initial = name.trim().charAt(0);

  return (
    <div className="studio-row">
      <div className="studio-head">
        <div className="studio-avatar" aria-hidden>
          {showImg ? (
            <img
              src={thumbnailUrl(imageUrl) ?? imageUrl!}
              alt=""
              loading="lazy"
              onError={() => setImgFailed(true)}
            />
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

      {/* 접힌 상태: 지금처럼 지점 요약 시간 칩을 그대로 노출 */}
      <div className="studio-chips">
        {studio.chips.map((chip, i) => (
          <TimeChip key={i} chip={chip} href={studio.bookingUrl} />
        ))}
      </div>

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
