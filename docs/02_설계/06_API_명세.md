# API 명세

> 작성일: 2026-06-15 (구현 반영 갱신: 2026-06-22)
> 상태: 구현 반영 — 실제 `src/api` 구현 기준

## 1. 기본 규칙

- Base URL: `/api/v1`
- 날짜 형식: `YYYY-MM-DD`
- 시간 형식: `HH:mm`
- 금액: 정수, 원(KRW) 단위
- 알 수 없는 금액은 `null`로 반환한다
- 에러 응답: `{ "error": { "code": string, "message": string } }`

## 2. 엔드포인트 목록

| Method | Path     | 설명               |
| ------ | -------- | ------------------ |
| GET    | /areas   | 지역 목록 조회     |
| GET    | /studios | 합주실 목록 조회   |
| GET    | /slots   | 날짜 범위 슬롯 조회 |

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

## 4. GET /studios

활성화된 합주실 목록을 반환한다. 필터 시트의 합주실 선택 목록에 사용한다.

**Query Parameters**

| Parameter | Type   | Required | Description  |
| --------- | ------ | -------- | ------------ |
| areaId    | number |          | 지역 ID 필터 |

**Response 200**

```json
{
  "studios": [
    {
      "id": 1,
      "slug": "mapo-studio",
      "name": "마포 합주실",
      "primaryAreaId": 1,
      "primaryAreaName": "마포",
      "areaIds": [1, 2],
      "address": "서울시 마포구 ...",
      "imageUrl": "https://...",
      "rating": 4.8,
      "reviewCount": 123,
      "reviewKeywords": [{ "keyword": "방음", "count": 30 }],
      "rooms": [
        {
          "id": 10,
          "name": "A룸",
          "pricePerHour": 22000,
          "capacityMin": 2,
          "capacityMax": 8
        }
      ],
      "hasOnlineBooking": true
    }
  ]
}
```

`imageUrl`은 수기 입력값(`image_url_manual`)을 우선하고 없으면 수집값(`image_url_scraped`)을 사용한다. `rating`, `reviewCount`는 값이 없으면 `null`이고, `reviewKeywords`는 없으면 `[]`다. `primaryAreaName`·`reviewKeywords`·`rooms`는 slots 응답의 studio·room 메타를 슬롯마다 중복 전송하지 않도록, 합주실/방 정보를 이 엔드포인트로 모으기 위해 포함한다. `rooms`는 `is_active = true`인 방만 담으며 없으면 `[]`다. 슬롯은 추후 `studioId`·`roomId` 참조만 두고, 프론트가 이 응답으로 `Map<studioId>`·`Map<roomId>`를 구성해 조인한다.

## 5. GET /slots

날짜 범위와 선택적 지역/합주실 조건으로 슬롯을 반환한다.

프론트엔드는 이 응답을 받아 클라이언트에서 시간대, 합주실 조건을 즉시 필터링한다.

**Query Parameters** (모두 선택, 반복 파라미터는 배열로 받는다)

| Parameter   | Type            | Description                                                            |
| ----------- | --------------- | --------------------------------------------------------------------- |
| dates       | string[]        | 조회 날짜 목록 (`YYYY-MM-DD` 반복). 미지정 시 서버 기본 범위를 사용한다 |
| areaIds     | number[]        | 지역 ID 필터 (반복)                                                   |
| studioId    | number          | 합주실 ID 필터                                                        |
| timeWindows | string[]        | 시간대 필터. `HH:mm-HH:mm` 형식 반복 (예: `18:00-24:00`)              |
| timeFrom    | string          | (레거시) 단일 시작 시각. `timeWindows` 미지정 시 한 윈도우로 흡수      |
| timeTo      | string          | (레거시) 단일 종료 시각                                               |
| minCapacity | number          | 최소 수용 인원                                                        |
| minDuration | number          | 최소 연속 가능 시간(시간 단위, 1–4)                                   |

