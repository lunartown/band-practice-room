import { computeFreshness } from '../lib/date';
import { getMockAreas, getMockSlots, getMockStudios } from './mock';
import type { AreasResponse, Slot, SlotsQuery, SlotsResponse, StudiosResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

export async function getAreas(): Promise<AreasResponse> {
  if (USE_MOCK_API) return getMockAreas();
  return fetchJson(`${API_BASE_URL}/areas`);
}

export async function getStudios(areaIds?: number[]): Promise<StudiosResponse> {
  if (USE_MOCK_API) return getMockStudios(areaIds);
  const params = new URLSearchParams();
  areaIds?.forEach((id) => params.append('areaIds', String(id)));
  return fetchJson(`${API_BASE_URL}/studios?${params.toString()}`);
}

export async function getSlots(query: SlotsQuery): Promise<SlotsResponse> {
  if (USE_MOCK_API) return getMockSlots(query);

  const params = new URLSearchParams();
  query.dates?.forEach((d) => params.append('dates', d));
  query.areaIds?.forEach((id) => params.append('areaIds', String(id)));
  if (query.studioId) params.set('studioId', String(query.studioId));
  query.studioIds?.forEach((id) => params.append('studioIds', String(id)));
  query.timeWindows?.forEach((w) => params.append('timeWindows', `${w.from}-${w.to}`));
  if (query.minCapacity) params.set('minCapacity', String(query.minCapacity));
  if (query.minDuration && query.minDuration > 1) params.set('minDuration', String(query.minDuration));

  const response = await fetchJson<SlotsResponse>(`${API_BASE_URL}/slots?${params.toString()}`);
  return { ...response, slots: response.slots.map(withFreshness) };
}

function withFreshness(slot: Slot): Slot {
  return { ...slot, freshness: computeFreshness(slot.scrapedAt) };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}
