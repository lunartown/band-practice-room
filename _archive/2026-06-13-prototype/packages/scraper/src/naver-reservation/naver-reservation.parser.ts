import type { AvailabilitySlot, PageSnapshot } from './types.js';

function toClockTime(hour: number) {
  return `${hour.toString().padStart(2, '0')}:00`;
}

function parseHourLabel(parentText: string, previousHour: number | null): number | null {
  const match = parentText.match(/(?:(오전|오후)\s*)?(\d{1,2})시/);
  if (!match) {
    return null;
  }

  const meridiem = match[1];
  const rawHour = Number(match[2]);

  if (meridiem === '오전') {
    return rawHour === 12 ? 0 : rawHour;
  }

  if (meridiem === '오후') {
    return rawHour === 12 ? 12 : rawHour + 12;
  }

  if (previousHour !== null && previousHour >= 12 && rawHour < 12) {
    return rawHour + 12;
  }

  return rawHour;
}

export function parseAvailabilitySlots(snapshot: PageSnapshot): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  let previousHour: number | null = null;

  for (const control of snapshot.timeControls) {
    if (!control.className.includes('btn_time')) {
      continue;
    }

    const hour = parseHourLabel(control.parentText, previousHour);
    if (hour === null) {
      continue;
    }

    previousHour = hour;
    const unavailableByClass = /disabled|disable|soldout|close|unavailable|end/i.test(
      control.className,
    );
    const hasAvailabilityColor = /\bcolor\d+\b/.test(control.className);
    const status =
      control.disabled || unavailableByClass || !hasAvailabilityColor ? 'unavailable' : 'available';

    slots.push({
      roomName: snapshot.roomName,
      date: snapshot.targetDate,
      startTime: toClockTime(hour),
      endTime: toClockTime((hour + 1) % 24),
      status,
    });
  }

  return slots;
}

