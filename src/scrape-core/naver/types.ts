// 공용 모델은 ../types 에서 가져와 재노출한다(기존 import 경로 호환).
export type {
  AvailabilityStatus,
  AvailabilitySlot,
  ScrapeRoom,
  RoomScrapeResult,
  StudioScrapeResult,
} from '../types.js';

import type { ScrapeRoom } from '../types.js';

// 네이버 스크래핑 대상 합주실(스튜디오)과 그 안의 방 목록.
export type ScrapeTarget = {
  studioSourceId: string;
  studioName: string;
  businessId: string; // 네이버 bizId (studio_sources.external_key)
  businessTypeId: number; // URL 의 /booking/{N}/ 세그먼트
  rooms: ScrapeRoom[];
};

// 네이버 hourlySchedule 응답의 시간 단위 한 칸.
export type NaverHourlyUnit = {
  unitStartDateTime: string; // ISO, UTC(Z) 또는 +09:00
  isUnitBusinessDay: boolean;
  isUnitSaleDay: boolean;
  unitStock: number | null;
  unitBookingCount: number | null;
  duration: number | null; // 분 단위, 보통 60
  prices: Array<{ price: number; isDefault: boolean }> | null;
};
