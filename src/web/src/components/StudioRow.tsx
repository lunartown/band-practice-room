import type { AvailabilityChip, StudioAvailability } from '../lib/availability';

interface StudioRowProps {
  studio: StudioAvailability;
}

function chipLabel(chip: AvailabilityChip): string {
  return chip.kind === 'single' ? chip.start : `${chip.start}~${chip.end}`;
}

export function StudioRow({ studio }: StudioRowProps) {
  return (
    <div className="studio-row">
      <div className="studio-head">
        <div className="studio-name-area">
          <div className="studio-name">{studio.studio.name}</div>
          <div className="studio-area">{studio.areaName}</div>
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
