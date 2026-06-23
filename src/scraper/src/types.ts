// 예약 소스(네이버/스페이스클라우드 등)와 무관한 공용 스크래핑 결과 모델.
// 각 소스 스크래퍼는 자기 원본 응답을 이 모델로 변환해서 워커에 돌려준다.

export type AvailabilityStatus = 'available' | 'unavailable' | 'unknown';

export type AvailabilitySlot = {
  roomName: string;
  date: string; // YYYY-MM-DD (KST)
  startTime: string; // HH:MM
  endTime: string; // HH:MM
  status: AvailabilityStatus;
  price: number | null; // 시간대 가격(원), 알 수 없으면 null
};

// 스크래핑 대상 방의 외부 식별자(소스마다 의미가 다르다).
export type ScrapeRoom = {
  roomName: string;
  // 소스별 external_key. 네이버=bizItemId, 스페이스클라우드="productId:reservationTypeId".
  externalKey: string;
};

export type RoomScrapeResult = {
  roomName: string;
  slots: AvailabilitySlot[];
  error?: string;
};

export type StudioScrapeResult = {
  rooms: RoomScrapeResult[];
};

// 모든 소스 스크래퍼가 따르는 공통 인터페이스.
export interface StudioScraper {
  scrape(dateFrom: string, dateTo: string): Promise<StudioScrapeResult>;
}
