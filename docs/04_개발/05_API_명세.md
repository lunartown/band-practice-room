# API 명세

> 작성일: 2026-06-15
> 상태: 초안

## 1. 원칙

MVP API는 합주실 예약 가능 시간 검색에만 집중한다.

- API는 사용자 요청마다 스크래핑하지 않는다
- API는 PostgreSQL에 사전 적재된 데이터를 반환한다
- 기본 조회 범위는 오늘부터 30일이다
- 30일 범위의 available 슬롯을 한 번에 내려준다
- 프론트는 응답을 받은 뒤 조건 변경을 클라이언트에서 즉시 필터링한다
- 응답에는 가격과 데이터 신선도 정보를 포함한다
- 최종 예약은 원본 예약 페이지에서 진행한다

Base path:

```txt
/api/v1
```

시간 기준:

- 날짜와 시간은 `Asia/Seoul` 기준으로 해석한다
- 날짜는 `YYYY-MM-DD`
- 시간은 `HH:mm`
- API 응답의 timestamp는 ISO 8601 문자열로 내려준다

## 2. 공통 타입

### 2.1 PriceSource

```ts
type PriceSource = 'scraped' | 'manual' | 'room_base' | 'unknown';
```

### 2.2 FreshnessStatus

```ts
type FreshnessStatus = 'fresh' | 'aging' | 'stale' | 'failed' | 'unknown';
```

의미:

| 상태 | 의미 | UI 표시 |
| --- | --- | --- |
| fresh | 최근 수집 성공 | 일반 상태 |
| aging | 아직 사용 가능하지만 확인 시점이 조금 지남 | 낮은 위계의 시간 표시 |
| stale | 확인 시점이 오래되어 원본과 달라졌을 수 있음 | amber 계열 상태 |
| failed | 최근 수집 실패 | 마지막 성공 데이터가 있으면 stale처럼 표시 |
| unknown | 아직 수집 전 | 결과 없음과 구분 |

stale은 예약 불가라는 뜻이 아니다. 마지막 수집 이후 원본에서 예약이 발생했을 수 있다는 신뢰도 상태다.

MVP 기본 freshness 기준:

| 상태 | 기준 |
| --- | --- |
| fresh | `scrapedAt`이 현재 시각 기준 1시간 이내 |
| aging | `scrapedAt`이 현재 시각 기준 1시간 초과 6시간 이내 |
| stale | `scrapedAt`이 현재 시각 기준 6시간 초과 |

이 기준은 전역 기본값이다. 운영 중 오늘/내일과 8~30일 뒤 데이터를 서로 다른 기준으로 나눌 수 있다.

## 3. GET /availability

예약 가능 슬롯 조회 API. MVP의 핵심 API다.

```http
GET /api/v1/availability
```

### 3.1 Query

| 이름 | 타입 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| dateFrom | date | no | 오늘 | 조회 시작 날짜 |
| dateTo | date | no | dateFrom + 29일 | 조회 종료 날짜 |
| areas | string | no | 전체 | 생활권 목록. 쉼표 구분. 예: `홍대,합정,신촌` |
| practiceRoomIds | string | no | 전체 | 합주실 id 목록. 쉼표 구분 |
| roomIds | string | no | 전체 | 방 id 목록. 쉼표 구분 |
| timeFrom | string | no | 없음 | 시작 시간 하한. 예: `14:00` |
| timeTo | string | no | 없음 | 종료 시간 상한. 예: `24:00` |
| minCapacity | number | no | 없음 | 최소 수용 인원 |
| maxPricePerHour | number | no | 없음 | 시간당 최대 가격 |
| includeStale | boolean | no | true | stale 슬롯 포함 여부 |
| sort | string | no | `time_asc` | 정렬 기준 |

`dateTo - dateFrom`은 MVP에서 최대 30일로 제한한다.

정렬값:

| 값 | 설명 |
| --- | --- |
| time_asc | 날짜, 시작 시간 빠른 순 |
| price_asc | 시간당 가격 낮은 순. 같은 가격이면 날짜/시간 순 |
| recently_scraped | 최근 확인 순. 같은 확인 시각이면 날짜/시간 순 |

### 3.2 응답

```json
{
  "dateFrom": "2026-06-15",
  "dateTo": "2026-07-14",
  "timezone": "Asia/Seoul",
  "generatedAt": "2026-06-15T09:25:00+09:00",
  "query": {
    "areas": ["홍대", "합정", "신촌"],
    "timeFrom": "14:00",
    "timeTo": "24:00",
    "maxPricePerHour": 20000,
    "includeStale": true,
    "sort": "time_asc"
  },
  "summary": {
    "practiceRoomCount": 12,
    "roomCount": 38,
    "availableSlotCount": 126,
    "staleSlotCount": 8
  },
  "practiceRooms": [
    {
      "id": "ground-hongdae-main",
      "name": "그라운드 합주실 홍대 본점",
      "area": "홍대",
      "areaTags": ["홍대"],
      "sourceType": "naver",
      "sourceUrl": "https://m.booking.naver.com/...",
      "bookingUrl": "https://m.booking.naver.com/...",
      "rooms": [
        {
          "id": "ground-hongdae-main:a-room",
          "name": "A룸",
          "basePricePerHour": 16000,
          "basePriceSource": "scraped",
          "capacityMin": 2,
          "capacityMax": 6,
          "bookingUrl": "https://m.booking.naver.com/..."
        }
      ]
    }
  ],
  "slots": [
    {
      "id": 10001,
      "roomId": "ground-hongdae-main:a-room",
      "practiceRoomId": "ground-hongdae-main",
      "date": "2026-06-15",
      "startTime": "14:00",
      "endTime": "16:00",
      "durationMinutes": 120,
      "pricePerHour": 16000,
      "totalPrice": 32000,
      "priceSource": "room_base",
      "scrapedAt": "2026-06-15T09:20:00+09:00",
      "freshnessStatus": "fresh",
      "bookingUrl": "https://m.booking.naver.com/..."
    }
  ],
  "freshness": [
    {
      "practiceRoomId": "ground-hongdae-main",
      "lastScrapedAt": "2026-06-15T09:20:00+09:00",
      "status": "fresh",
      "failedAt": null,
      "errorMessage": null
    }
  ]
}
```

