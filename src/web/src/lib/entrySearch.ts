import { defaultFilters, PRICE_FILTER_MAX, PRICE_FILTER_MIN } from '../components/FilterSheet.js';
import type { FilterState } from '../components/FilterSheet.js';
import { addDays, todayKst } from './date.js';

function integer(value: string | null, min: number, max: number): number | null {
  if (value == null || !/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= min && number <= max ? number : null;
}

function ids(params: URLSearchParams, key: string): number[] {
  return [...new Set(params.getAll(key).flatMap((value) => value.split(','))
    .map((value) => integer(value, 1, 2147483647))
    .filter((value): value is number => value != null))];
}

function hour(value: string | null, min: number, max: number): string | null {
  const number = integer(value?.replace(/:00$/, '') ?? null, min, max);
  return number == null ? null : `${String(number).padStart(2, '0')}:00`;
}

// 진입 시에만 읽는다. 유효한 링크는 저장 조건을 섞지 않아 수신자마다 같은 검색을 시작한다.
// 검색 조건이 없거나 전부 잘못된 링크면 기존 저장 조건 복원 흐름을 유지한다.
export function readEntrySearch(search: string, today = todayKst()): FilterState | null {
  const params = new URLSearchParams(search);
  const patch: Partial<FilterState> = {};
  const date = params.get('date');
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)
    && date >= today && date <= addDays(today, 29)) {
    const timestamp = Date.parse(`${date}T00:00:00.000Z`);
    if (Number.isFinite(timestamp) && new Date(timestamp).toISOString().slice(0, 10) === date) {
      patch.dates = [date];
    }
  }

  const from = hour(params.get('from'), 0, 23);
  const to = hour(params.get('to'), 1, 24);
  if (from && to && from < to) patch.timeWindows = [{ from, to }];

  const people = integer(params.get('people'), 1, 10);
  if (people != null) patch.people = people;
  const duration = integer(params.get('duration'), 1, 4);
  if (duration != null) patch.minDuration = duration as FilterState['minDuration'];

  const areaIds = ids(params, 'areaIds');
  if (areaIds.length > 0) patch.areaIds = areaIds;
  const studioIds = ids(params, 'studioIds');
  if (studioIds.length > 0) patch.studioIds = studioIds;

  const minPrice = integer(params.get('minPrice'), PRICE_FILTER_MIN, PRICE_FILTER_MAX);
  const maxPrice = integer(params.get('maxPrice'), PRICE_FILTER_MIN, PRICE_FILTER_MAX);
  // 역전된 가격 범위는 양쪽 모두 무시한다.
  if (minPrice == null || maxPrice == null || minPrice <= maxPrice) {
    if (minPrice != null) patch.minHourlyPrice = minPrice === PRICE_FILTER_MIN ? null : minPrice;
    if (maxPrice != null) patch.maxHourlyPrice = maxPrice === PRICE_FILTER_MAX ? null : maxPrice;
  }

  return Object.keys(patch).length > 0
    ? { ...defaultFilters, dates: [today], ...patch }
    : null;
}
