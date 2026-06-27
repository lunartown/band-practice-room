import type { Studio, TimeWindow } from '../api/types';

const ALERTS_STORAGE_KEY = 'hapjusil.empty-slot-alerts.v1';

export type AlertScope = 'studios' | 'search';

export interface AlertStudio {
  id: number;
  name: string;
}

export type AlertDraft =
  | {
      scope: 'studios';
      studios: Pick<Studio, 'id' | 'name'>[];
      dates: string[];
    }
  | {
      scope: 'search';
      dates: string[];
    };

export interface AlertConditionInput {
  areaIds: number[];
  timeWindows: TimeWindow[];
  minDuration: 1 | 2 | 3 | 4;
  people: number;
}

export interface SavedAlert {
  id: string;
  scope: AlertScope;
  studios: AlertStudio[];
  areaIds: number[];
  dates: string[];
  timeWindows: TimeWindow[];
  minDuration: 1 | 2 | 3 | 4;
  people: number;
  createdAt: string;
  updatedAt: string;
}

export function loadAlerts(): SavedAlert[] {
  try {
    const raw = localStorage.getItem(ALERTS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return sortAlerts(parsed.map(normalizeAlert).filter((alert): alert is SavedAlert => Boolean(alert)));
  } catch {
    return [];
  }
}

export function saveAlerts(alerts: SavedAlert[]): SavedAlert[] {
  const sorted = sortAlerts(alerts);
  try {
    localStorage.setItem(ALERTS_STORAGE_KEY, JSON.stringify(sorted));
  } catch {
    // 저장소가 막혀도 현재 세션 상태는 유지한다.
  }
  return sorted;
}

export function createAlertFromDraft(draft: AlertDraft, filters: AlertConditionInput): SavedAlert {
  const now = new Date().toISOString();
  return {
    id: createId(),
    scope: draft.scope,
    studios: draft.scope === 'studios' ? draft.studios.map(({ id, name }) => ({ id, name })) : [],
    areaIds: draft.scope === 'search' ? uniqueNumbers(filters.areaIds) : [],
    dates: uniqueStrings(draft.dates).sort(),
    timeWindows: normalizeTimeWindows(filters.timeWindows),
    minDuration: normalizeDuration(filters.minDuration),
    people: normalizePeople(filters.people),
    createdAt: now,
    updatedAt: now,
  };
}

export function upsertAlert(alerts: SavedAlert[], alert: SavedAlert): SavedAlert[] {
  const key = alertKey(alert);
  const existing = alerts.find((item) => alertKey(item) === key);
  if (!existing) return saveAlerts([alert, ...alerts]);

  return saveAlerts(
    alerts.map((item) =>
      item.id === existing.id
        ? { ...alert, id: item.id, createdAt: item.createdAt, updatedAt: alert.updatedAt }
        : item,
    ),
  );
}

export function updateAlert(alerts: SavedAlert[], alert: SavedAlert): SavedAlert[] {
  const updated = { ...alert, updatedAt: new Date().toISOString() };
  return saveAlerts(alerts.map((item) => (item.id === alert.id ? normalizeAlert(updated) ?? updated : item)));
}

export function deleteAlert(alerts: SavedAlert[], id: string): SavedAlert[] {
  return saveAlerts(alerts.filter((alert) => alert.id !== id));
}

function normalizeAlert(value: unknown): SavedAlert | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  const scope = record.scope === 'studios' || record.scope === 'search' ? record.scope : null;
  if (!scope || typeof record.id !== 'string') return null;

  return {
    id: record.id,
    scope,
    studios: scope === 'studios' ? normalizeStudios(record.studios) : [],
    areaIds: scope === 'search' ? uniqueNumbers(Array.isArray(record.areaIds) ? record.areaIds : []) : [],
    dates: uniqueStrings(Array.isArray(record.dates) ? record.dates : []).sort(),
    timeWindows: normalizeTimeWindows(Array.isArray(record.timeWindows) ? record.timeWindows : []),
    minDuration: normalizeDuration(record.minDuration),
    people: normalizePeople(record.people),
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
    updatedAt: typeof record.updatedAt === 'string' ? record.updatedAt : new Date().toISOString(),
  };
}

function normalizeStudios(value: unknown): AlertStudio[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      if (typeof record.id !== 'number' || typeof record.name !== 'string') return null;
      return { id: record.id, name: record.name };
    })
    .filter((studio): studio is AlertStudio => Boolean(studio));
}

function normalizeTimeWindows(value: unknown): TimeWindow[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const record = item as Record<string, unknown>;
      if (typeof record.from !== 'string' || typeof record.to !== 'string') return null;
      return { from: record.from, to: record.to };
    })
    .filter((window): window is TimeWindow => Boolean(window));
}

function normalizeDuration(value: unknown): 1 | 2 | 3 | 4 {
  return value === 2 || value === 3 || value === 4 ? value : 1;
}

function normalizePeople(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(1, Math.min(10, Math.round(value))) : 2;
}

function uniqueNumbers(value: unknown[]): number[] {
  return [...new Set(value.filter((item): item is number => typeof item === 'number' && Number.isFinite(item)))];
}

function uniqueStrings(value: unknown[]): string[] {
  return [...new Set(value.filter((item): item is string => typeof item === 'string' && item.length > 0))];
}

function sortAlerts(alerts: SavedAlert[]): SavedAlert[] {
  return [...alerts].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

function alertKey(alert: SavedAlert): string {
  return JSON.stringify({
    scope: alert.scope,
    studios: alert.studios.map((studio) => studio.id).sort((a, b) => a - b),
    areaIds: [...alert.areaIds].sort((a, b) => a - b),
    dates: [...alert.dates].sort(),
    timeWindows: alert.timeWindows,
    minDuration: alert.minDuration,
    people: alert.people,
  });
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
