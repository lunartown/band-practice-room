export type SlotStatus = 'AVAILABLE' | 'UNAVAILABLE' | 'UNKNOWN';
export type PriceSource = 'SCRAPED' | 'MANUAL' | 'UNKNOWN';
export type Freshness = 'fresh' | 'recent' | 'aging' | 'stale' | 'failed' | 'unknown';

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
  primaryAreaName?: string;
  areaIds?: number[];
  address?: string;
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
  bookingUrl: string;
  area?: Area;
  scrapedAt?: string;
  freshness?: Freshness;
}

export interface AreasResponse {
  areas: Area[];
}

export interface StudiosResponse {
  studios: Studio[];
}

export interface SlotsQuery {
  dateFrom: string;
  dateTo: string;
  areaId?: number;
  studioId?: number;
}

export interface SlotsResponse {
  dateFrom: string;
  dateTo: string;
  slots: Slot[];
}