### 3.3 응답 구성 이유

`practiceRooms`와 `slots`를 분리한다. 슬롯마다 합주실명, 생활권, 방 이름을 반복하면 30일 응답에서 중복이 커진다. 프론트는 `roomId`와 `practiceRoomId`로 메타데이터를 조인해서 표시한다.

### 3.4 상태 코드

| 코드 | 상황 |
| --- | --- |
| 200 | 정상 |
| 400 | 잘못된 날짜/시간/범위 |
| 500 | 서버 오류 |

400 예시:

```json
{
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "dateTo must be within 30 days from dateFrom"
  }
}
```

## 4. GET /practice-rooms

수집 대상 합주실 목록을 반환한다. 필터 UI와 운영 확인용이다.

```http
GET /api/v1/practice-rooms
```

### 4.1 Query

| 이름 | 타입 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| areas | string | no | 전체 | 생활권 목록. 쉼표 구분 |
| activeOnly | boolean | no | true | 활성 합주실만 조회 |

### 4.2 응답

```json
{
  "practiceRooms": [
    {
      "id": "ground-hongdae-main",
      "name": "그라운드 합주실 홍대 본점",
      "area": "홍대",
      "areaTags": ["홍대"],
      "sourceType": "naver",
      "sourceUrl": "https://m.booking.naver.com/...",
      "bookingUrl": "https://m.booking.naver.com/...",
      "isActive": true,
      "roomCount": 4,
      "lastScrapedAt": "2026-06-15T09:20:00+09:00",
      "freshnessStatus": "fresh"
    }
  ]
}
```

## 5. GET /areas

생활권 필터 목록을 반환한다.

```http
GET /api/v1/areas
```

### 5.1 응답

```json
{
  "areas": [
    {
      "name": "홍대",
      "practiceRoomCount": 8,
      "isDefault": true
    },
    {
      "name": "합정",
      "practiceRoomCount": 5,
      "isDefault": true
    },
    {
      "name": "신촌",
      "practiceRoomCount": 4,
      "isDefault": true
    }
  ]
}
```

초기 MVP 기본 생활권은 홍대, 합정, 신촌이다.

## 6. GET /freshness

합주실별 수집 상태를 반환한다. `/availability`에도 포함되지만, 운영 화면이나 가벼운 상태 표시에서 따로 쓸 수 있다.

```http
GET /api/v1/freshness
```

### 6.1 Query

| 이름 | 타입 | 필수 | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| practiceRoomIds | string | no | 전체 | 합주실 id 목록. 쉼표 구분 |

### 6.2 응답

```json
{
  "freshness": [
    {
      "practiceRoomId": "ground-hongdae-main",
      "lastScrapedAt": "2026-06-15T09:20:00+09:00",
      "lastSuccessAt": "2026-06-15T09:20:00+09:00",
      "lastFailedAt": null,
      "status": "fresh",
      "errorMessage": null
    }
  ]
}
```

## 7. POST /internal/scrape-jobs

초기에는 외부 공개 API가 아니라 내부 운영용으로 둔다. 수동 재수집, 특정 합주실 테스트에 사용한다.

```http
POST /api/v1/internal/scrape-jobs
```

Request:

```json
{
  "practiceRoomId": "ground-hongdae-main",
  "dateFrom": "2026-06-15",
  "dateTo": "2026-07-14",
  "scheduledAt": "2026-06-15T09:30:00+09:00"
}
```

Response:

```json
{
  "job": {
    "id": 123,
    "practiceRoomId": "ground-hongdae-main",
    "dateFrom": "2026-06-15",
    "dateTo": "2026-07-14",
    "status": "pending",
    "scheduledAt": "2026-06-15T09:30:00+09:00"
  }
}
```

## 8. URL query 매핑

프론트 공유 URL과 API query를 최대한 맞춘다.

예:

```txt
/?areas=홍대,합정,신촌&dateFrom=2026-06-15&dateTo=2026-07-14&timeFrom=14:00&timeTo=24:00&maxPricePerHour=20000&sort=time_asc
```

프론트는 이 query를 읽어서 `/api/v1/availability`에 그대로 넘길 수 있어야 한다.

## 9. MVP에서 보류

- 사용자 계정
- 즐겨찾기
- 예약 대행
- 결제
- 리뷰
- 합주실 상세 페이지
- 공연장 예약
- 개인연습실
- 커뮤니티
