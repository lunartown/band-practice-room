import { getMockAreas, getMockSlots, getMockStudios } from './mock';
import type { AreasResponse, SlotsQuery, SlotsResponse, StudiosResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api/v1';
const USE_MOCK_API = import.meta.env.VITE_USE_MOCK_API !== 'false';

export async function getAreas(): Promise<AreasResponse> {
  if (USE_MOCK_API) return getMockAreas();
  return fetchJson(`${API_BASE_URL}/areas`);
}

export async function getStudios(areaId?: number): Promise<StudiosResponse> {
  if (USE_MOCK_API) return getMockStudios(areaId);
  const params = new URLSearchParams();
  if (areaId) params.set('areaId', String(areaId));
  return fetchJson(`${API_BASE_URL}/studios?${params.toString()}`);
}

export async function getSlots(query: SlotsQuery): Promise<SlotsResponse> {
  if (USE_MOCK_API) return getMockSlots(query);
  const params = new URLSearchParams({
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
  });
  if (query.areaId) params.set('areaId', String(query.areaId));
  if (query.studioId) params.set('studioId', String(query.studioId));
  return fetchJson(`${API_BASE_URL}/slots?${params.toString()}`);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}
