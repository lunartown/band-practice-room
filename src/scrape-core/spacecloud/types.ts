// 스페이스클라우드 가격/예약가능 API(api.spacecloud.kr) 원본 응답 타입.

export type SpaceCloudTime = {
  hour: number; // 0~23 (KST 기준 시작 시각)
  price: number; // 해당 시간대 1시간 가격(원)
  is_nowpay_quick: boolean;
  available: boolean; // 즉시 예약 가능 여부
};

export type SpaceCloudDay = {
  year: string;
  month: string; // "6" 처럼 0-패딩 없이 올 수 있음
  day: string;
  wday: string;
  hday: string; // 공휴일 여부 Y/N
  available: boolean; // 그날 예약 가능 칸이 하나라도 있는지
  times?: SpaceCloudTime[]; // 예약 불가한 날은 생략됨
};

export type SpaceCloudPricesResponse = {
  year: string;
  month: string;
  days: SpaceCloudDay[];
};

// 스페이스클라우드 방 = product + reservation_type 조합.
export type SpaceCloudScrapeRoom = {
  roomName: string;
  productId: string;
  reservationTypeId: string;
};

export type SpaceCloudScrapeTarget = {
  studioName: string;
  rooms: SpaceCloudScrapeRoom[];
};
