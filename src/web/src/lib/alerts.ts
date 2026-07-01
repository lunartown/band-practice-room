import type { Studio, TimeWindow } from '../api/types';

// 알림의 단일 소스는 서버 구독이다(조회·생성·삭제 모두 notificationsApi 경유).
// 이 모듈은 타입과 조건 정규화·비교, 서버 DTO 매핑만 담당하고 로컬에 저장하지 않는다.
const LEGACY_STORAGE_KEY = 'hapjusil.empty-slot-alerts.v1';

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

// 알림 조건 묶음. 생성 요청(id 없음)과 저장된 알림이 공유한다.
export interface AlertConditions {
  scope: AlertScope;
  studios: AlertStudio[];
  areaIds: number[];
  dates: string[];
  timeWindows: TimeWindow[];
  minDuration: 1 | 2 | 3 | 4;
  people: number;
}

export interface SavedAlert extends AlertConditions {
  // 서버 구독 id.
  id: number;
  createdAt: string;
}

export function buildAlertConditions(draft: AlertDraft, filters: AlertConditionInput): AlertConditions {
  const studios = draft.scope === 'studios' ? draft.studios.map(({ id, name }) => ({ id, name })) : [];
  return {
    scope: studios.length > 0 ? 'studios' : 'search',
    studios,
    areaIds: uniqueNumbers(filters.areaIds),
    dates: uniqueStrings(draft.dates).sort(),
    timeWindows: normalizeTimeWindows(filters.timeWindows),
    minDuration: normalizeDuration(filters.minDuration),
    people: normalizePeople(filters.people),
  };
}

// 같은 조건의 알림을 중복 등록하지 않기 위한 비교 키.
export function alertConditionKey(alert: AlertConditions): string {
  return JSON.stringify({
    studios: alert.studios.map((studio) => studio.id).sort((a, b) => a - b),
    areaIds: [...alert.areaIds].sort((a, b) => a - b),
    dates: [...alert.dates].sort(),
    timeWindows: alert.timeWindows,
    minDuration: alert.minDuration,
    people: alert.people,
  });
}

// GET/POST /notifications/subscriptions 응답 항목 → SavedAlert.
export function alertFromSubscriptionDto(value: unknown): SavedAlert | null {
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if (typeof record.id !== 'number') return null;
  const studios = normalizeStudios(record.studios);

  return {
    id: record.id,
    scope: studios.length > 0 ? 'studios' : 'search',
    studios,
    areaIds: uniqueNumbers(Array.isArray(record.areaIds) ? record.areaIds : []),
    dates: uniqueStrings(Array.isArray(record.dates) ? record.dates : []).sort(),
    timeWindows: normalizeTimeWindows(Array.isArray(record.timeWindows) ? record.timeWindows : []),
    minDuration: normalizeDuration(record.minDuration),
    people: normalizePeople(record.minCapacity),
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : new Date().toISOString(),
  };
}

// 서버 단일 소스 전환 이전에 로컬로만 저장하던 알림 데이터를 정리한다.
export function clearLegacyLocalAlerts(): void {
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // 저장소가 막혀 있으면 지울 것도 없다.
  }
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
