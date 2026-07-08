import { Capacitor } from '@capacitor/core';
import { track } from '@vercel/analytics';
import type { TimeWindow } from '../api/types';
import { todayKst } from './date';

type AnalyticsValue = string | number | boolean;
type AnalyticsProperties = Record<string, AnalyticsValue | null | undefined>;

export interface SearchAnalyticsContext {
  areaIds: number[];
  studioIds: number[];
  dates: string[];
  timeWindows: TimeWindow[];
  minDuration: number;
  people: number;
}

export function trackEvent(name: string, properties: AnalyticsProperties = {}): void {
  try {
    track(name, sanitizeProperties({ ...platformProperties(), ...properties }));
  } catch {
    // Analytics must never block the booking flow.
  }
}

export function trackOpenAreaPicked(areaIds: number[]): void {
  trackEvent('Open Area Picked', {
    area_count: areaIds.length,
    all_areas: areaIds.length === 0,
  });
}

export function trackFilterChanged(
  previous: SearchAnalyticsContext,
  next: SearchAnalyticsContext,
): void {
  const changed = changedFilterKeys(previous, next);
  if (changed.length === 0) return;

  trackEvent('Search Filter Changed', {
    changed_keys: changed.join(','),
    ...searchProperties(next),
  });
}

export function trackSearchResultsViewed({
  filters,
  dateGroupCount,
  resultStudioCount,
  rawSlotCount,
  responseDateCount,
  favOnly,
  sortOption,
}: {
  filters: SearchAnalyticsContext;
  dateGroupCount: number;
  resultStudioCount: number;
  rawSlotCount: number;
  responseDateCount: number;
  favOnly: boolean;
  sortOption: string;
}): void {
  trackEvent(resultStudioCount > 0 ? 'Search Results Viewed' : 'Search Empty Viewed', {
    ...searchProperties(filters),
    date_group_count: dateGroupCount,
    result_studio_count: resultStudioCount,
    raw_slot_count: rawSlotCount,
    response_date_count: responseDateCount,
    favorite_filter: favOnly,
    sort_option: sortOption,
  });
}

export function searchResultViewKey({
  filters,
  dateGroupCount,
  resultStudioCount,
  rawSlotCount,
  responseDateCount,
  favOnly,
  sortOption,
}: {
  filters: SearchAnalyticsContext;
  dateGroupCount: number;
  resultStudioCount: number;
  rawSlotCount: number;
  responseDateCount: number;
  favOnly: boolean;
  sortOption: string;
}): string {
  return JSON.stringify({
    filters: searchKey(filters),
    dateGroupCount,
    resultStudioCount,
    rawSlotCount,
    responseDateCount,
    favOnly,
    sortOption,
  });
}

export function trackBookingClicked({
  source,
  studioId,
  roomId,
  date,
  roomCount,
}: {
  source: 'studio_row' | 'room_row';
  studioId: number;
  roomId?: number;
  date?: string;
  roomCount?: number;
}): void {
  trackEvent('Booking Clicked', {
    source,
    studio_id: studioId,
    room_id: roomId,
    date_offset_bucket: date ? dateOffsetBucket(date) : undefined,
    room_count: roomCount,
  });
}

export function trackStudioSelectionChanged({
  action,
  source,
  studioId,
  selectedStudioCount,
}: {
  action: 'add' | 'remove' | 'clear';
  source: 'search' | 'chip' | 'empty_row' | 'show_all';
  studioId?: number;
  selectedStudioCount: number;
}): void {
  trackEvent('Studio Selection Changed', {
    action,
    source,
    studio_id: studioId,
    selected_studio_count: selectedStudioCount,
  });
}

export function trackAlertCtaClicked({
  source,
  scope,
  studioCount,
  dateCount,
}: {
  source: 'selected_empty_row' | 'empty_day';
  scope: 'studios' | 'search';
  studioCount: number;
  dateCount: number;
}): void {
  trackEvent('Alert CTA Clicked', {
    source,
    scope,
    studio_count: studioCount,
    date_count: dateCount,
  });
}

export function trackAlertRegistration(
  status: 'attempted' | 'completed' | 'blocked' | 'duplicate' | 'failed',
  properties: AnalyticsProperties,
): void {
  trackEvent('Alert Registration', {
    status,
    ...properties,
  });
}

