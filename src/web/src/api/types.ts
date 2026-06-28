export type SlotStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
export type PriceSource = 'SCRAPED' | 'MANUAL' | 'UNKNOWN';
export type Freshness = 'fresh' | 'recent' | 'aging' | 'stale' | 'unknown';

export interface Area {
  id: number;
  slug: string;
  name: string;
}

export interface Studio {
  id: number;
  slug?: string;
  name: string;
  primaryAreaId: number | null;
  primaryAreaName: string | null;
  areaIds?: number[];
  address?: string | null;
  imageUrl?: string | null;
  rating?: number | null;
  reviewCount?: number | null;
  reviewKeywords?: ReviewKeyword[];
  /** 온라인(네이버/스페이스클라우드) 예약 소스 보유 여부. false면 전화예약 합주실. */
  hasOnlineBooking?: boolean;
}

export interface ReviewKeyword {
  keyword: string;
  count: number;
}

export interface Room {
  id: number;
  name: string;
  pricePerHour: number | null;
  capacityMin?: number | null;
  capacityMax?: number | null;
}

export interface Slot {
  id?: number;
  date: string;
  startTime: string;
  endTime: string;
  status: SlotStatus;
  price: number | null;
  priceSource: PriceSource;
  studio: Studio;
  room: Room;
  bookingUrl: string | null;
  scrapedAt?: string;
  freshness?: Freshness;
}

export interface AreasResponse {
  areas: Area[];
}

export interface StudiosResponse {
  studios: Studio[];
}

export interface TimeWindow {
  from: string;
  to: string;
}

export interface SlotsQuery {
  dates?: string[];
  areaIds?: number[];
  studioId?: number;
  timeWindows?: TimeWindow[];
  minCapacity?: number;
  minDuration?: number;
}

export interface SlotsResponse {
  dates: string[];
  slots: Slot[];
}

export interface RefreshResponse {
  dateFrom: string;
  dateTo: string;
  refreshed: Array<{ studioId: number; studioName: string; sourceCode: string; slots: number }>;
  skipped: Array<{ studioId: number; sourceCode: string; reason: 'fresh' | 'cooldown' | 'capped' }>;
  failed: Array<{ studioId: number; sourceCode: string; error: string }>;
}
