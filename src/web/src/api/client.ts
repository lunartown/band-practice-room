import { computeFreshness } from '../lib/date';
import { getMockAreas, getMockSlots, getMockStudios } from './mock';
import type {
  AreasResponse,
  RawSlot,
  RefreshResponse,
  SlotsQuery,
  SlotsResponse,
  StudiosResponse,
} from './types';

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
  query.timeWindows?.forEach((w) => params.append('timeWindows', `${w.from}-${w.to}`));
  if (query.minCapacity) params.set('minCapacity', String(query.minCapacity));
  if (query.minDuration && query.minDuration > 1) params.set('minDuration', String(query.minDuration));

  const response = await fetchJson<SlotsResponse>(`${API_BASE_URL}/slots?${params.toString()}`);
  return { ...response, slots: response.slots.map(withFreshness) };
}

// 검색 결과가 오래됐을 때, 화면에 보이는 합주실들의 수집을 즉시 돌리도록 백엔드에 요청한다.
// 백엔드가 신선도 게이트·쿨다운·동시성 제한을 적용하므로 클라이언트는 studioIds 만 넘긴다.
export async function refreshSlots(studioIds: number[]): Promise<RefreshResponse> {
  if (USE_MOCK_API || studioIds.length === 0) {
    return { dateFrom: '', dateTo: '', refreshed: [], skipped: [], failed: [] };
  }
  const response = await fetch(`${API_BASE_URL}/slots/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ studioIds }),
  });
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<RefreshResponse>;
}

function withFreshness(slot: RawSlot): RawSlot {
  return { ...slot, freshness: computeFreshness(slot.scrapedAt) };
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`API ${response.status}`);
  return response.json() as Promise<T>;
}
