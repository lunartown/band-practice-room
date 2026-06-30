import type { AvailabilitySlot } from '../types.js';
import type { SpaceCloudDay } from './types.js';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// SpaceCloud day(year/month/day, 0-패딩 불규칙)를 'YYYY-MM-DD' 로 정규화.
function dayDate(day: SpaceCloudDay): string {
  return `${day.year}-${pad(Number(day.month))}-${pad(Number(day.day))}`;
}

/**
 * 스페이스클라우드 days[] 를 우리 슬롯 모델로 변환한다(순수함수).
 * - times 가 없는 날(예약 불가일)은 슬롯을 만들지 않는다.
 * - 시간제(1시간 단위): hour H → [HH:00, (H+1):00). 23시는 24:00 으로 끝난다.
 * - [dateFrom, dateTo] 범위 밖의 날은 버린다(월 응답이 앞뒤 며칠을 더 주기 때문).
 */
export function toAvailabilitySlots(
  days: SpaceCloudDay[],
  roomName: string,
  dateFrom: string,
  dateTo: string,
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];

  for (const day of days) {
    if (!day.times || day.times.length === 0) continue;
    const date = dayDate(day);
    if (date < dateFrom || date > dateTo) continue;

    for (const t of day.times) {
      slots.push({
        roomName,
        date,
        startTime: `${pad(t.hour)}:00`,
        endTime: `${pad(t.hour + 1)}:00`, // 23 → "24:00" (Postgres TIME 허용, end > start)
        status: t.available ? 'available' : 'unavailable',
        price: typeof t.price === 'number' ? t.price : null,
      });
    }
  }

  return slots;
}
