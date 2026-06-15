# API 명세

> 작성일: 2026-06-15
> 상태: 초안

## 1. 기본 규칙

- Base URL: `/api/v1`
- 날짜 형식: `YYYY-MM-DD`
- 시각 형식: ISO 8601 (`2026-06-15T10:00:00Z`)
- 시간 형식: `HH:mm` (`09:00`, `10:30`)
- 금액: 정수, 원(KRW) 단위
- 에러 응답: `{ "error": { "code": string, "message": string } }`

## 2. 엔드포인트 목록

| Method | Path    | 설명               |
| ------ | ------- | ------------------ |
| GET    | /areas  | 지역 목록 조회     |
| GET    | /slots  | 날짜 범위 슬롯 조회 |

## 3. GET /areas

활성화된 지역 목록을 `order` 기준 오름차순으로 반환한다.

**Response 200**

```json
{
  "areas": [
    { "id": 1, "slug": "hongdae", "name": "홍대" },
    { "id": 2, "slug": "sinchon", "name": "신촌" }
  ]
}
```

## 4. GET /slots

날짜 범위와 선택적 지역/합주실 조건으로 합주실별 슬롯을 반환한다.

프론트엔드는 이 응답을 받아 클라이언트에서 시간대, 합주실 조건을 즉시 필터링한다 (UX-004).

**Query Parameters**

| Parameter | Type   | Required | Description                  |
| --------- | ------ | -------- | ---------------------------- |
| dateFrom  | string | ✓        | 조회 시작 날짜 (YYYY-MM-DD)  |
| dateTo    | string | ✓        | 조회 종료 날짜 (YYYY-MM-DD)  |
| areaId    | number |          | 지역 ID 필터                 |
| studioId  | number |          | 합주실 ID 필터               |

**제약**

- `dateFrom`, `dateTo`는 양끝 포함 기준 최대 30일
- `dateFrom`은 오늘보다 과거 불가

**Response 200**

```json
{
  "dateFrom": "2026-06-15",
  "dateTo": "2026-07-14",
  "meta": {
    "generatedAt": "2026-06-15T09:00:00Z",
    "hasPartialFailure": true,
    "failedStudioCount": 1
  },
  "studios": [
    {
      "id": 1,
      "name": "마포 합주실",
      "address": "서울시 마포구 ...",
      "areaIds": [1],
      "rooms": [
        {
          "id": 1,
          "name": "A룸",
          "pricePerHour": 15000,
          "capacityMin": 2,
          "capacityMax": 6,
          "bookingUrl": "https://...",
          "slots": [
            {
              "date": "2026-06-15",
              "startTime": "09:00",
              "endTime": "10:00",
              "status": "AVAILABLE",
              "price": 15000,
              "priceSource": "SCRAPED",
              "freshness": "fresh",
              "bookingUrl": "https://...",
              "scrapedAt": "2026-06-15T08:30:00Z"
            }
          ]
        }
      ]
    }
  ]
}
```

**Response 400**

```json
{
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "dateTo must be within 30 days from dateFrom"
  }
}
```

## 5. 설계 메모

- 슬롯 조회를 단일 엔드포인트로 둔 이유: 프론트엔드가 데이터를 한 번에 받아 클라이언트에서 즉시 필터링하는 구조에 최적화하기 위해
- `bookingUrl`은 `slots.booking_url`을 우선 사용하고, 값이 없으면 `room_sources.url`을 fallback으로 사용한다
- `scrapedAt`은 슬롯별 마지막 수집 시각이다
- `freshness`는 `scrapedAt`과 최근 수집 실행 상태를 기준으로 서버에서 계산한다
- `status = UNKNOWN` 슬롯은 기본 응답에서 제외한다
- `meta.hasPartialFailure = true`이면 일부 합주실 또는 출처의 최근 수집에 실패했음을 의미한다
