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
      <div className="studio-head">
        {imageUrl && (
          <div className="studio-avatar" aria-hidden>
            <img src={imageUrl} alt="" loading="lazy" />
          </div>
        )}
        <div className="studio-name-area">
          <div className="studio-name">{name}</div>
          <div className="studio-meta">
            <span className="studio-area">{studio.areaName}</span>
            {reviewCount != null && reviewCount > 0 && (
              <span className="studio-reviews">리뷰 {reviewCount}</span>
            )}
          </div>
          {badges.length > 0 && (
            <div className="review-badges">
              {badges.map((word) => (
                <span key={word} className="review-badge">
                  {word}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="studio-price">{studio.priceLabel}</div>
      </div>
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