export function alertAnalyticsProperties({
  scope,
  studioCount,
  areaCount,
  dateCount,
  timeWindowCount,
  minDuration,
  people,
}: {
  scope: 'studios' | 'search';
  studioCount: number;
  areaCount: number;
  dateCount: number;
  timeWindowCount: number;
  minDuration: number;
  people: number;
}): AnalyticsProperties {
  return {
    scope,
    studio_count: studioCount,
    area_count: areaCount,
    date_count: dateCount,
    time_window_count: timeWindowCount,
    min_duration: minDuration,
    people,
  };
}

export function trackEmptySuggestionClicked(label: string): void {
  trackEvent('Empty Suggestion Clicked', { label });
}

function platformProperties(): AnalyticsProperties {
  const platform = Capacitor.getPlatform();
  return {
    platform,
    native_app: Capacitor.isNativePlatform(),
  };
}

function searchProperties(filters: SearchAnalyticsContext): AnalyticsProperties {
  const offsets = filters.dates.map(dateOffsetDays).filter((value): value is number => value != null);
  const minOffset = offsets.length > 0 ? Math.min(...offsets) : null;
  const maxOffset = offsets.length > 0 ? Math.max(...offsets) : null;

  return {
    area_count: filters.areaIds.length,
    studio_count: filters.studioIds.length,
    date_count: filters.dates.length,
    time_window_count: filters.timeWindows.length,
    min_duration: filters.minDuration,
    people: filters.people,
    min_date_offset_bucket: minOffset == null ? undefined : dateOffsetBucketFromDays(minOffset),
    max_date_offset_bucket: maxOffset == null ? undefined : dateOffsetBucketFromDays(maxOffset),
  };
}

function changedFilterKeys(previous: SearchAnalyticsContext, next: SearchAnalyticsContext): string[] {
  const changed: string[] = [];
  if (!sameNumbers(previous.areaIds, next.areaIds)) changed.push('area');
  if (!sameNumbers(previous.studioIds, next.studioIds)) changed.push('studio');
  if (!sameStrings(previous.dates, next.dates)) changed.push('date');
  if (JSON.stringify(previous.timeWindows) !== JSON.stringify(next.timeWindows)) changed.push('time');
  if (previous.minDuration !== next.minDuration) changed.push('duration');
  if (previous.people !== next.people) changed.push('people');
  return changed;
}

function searchKey(filters: SearchAnalyticsContext): string {
  return JSON.stringify({
    areaIds: [...filters.areaIds].sort((a, b) => a - b),
    studioIds: [...filters.studioIds].sort((a, b) => a - b),
    dates: [...filters.dates].sort(),
    timeWindows: filters.timeWindows,
    minDuration: filters.minDuration,
    people: filters.people,
  });
}

function sameNumbers(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const aa = [...a].sort((x, y) => x - y);
  const bb = [...b].sort((x, y) => x - y);
  return aa.every((value, index) => value === bb[index]);
}

function sameStrings(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const aa = [...a].sort();
  const bb = [...b].sort();
  return aa.every((value, index) => value === bb[index]);
}

function dateOffsetDays(date: string): number | null {
  const target = new Date(`${date}T00:00:00+09:00`).getTime();
  const base = new Date(`${todayKst()}T00:00:00+09:00`).getTime();
  if (!Number.isFinite(target) || !Number.isFinite(base)) return null;
  return Math.round((target - base) / 86400000);
}

function dateOffsetBucket(date: string): string {
  const offset = dateOffsetDays(date);
  return offset == null ? 'unknown' : dateOffsetBucketFromDays(offset);
}

function dateOffsetBucketFromDays(offset: number): string {
  if (offset < 0) return 'past';
  if (offset === 0) return 'today';
  if (offset === 1) return 'tomorrow';
  if (offset <= 7) return '2_7_days';
  if (offset <= 14) return '8_14_days';
  if (offset <= 30) return '15_30_days';
  return '31_plus_days';
}

function sanitizeProperties(properties: AnalyticsProperties): Record<string, AnalyticsValue> {
  const result: Record<string, AnalyticsValue> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (value == null) continue;
    result[key] = value;
  }
  return result;
}
