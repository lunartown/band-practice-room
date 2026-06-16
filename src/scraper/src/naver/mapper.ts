import type { AvailabilitySlot, NaverHourlyUnit } from './types.js';

const KST_PARTS = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

// unitStartDateTime(UTC Z 또는 +09:00)을 KST 날짜/분으로 환산.
function toKst(iso: string): { date: string; minutes: number } {
  const parts = KST_PARTS.formatToParts(new Date(iso));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '00';
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

function formatMinutes(total: number): string {
  const m = ((total % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function pickPrice(prices: NaverHourlyUnit['prices']): number | null {
  // 영업 시간대는 0이 아닌 실제 가격을 가진다(0/isDefault 는 영업외 placeholder).
  const real = prices?.find((p) => p.price > 0);
  return real ? real.price : null;
}

/**
 * 네이버 hourly 단위 배열을 우리 슬롯 모델로 변환한다(순수함수).
 * - isUnitBusinessDay=false 인 영업외 시간은 슬롯으로 만들지 않는다.
 * - 가용성: 판매일이고 (unitStock - unitBookingCount) > 0 이면 available.
 */
export function toAvailabilitySlots(
  hourly: NaverHourlyUnit[],
  roomName: string,
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];

  for (const unit of hourly) {
    if (!unit.isUnitBusinessDay) continue;

    const { date, minutes } = toKst(unit.unitStartDateTime);
    const remaining = (unit.unitStock ?? 1) - (unit.unitBookingCount ?? 0);
    const status = unit.isUnitSaleDay && remaining > 0 ? 'available' : 'unavailable';

    slots.push({
      roomName,
      date,
      startTime: formatMinutes(minutes),
      endTime: formatMinutes(minutes + (unit.duration ?? 60)),
      status,
      price: pickPrice(unit.prices),
    });
  }

  return slots;
}
