import type { Slot } from '../api/types';
import { durationText, formatWon, relativeCheckedText } from '../lib/date';

interface SlotRowProps {
  slot: Slot;
}

export function SlotRow({ slot }: SlotRowProps) {
  const isUnavailable = slot.status !== 'AVAILABLE';
  const freshnessClass = slot.freshness ?? 'unknown';

  return (
    <div className={`slot-row ${isUnavailable ? 'is-unavailable' : ''}`}>
      <div className="slot-time">
        <div>{slot.startTime}</div>
        <span>{durationText(slot.startTime, slot.endTime)}</span>
      </div>
      <div className="slot-main">
        <div className="slot-studio">{slot.studio.name}</div>
        <div className="slot-meta">
          <span>{slot.room.name} · {slot.area?.name ?? slot.studio.primaryAreaName ?? '지역 미확인'}</span>
          <span className={`fresh-dot ${freshnessClass}`} />
          <span className={`fresh-text ${freshnessClass}`}>{relativeCheckedText(slot.scrapedAt, slot.freshness)}</span>
        </div>
      </div>
      <div className="slot-action">
        <div className="slot-price">{formatWon(slot.price)}</div>
        {isUnavailable ? (
          <span className="closed-pill">마감</span>
        ) : (
          <a className="book-link" href={slot.bookingUrl} target="_blank" rel="noreferrer">예약</a>
        )}
      </div>
    </div>
  );
}
