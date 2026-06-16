import type { AvailabilityChip, StudioAvailability } from '../lib/availability';
import { toReviewBadges } from '../lib/reviewKeywords';

interface StudioRowProps {
  studio: StudioAvailability;
}

function chipLabel(chip: AvailabilityChip): string {
  return chip.kind === 'single' ? chip.start : `${chip.start}~${chip.end}`;
}

export function StudioRow({ studio }: StudioRowProps) {
  const { name, imageUrl, reviewCount, reviewKeywords } = studio.studio;
  const badges = toReviewBadges(reviewKeywords);

  return (
    <div className="studio-row">
      {/* 헤더: 썸네일 높이가 이름·지역 영역과 맞도록 한 줄로 묶는다 */}
      <div className="studio-head">
        <div className="studio-avatar" aria-hidden>
          {imageUrl ? <img src={imageUrl} alt="" loading="lazy" /> : name.slice(0, 1)}
        </div>
        <div className="studio-name-area">
          <div className="studio-name">{name}</div>
          <div className="studio-meta">
            <span className="studio-area">{studio.areaName}</span>
            {reviewCount != null && reviewCount > 0 && (
              <>
                <span className="meta-dot" aria-hidden>
                  ·
                </span>
                <span className="studio-reviews">리뷰 {reviewCount}</span>
              </>
            )}
          </div>
        </div>
        <div className="studio-price">{studio.priceLabel}</div>
      </div>

      {/* 본문: 뱃지·시간칩은 전체 너비로 같은 좌측선에 정렬 */}
      {badges.length > 0 && (
        <div className="review-badges">
          {badges.map((word) => (
            <span key={word} className="review-badge">
              {word}
            </span>
          ))}
        </div>
      )}

      <div className="studio-chips">
        {studio.chips.map((chip, i) => (
          <a
            key={i}
            className="time-chip"
            href={studio.bookingUrl ?? '#'}
            target="_blank"
            rel="noreferrer"
          >
            {chipLabel(chip)} <span className="chip-arrow">↗</span>
          </a>
        ))}
      </div>
    </div>
  );
}
