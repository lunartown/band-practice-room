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
      <div className="studio-avatar" aria-hidden>
        {imageUrl ? <img src={imageUrl} alt="" loading="lazy" /> : name.slice(0, 1)}
      </div>

      <div className="studio-body">
        <div className="studio-title">
          <span className="studio-name">{name}</span>
          <span className="studio-price">{studio.priceLabel}</span>
        </div>

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
    </div>
  );
}
