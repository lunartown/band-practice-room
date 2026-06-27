import { useSyncExternalStore } from 'react';
import { getAlarmsSnapshot, subscribeAlarms } from './alarms';

/** 현재 알림을 건 합주실 ID 집합을 구독한다. 토글되면 리렌더된다. */
export function useAlarms(): ReadonlySet<number> {
  return useSyncExternalStore(subscribeAlarms, getAlarmsSnapshot, getAlarmsSnapshot);
}
