import type { Room, Slot, Studio } from '../api/types';

/**
 * 합주실(지점) 단위 가용 시간 집계.
 *
 * 슬롯(방×시간)을 날짜 → 합주실 → 방으로 묶고, 방별 연속 가용 구간에서
 * 선택한 연속 시간이 들어가는 "시작 시각"을 계산해 칩으로 변환한다.
 * 한 묶음의 시작점이 3개 이하면 단독칩, 4개 이상이면 범위칩으로 접는다.
 *
 * 지점 행은 접힌 상태에서도 시간 칩을 보여주되(방별 칩을 중복 제거해 합친 요약),
 * 펼치면 어느 방이 어떤 시간에 되는지 방별로 분리해 보여줄 수 있도록
 * `rooms`에 방별 가용 정보를 함께 담는다.
 */

export type AvailabilityChip =
  | { kind: 'single'; start: string }
  | { kind: 'range'; start: string; end: string };

export interface RoomAvailability {
  room: Room;
  chips: AvailabilityChip[];
  bookingUrl: string | null;
  priceLabel: string;
  capacityLabel: string | null;
}

export interface StudioAvailability {
  studio: Studio;
  areaName: string;
  priceLabel: string;
  pricePerHourMin: number | null;
  pricePerHourMax: number | null;
  bookingUrl: string | null;
  chips: AvailabilityChip[];
  rooms: RoomAvailability[];
}

export interface DateAvailability {
  date: string;
  studios: StudioAvailability[];
}

export type StudioSortOption = 'popular' | 'name_asc' | 'price_asc' | 'price_desc';

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

function sortChips(a: AvailabilityChip, b: AvailabilityChip): number {
  return a.start.localeCompare(b.start) || a.kind.localeCompare(b.kind);
}

/** 한 방의 연속 구간에서 minDuration이 들어가는 시작 시각(시 단위) 집합. */
function roomStartHours(roomSlots: Slot[], minDuration: number): Set<number> {
  const starts = new Set<number>();
  for (const run of contiguousRuns(roomSlots)) {
    for (const h of validStartHours(run, minDuration)) starts.add(h);
  }
  return starts;
}

/**
 * 방 단위 딥링크(.../bizes/{biz}/items/{bizItem}?startDate=...)에서 방 세그먼트를
 * 떼어 합주실(지점) 일반 예약 페이지 링크로 만든다. startDate 등 쿼리는 보존한다.
 * 합주실 행은 여러 방을 요약하므로 특정 방이 아니라 합주실 페이지로 연결해야 한다.
 */
function toStudioBookingUrl(url: string | null): string | null {
  return url ? url.replace(/\/items\/[^/?]+/, '') : null;
}

function capacityLabel(min: number | null | undefined, max: number | null | undefined): string | null {  if (min != null && max != null) return min === max ? `${min}인` : `${min}~${max}인`;
  const one = max ?? min;
  return one != null ? `${one}인` : null;
}

// 시간당 합주실 요금의 현실적 범위. 이 범위를 벗어난 값은 손상된 데이터로 보고 제외한다.
const MIN_PRICE = 1000;
const MAX_PRICE = 200000;

/**
 * 시간당 가격을 구한다.
 * 방의 pricePerHour가 있으면 그대로 쓰고, 없으면 슬롯 가격으로 보정한다.
 * 단, 슬롯 가격은 API에서 minDuration(연속 예약 시간)이 곱해진 "구간 총액"이므로
 * minDuration으로 나눠 시간당으로 환산해야 "/시간" 라벨이 부풀지 않는다.
 */
function perHourPrice(
  pricePerHour: number | null | undefined,
  slotPrice: number | null | undefined,
  minDuration: number,
): number {
  if (pricePerHour != null) return pricePerHour;
  if (slotPrice == null) return 0;
  return minDuration > 0 ? slotPrice / minDuration : slotPrice;
}

function priceRange(prices: number[]): { min: number; max: number } | null {
  const valid = prices.filter((p) => p >= MIN_PRICE && p <= MAX_PRICE);
  if (valid.length === 0) return null;
  return { min: Math.min(...valid), max: Math.max(...valid) };
}

