import type { Slot, Studio } from '../api/types';

/**
 * 합주실(지점) 단위 가용 시간 집계.
 *
 * 슬롯(방×시간)을 날짜 → 합주실로 묶고, 방별 연속 가용 구간에서
 * 선택한 연속 시간이 들어가는 "시작 시각"을 계산해 칩으로 변환한다.
 * 한 묶음의 시작점이 3개 이하면 단독칩, 4개 이상이면 범위칩으로 접는다.
 */

export type AvailabilityChip =
  | { kind: 'single'; start: string }
  | { kind: 'range'; start: string; end: string };

export interface StudioAvailability {
  studio: Studio;
  areaName: string;
  priceLabel: string;
  bookingUrl: string | null;
  chips: AvailabilityChip[];
}

export interface DateAvailability {
  date: string;
  studios: StudioAvailability[];
}

const COLLAPSE_THRESHOLD = 3; // 시작점이 이 개수를 넘으면 범위로 접는다

function toHour(time: string): number {
  return Number(time.slice(0, 2));
}

function hourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

/** 같은 방의 연속(직전 종료 == 다음 시작) 가용 구간을 묶는다. */
function contiguousRuns(slots: Slot[]): Slot[][] {
  const sorted = [...slots].sort((a, b) => a.startTime.localeCompare(b.startTime));
  const runs: Slot[][] = [];
  let current: Slot[] = [];
  for (const slot of sorted) {
    const prev = current[current.length - 1];
    if (prev && prev.endTime === slot.startTime) {
      current.push(slot);
    } else {
      if (current.length) runs.push(current);
      current = [slot];
    }
  }
  if (current.length) runs.push(current);
  return runs;
}

/** 연속 구간에서 minDuration이 들어가는 시작 시각(시 단위) 목록. */
function validStartHours(run: Slot[], minDuration: number): number[] {
  const startHour = toHour(run[0].startTime);
  const endHour = toHour(run[run.length - 1].endTime); // 마지막 슬롯 종료
  const lastStart = endHour - minDuration;
  const starts: number[] = [];
  for (let h = startHour; h <= lastStart; h += 1) starts.push(h);
  return starts;
}

/** 연속한 시작 시각 묶음을 칩으로 변환 (3개 이하 단독, 4개 이상 범위). */
function startsToChips(starts: number[], minDuration: number): AvailabilityChip[] {
  const sorted = [...new Set(starts)].sort((a, b) => a - b);
  const chips: AvailabilityChip[] = [];
  let group: number[] = [];

  const flush = () => {
    if (!group.length) return;
    if (group.length <= COLLAPSE_THRESHOLD) {
      for (const h of group) chips.push({ kind: 'single', start: hourLabel(h) });
    } else {
      const first = group[0];
      const last = group[group.length - 1];
      chips.push({ kind: 'range', start: hourLabel(first), end: hourLabel(last + minDuration) });
    }
    group = [];
  };

  for (const h of sorted) {
    const prev = group[group.length - 1];
    if (prev !== undefined && h !== prev + 1) flush();
    group.push(h);
  }
  flush();
  return chips;
}

// 시간당 합주실 요금의 현실적 범위. 이 범위를 벗어난 값은 손상된 데이터로 보고 제외한다.
const MIN_PRICE = 1000;
const MAX_PRICE = 200000;

function formatPricePerHour(prices: number[]): string {
  const valid = prices.filter((p) => p >= MIN_PRICE && p <= MAX_PRICE);
  if (valid.length === 0) return '가격 확인 불가';
  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const man = (won: number) => (won / 10000).toFixed(1);
  return min === max ? `${man(min)}만원/시간` : `${man(min)}–${man(max)}만원/시간`;
}

/**
 * 가용 슬롯을 날짜별·합주실별 집계로 변환한다.
 * @param dates 요청한 날짜 전체 (가용 슬롯이 없는 날도 "없음"으로 표시하기 위함)
 */
export function buildAvailability(
  slots: Slot[],
  dates: string[],
  minDuration: number,
): DateAvailability[] {
  const available = slots.filter((s) => s.status === 'AVAILABLE');
  const byDate = new Map<string, Slot[]>();
  for (const slot of available) {
    const list = byDate.get(slot.date) ?? [];
    list.push(slot);
    byDate.set(slot.date, list);
  }

  const orderedDates = [...new Set([...dates, ...byDate.keys()])].sort();

  return orderedDates.map((date) => ({
    date,
    studios: buildStudios(byDate.get(date) ?? [], minDuration),
  }));
}

function buildStudios(slots: Slot[], minDuration: number): StudioAvailability[] {
  const byStudio = new Map<number, Slot[]>();
  for (const slot of slots) {
    const list = byStudio.get(slot.studio.id) ?? [];
    list.push(slot);
    byStudio.set(slot.studio.id, list);
  }

  const studios: StudioAvailability[] = [];
  for (const studioSlots of byStudio.values()) {
    // 방별 연속 구간 → 유효 시작 시각을 합주실 단위로 합집합
    const byRoom = new Map<number, Slot[]>();
    for (const slot of studioSlots) {
      const list = byRoom.get(slot.room.id) ?? [];
      list.push(slot);
      byRoom.set(slot.room.id, list);
    }

    const starts = new Set<number>();
    for (const roomSlots of byRoom.values()) {
      for (const run of contiguousRuns(roomSlots)) {
        for (const h of validStartHours(run, minDuration)) starts.add(h);
      }
    }
    if (starts.size === 0) continue;

    const chips = startsToChips([...starts], minDuration);
    const studio = studioSlots[0].studio;
    const prices = studioSlots.map((s) => s.room.pricePerHour ?? s.price ?? 0);

    studios.push({
      studio,
      areaName: studio.primaryAreaName ?? '지역 미확인',
      priceLabel: formatPricePerHour(prices),
      bookingUrl: studioSlots.find((s) => s.bookingUrl)?.bookingUrl ?? null,
      chips,
    });
  }

  return studios.sort((a, b) => {
    const area = a.areaName.localeCompare(b.areaName, 'ko');
    return area !== 0 ? area : a.studio.name.localeCompare(b.studio.name, 'ko');
  });
}
