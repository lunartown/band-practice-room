export type AvailabilityStatus = 'available' | 'unavailable' | 'unknown';

// 스크래핑 대상 합주실(스튜디오)과 그 안의 방 목록.
export type ScrapeTarget = {
  studioSourceId: string;
  studioName: string;
  businessId: string; // 네이버 bizId (studio_sources.external_key)
  businessTypeId: number; // URL 의 /booking/{N}/ 세그먼트
  rooms: ScrapeRoom[];
};

export type ScrapeRoom = {
  roomName: string;
  bizItemId: string; // 네이버 실제 bizItemId (room_sources.external_key)
};

export type AvailabilitySlot = {
  roomName: string;
  date: string; // YYYY-MM-DD (KST)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: AvailabilityStatus;
  price: number | null; // 시간대 가격(원), 알 수 없으면 null
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

export type RoomScrapeResult = {
  roomName: string;
  slots: AvailabilitySlot[];
  error?: string;
};

export type StudioScrapeResult = {
  rooms: RoomScrapeResult[];
};