function formatPricePerHour(range: { min: number; max: number } | null): string {
  if (!range) return '가격 확인 불가';
  const man = (won: number) => (won / 10000).toFixed(1);
  return range.min === range.max
    ? `${man(range.min)}만원/시간`
    : `${man(range.min)}–${man(range.max)}만원/시간`;
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

    // 방마다 독립적으로 칩을 만든다. 범위 칩은 한 방의 연속 구간 안에서만
    // 접혀야 하므로(서로 다른 방의 시작 시각을 합쳐 접으면 어떤 방도 제공하지
    // 않는 연속 구간이 만들어진다) 칩 변환은 방 단위로 한다.
    const rooms: RoomAvailability[] = [];
    const studioStartHours = new Set<number>();
    for (const roomSlots of byRoom.values()) {
      const startHours = roomStartHours(roomSlots, minDuration);
      const chips = startsToChips([...startHours], minDuration).sort(sortChips);
      if (chips.length === 0) continue;
      for (const h of startHours) studioStartHours.add(h);
      const room = roomSlots[0].room;
      const price = perHourPrice(room.pricePerHour, roomSlots[0].price, minDuration);
      const roomPriceRange = priceRange([price]);
      rooms.push({
        room,
        chips,
        bookingUrl: roomSlots.find((s) => s.bookingUrl)?.bookingUrl ?? null,
        priceLabel: formatPricePerHour(roomPriceRange),
        capacityLabel: capacityLabel(room.capacityMin, room.capacityMax),
      });
    }
    if (rooms.length === 0) continue;

    // 빠른 시작 → 방 이름 순으로 방을 정렬한다.
    rooms.sort(
      (a, b) =>
        (a.chips[0]?.start ?? '').localeCompare(b.chips[0]?.start ?? '') ||
        a.room.name.localeCompare(b.room.name, 'ko'),
    );

    // 접힌 지점 행용 요약 칩: 방별 칩을 그대로 합치면 서로 다른 방의 범위가
    // 부분적으로 겹쳐(예: 09:00~20:00 과 17:00~23:00) 겹친 채로 보인다.
    // 대신 모든 방의 "가능한 시작 시각"을 합집합한 뒤 다시 접어 겹침 없는
    // 칩으로 만든다. 각 시작 시각은 어떤 방이든 하나가 제공하므로
    // (startsToChips는 연속한 시각만 묶는다) 거짓 연속 구간은 생기지 않는다.
    const chips = startsToChips([...studioStartHours], minDuration).sort(sortChips);

    const studio = studioSlots[0].studio;
    const prices = studioSlots.map((s) => perHourPrice(s.room.pricePerHour, s.price, minDuration));
    const studioPriceRange = priceRange(prices);

    studios.push({
      studio,
      areaName: studio.primaryAreaName ?? '지역 미확인',
      priceLabel: formatPricePerHour(studioPriceRange),
      pricePerHourMin: studioPriceRange?.min ?? null,
      pricePerHourMax: studioPriceRange?.max ?? null,
      bookingUrl: toStudioBookingUrl(studioSlots.find((s) => s.bookingUrl)?.bookingUrl ?? null),
      chips,
      rooms,
    });
  }

  return sortStudios(studios, 'popular');
}

export function sortDateAvailabilityGroups(
  groups: DateAvailability[],
  sortOption: StudioSortOption,
): DateAvailability[] {
  return groups.map((group) => ({
    ...group,
    studios: sortStudios(group.studios, sortOption),
  }));
}

function sortStudios(studios: StudioAvailability[], sortOption: StudioSortOption): StudioAvailability[] {
  return [...studios].sort((a, b) => compareStudios(a, b, sortOption));
}

function compareStudios(a: StudioAvailability, b: StudioAvailability, sortOption: StudioSortOption): number {
  if (sortOption === 'name_asc') return compareByName(a, b);
  if (sortOption === 'price_asc') return compareByPrice(a, b, 'asc');
  if (sortOption === 'price_desc') return compareByPrice(a, b, 'desc');

  // 인기순은 리뷰 많은 순이다(평점은 대표성이 약해 쓰지 않는다).
  // 리뷰 수가 같거나 없으면 이름 가나다순으로 안정 정렬한다.
  return compareByPopularity(a, b);
}

function compareByPopularity(a: StudioAvailability, b: StudioAvailability): number {
  const reviewA = a.studio.reviewCount ?? 0;
  const reviewB = b.studio.reviewCount ?? 0;
  return reviewB - reviewA || compareByName(a, b);
}

function compareByName(a: StudioAvailability, b: StudioAvailability): number {
  return a.studio.name.localeCompare(b.studio.name, 'ko');
}

function compareByPrice(a: StudioAvailability, b: StudioAvailability, direction: 'asc' | 'desc'): number {
  const priceA = a.pricePerHourMin;
  const priceB = b.pricePerHourMin;
  if (priceA == null && priceB == null) return compareByName(a, b);
  if (priceA == null) return 1;
  if (priceB == null) return -1;

  const priceDiff = direction === 'asc' ? priceA - priceB : priceB - priceA;
  return priceDiff || compareByName(a, b);
}
