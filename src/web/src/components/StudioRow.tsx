import { useEffect, useState } from 'react';
import type { AvailabilityChip, RoomAvailability, StudioAvailability } from '../lib/availability';
import { toReviewBadges } from '../lib/reviewKeywords';
import { thumbnailUrl } from '../lib/imageUrl';
import { useFavorites } from '../lib/useFavorites';
import { toggleFavorite } from '../lib/favorites';
import { shareStudio } from '../lib/share';

interface StudioRowProps {
  studio: StudioAvailability;
}

function chipLabel(chip: AvailabilityChip): string {
  return chip.kind === 'single' ? chip.start : `${chip.start}~${chip.end}`;
}

// 비는 시간 = 정보(액션 아님). 중립 회색 칩으로 "슬롯" 단위를 또렷하게 하되,
// 틸(액션) 색은 쓰지 않아 예약 버튼과 확실히 구분한다.
function TimeSlots({ chips }: { chips: AvailabilityChip[] }) {
  return (
    <div className="time-slots">
      {chips.map((chip, i) => (
        <span key={i} className="time-slot">
          {chipLabel(chip)}
        </span>
      ))}
    </div>
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

function ClockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <path d="M12 7.5v5l3 1.8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 카드/방행 전체가 예약 링크라는 어포던스. 큰 솔리드 버튼 대신 우측 셰브론 하나로
// "탭하면 예약 페이지로 넘어간다"를 알린다.
function BookChevron() {
  return (
    <svg className="book-chevron" width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} aria-hidden>
      <path
        d="M12 20.5l-1.45-1.32C5.4 14.5 2 11.42 2 7.65 2 4.6 4.42 2.2 7.5 2.2c1.74 0 3.41.81 4.5 2.1 1.09-1.29 2.76-2.1 4.5-2.1 3.08 0 5.5 2.4 5.5 5.45 0 3.77-3.4 6.85-8.55 11.53L12 20.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M8 7l4-4 4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5 12v6a2 2 0 002 2h10a2 2 0 002-2v-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// 방행 전체가 예약 링크. 우측 셰브론으로 행이 통째로 탭 대상임을 알린다.
function RoomRow({ room }: { room: RoomAvailability }) {
  return (
    <a
      className="room-row"
      href={room.bookingUrl ?? '#'}
      target="_blank"
      rel="noreferrer"
      aria-label={`${room.room.name} 예약`}
    >
      <div className="room-info">
        <span className="room-name">{room.room.name}</span>
        {room.capacityLabel && (
          <span className="room-cap">
            <PersonIcon />
            {room.capacityLabel}
          </span>
        )}
        <span className="room-price">{room.priceLabel}</span>
        <BookChevron />
      </div>
      <TimeSlots chips={room.chips} />
    </a>
  );
}

export function StudioRow({ studio }: StudioRowProps) {
  const { id, name, imageUrl, reviewCount, reviewKeywords } = studio.studio;
  const badges = toReviewBadges(reviewKeywords, reviewCount);
  const favorites = useFavorites();
  const isFav = favorites.has(id);
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
      {/* 카드 본문(헤더+비는시간) 전체가 단 하나의 주 액션 = 예약 링크.
          우측 셰브론이 어포던스. 방별 토글·방별 링크는 중첩될 수 없으므로 형제로 분리한다. */}
      <a
        className="studio-main"
        href={studio.bookingUrl ?? '#'}
        target="_blank"
        rel="noreferrer"
        aria-label={`${name} 예약`}
      >
        <div className="studio-head">
          <div className="studio-avatar" aria-hidden>
            {showImg ? (
              // 합주실 썸네일은 네이버 phinf·스페이스클라우드 등 외부 CDN 원본이다.
              // 홈화면 PWA(standalone) WebKit 은 모바일 웹과 다른 Referer 를 실어
              // 보내 CDN 핫링크 보호에 막히곤 한다("이미지 다 깨짐"). Referer 를 아예
              // 빼서 두 환경의 요청을 통일하고, 깨짐을 막는다(phinf 는 no-referer 로 받힘).
              <img
                src={imgSrc}
                alt=""
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={handleImgError}
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
          <BookChevron />
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
          <TimeSlots chips={studio.chips} />
        </div>
      </a>

      {/* 하단 보조 액션: 방별 보기(좌) + 즐겨찾기·공유 아이콘(우 그룹).
          주 액션(예약)은 카드 본문 링크라, 여기는 전부 가벼운 보조 액션이다. */}
      <div className="studio-actions">
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
        <button
          type="button"
          className={`fav-button${isFav ? ' on' : ''}`}
          aria-pressed={isFav}
          aria-label={isFav ? `${name} 즐겨찾기 해제` : `${name} 즐겨찾기`}
          onClick={() => toggleFavorite(id)}
        >
          <HeartIcon filled={isFav} />
        </button>
        <button
          type="button"
          className="share-button"
          aria-label={`${name} 공유`}
          onClick={() => shareStudio(name, studio.bookingUrl)}
        >
          <ShareIcon />
        </button>
      </div>

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
