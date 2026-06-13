# Scraper Design

## Goals

- 네이버 예약 페이지에서 날짜별 방/시간대 상태 추출
- 페이지 구조 변경에 대응하기 쉬운 어댑터 구조
- API 요청과 분리된 주기적 수집

## Package Boundary

`packages/scraper`는 Playwright와 파싱 로직을 포함합니다. API 서버는 이 패키지를 호출하거나, 별도 작업 프로세스로 실행할 수 있습니다.

## Proposed Interfaces

```ts
export interface ScrapeTarget {
  id: string;
  name: string;
  sourceUrl: string;
}

export interface AvailabilitySlot {
  roomName: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'available' | 'unavailable' | 'unknown';
  price?: number;
}

export interface ReservationScraper {
  scrape(target: ScrapeTarget, date: string): Promise<AvailabilitySlot[]>;
}
```

## First PoC Output

```json
{
  "target": {
    "name": "TBD",
    "sourceUrl": "TBD"
  },
  "date": "2026-06-12",
  "slots": []
}
```