**제약**

- `minDuration`은 1 이상 4 이하다. 벗어나면 `400 INVALID_PARAMETER`.
- `areaIds`는 `studio_areas.area_id` 기준으로 필터링한다.
- `studioId`와 `areaIds`를 함께 보내면 두 조건을 모두 만족하는 슬롯만 반환한다.
- 날짜 범위 정책(양끝 포함 최대 30일, 과거 불가)은 `dates` 파싱 단계에서 검증한다.

**Response 200**

응답 최상위는 요청에 사용한 `dates`와 `slots` 배열이다. 슬롯은 **예약 가능한 것(`status = AVAILABLE`)만** 반환한다.

슬롯은 합주실·방 메타를 싣지 않고 `studioId`·`roomId` 참조만 둔다. 클라이언트는 `GET /studios`(방 포함)로 카탈로그를 받아 `studioId`·`roomId` 로 메타를 조인한다. 합주실 한 곳에 슬롯이 수십 개씩 달리는데 메타를 슬롯마다 반복 전송하면 전송량(egress)이 크게 부푸므로 분리한다.

```json
{
  "dates": ["2026-06-15", "2026-06-16"],
  "slots": [
    {
      "date": "2026-06-15",
      "startTime": "09:00",
      "endTime": "10:00",
      "status": "AVAILABLE",
      "price": 15000,
      "priceSource": "SCRAPED",
      "scrapedAt": "2026-06-15T09:00:00.000Z",
      "studioId": 1,
      "roomId": 1,
      "bookingUrl": "https://m.booking.naver.com/booking/..."
    }
  ]
}
```

`bookingUrl`은 날짜(`startDate`)가 박혀 슬롯마다 다르므로 슬롯에 남긴다.

**Response 400**

```json
{
  "error": {
    "code": "INVALID_PARAMETER",
    "message": "minDuration must be between 1 and 4"
  }
}
```

**Error Codes**

| HTTP | Code              | Description                      |
| ---- | ----------------- | -------------------------------- |
| 400  | INVALID_PARAMETER | query parameter 값이 정책에 맞지 않음 |
| 404  | AREA_NOT_FOUND    | 존재하지 않거나 비활성 지역 ID   |
| 404  | STUDIO_NOT_FOUND  | 존재하지 않거나 비활성 합주실 ID |

## 6. 설계 메모

- `slots`는 검색 결과용 read model이므로 flat 배열로 반환한다.
- flat 구조는 클라이언트가 날짜, 시간, 지역, 합주실 기준으로 자유롭게 그룹핑하기 쉽다.
- 중복되는 `studio`, `room` 정보가 응답 크기 문제를 만들면 `studios`, `rooms`, `slots`를 분리한 normalized response로 바꾼다.
- 응답에는 `status = AVAILABLE` 슬롯만 포함한다. `UNAVAILABLE`/`UNKNOWN`은 반환하지 않는다.
- `scrapedAt`은 슬롯 상태를 마지막으로 확인한 시각으로, **내부 운영용 값이며 사용자 화면에 노출하지 않는다**(의사결정 로그 2026-06-21). 응답에는 포함되지만 신선도/stale 표시 용도로 쓰지 않는다.
- `bookingUrl`은 방 단위 네이버 예약 링크에 해당 슬롯 날짜를 `startDate=YYYY-MM-DD`로 실어 반환한다.
  우선순위는 `room_sources.url` → `booking/{typeId}/bizes/{businessId}/items/{bizItemId}` 재구성 → 합주실 일반 링크 순이다.
  합주실 URL이 `/items/` 없는 bare 포맷이어도 부품으로 재구성하므로 방 단위 링크가 보장된다.
- 기본 정렬은 `date ASC`, `startTime ASC`, `studio.name ASC`, `room.name ASC`이다.
- 초기 API는 페이지네이션 없이 최대 30일 범위를 한 번에 반환한다.
