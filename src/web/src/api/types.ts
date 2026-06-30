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
  /** 활성 방 목록. 슬롯이 roomId 만 참조하므로 방 메타를 여기서 받아 조인한다. */
  rooms?: Room[];
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

/**
 * 화면이 소비하는 슬롯. studio·room 메타가 채워진 상태를 보장한다.
 * 서버 응답(RawSlot)을 studios 카탈로그로 하이드레이션해 만든다.
 */
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

/**
 * 서버가 내려주는 원본 슬롯. studio·room 메타를 슬롯마다 중복 전송하지 않도록
 * 점진적으로 `studioId`·`roomId` 참조만 남기는 중이라, studio·room 은 optional 이다.
 * (구버전 백엔드/네이티브 번들은 아직 studio·room 객체를 그대로 실어 보낸다.)
 * `hydrateSlots` 가 studios 카탈로그로 채워 `Slot` 으로 변환한다.
 */
export interface RawSlot extends Omit<Slot, 'studio' | 'room'> {
  studio?: Studio;
  room?: Room;
  studioId?: number;
  roomId?: number;
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
  slots: RawSlot[];
}

export interface RefreshResponse {
  dateFrom: string;
  dateTo: string;
  refreshed: Array<{ studioId: number; studioName: string; sourceCode: string; slots: number }>;
  skipped: Array<{ studioId: number; sourceCode: string; reason: 'fresh' | 'cooldown' | 'capped' }>;
  failed: Array<{ studioId: number; sourceCode: string; error: string }>;
}
