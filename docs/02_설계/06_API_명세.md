# API 명세

> 작성일: 2026-06-15
> 상태: 초안

## 1. 기본 규칙

- Base URL: `/api/v1`
- 날짜 형식: `YYYY-MM-DD`
- 시간 형식: `HH:mm`
- 금액: 정수, 원(KRW) 단위
- 알 수 없는 금액은 `null`로 반환한다
- 에러 응답: `{ "error": { "code": string, "message": string } }`

## 2. 엔드포인트 목록

| Method | Path   | 설명               |
| ------ | ------ | ------------------ |
| GET    | /areas | 지역 목록 조회     |
| GET    | /slots | 날짜 범위 슬롯 조회 |

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

날짜 범위와 선택적 지역/합주실 조건으로 슬롯을 반환한다.

프론트엔드는 이 응답을 받아 클라이언트에서 시간대, 합주실 조건을 즉시 필터링한다.

**Query Parameters**

| Parameter | Type   | Required | Description                 |
| --------- | ------ | -------- | --------------------------- |
| dateFrom  | string | ✓        | 조회 시작 날짜 (YYYY-MM-DD) |
| dateTo    | string | ✓        | 조회 종료 날짜 (YYYY-MM-DD) |
| areaId    | number |          | 지역 ID 필터                |
| studioId  | number |          | 합주실 ID 필터              |

**제약**

- `dateFrom`, `dateTo`는 양끝 포함 기준 최대 30일이다.
- 예: `2026-06-15`부터 30일 범위는 `2026-07-14`까지다.
- `dateFrom`은 오늘보다 과거일 수 없다.

**Response 200**

```json
{
  "dateFrom": "2026-06-15",
  "dateTo": "2026-07-14",
  "slots": [
    {
      "date": "2026-06-15",
      "startTime": "09:00",
      "endTime": "10:00",
      "status": "AVAILABLE",
      "price": 15000,
      "priceSource": "SCRAPED",
      "studio": {
        "id": 1,
        "name": "마포 합주실",
        "primaryAreaId": 1,
        "address": "서울시 마포구 ..."
      },
      "room": {
        "id": 1,
        "name": "A룸",
        "pricePerHour": 15000,
        "capacityMin": 2,
        "capacityMax": 6
      },
      "bookingUrl": "https://..."
    },
    {
      "date": "2026-06-15",
      "startTime": "10:00",
      "endTime": "11:00",
      "status": "UNAVAILABLE",
      "price": null,
      "priceSource": "UNKNOWN",
      "studio": {
        "id": 1,
        "name": "마포 합주실",
        "primaryAreaId": 1,
        "address": "서울시 마포구 ..."
      },
      "room": {
        "id": 1,
        "name": "A룸",
        "pricePerHour": 15000,
        "capacityMin": 2,
        "capacityMax": 6
      },
      "bookingUrl": "https://..."
    }
  ]
}
```

**Response 400**

```json
{
  "error": {
    "code": "INVALID_DATE_RANGE",
    "message": "dateTo must be within 30 included days from dateFrom"
  }
}
```

## 5. 설계 메모

- `slots`는 검색 결과용 read model이므로 flat 배열로 반환한다.
- flat 구조는 클라이언트가 날짜, 시간, 지역, 합주실 기준으로 자유롭게 그룹핑하기 쉽다.
- 중복되는 `studio`, `room` 정보가 응답 크기 문제를 만들면 `studios`, `rooms`, `slots`를 분리한 normalized response로 바꾼다.
- `status = AVAILABLE`, `UNAVAILABLE`은 기본 응답에 포함한다.
- `status = UNKNOWN`은 기본 응답에서 제외한다.
- `bookingUrl`은 우선 `room_sources.url` 기준으로 반환한다.
