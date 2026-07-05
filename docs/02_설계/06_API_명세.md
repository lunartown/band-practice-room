# API 명세

> 작성일: 2026-06-15 (구현 반영 갱신: 2026-07-05)
> 상태: 구현 반영 — 실제 `src/api` 컨트롤러 기준

## 1. 기본 규칙

- Base URL: `/api/v1`
- 날짜 형식: `YYYY-MM-DD`
- 시간 형식: `HH:mm` (`24:00`은 종료 시각에서만 허용)
- 금액: 정수, 원(KRW) 단위
- 알 수 없는 금액은 `null`로 반환한다.
- 에러 응답: `{ "error": { "code": string, "message": string } }`
- 로그인은 없다. 빈자리 알림은 앱 설치 ID(`installId`)와 FCM 토큰으로 익명 디바이스를 식별한다.

## 2. 엔드포인트 목록

| Method | Path | 설명 |
| --- | --- | --- |
| GET | `/health` | 서버 헬스체크 |
| GET | `/areas` | 지역 목록 조회 |
| GET | `/studios` | 합주실·방 카탈로그 조회 |
| GET | `/slots` | 날짜 범위 슬롯 조회 |
| POST | `/slots/refresh` | 화면에 보이는 합주실 온디맨드 수집 요청 |
| POST | `/notifications/devices` | 푸시 디바이스 등록·갱신 |
| GET | `/notifications/subscriptions` | 내 빈자리 알림 목록 조회 |
| POST | `/notifications/subscriptions` | 빈자리 알림 구독 생성 |
| DELETE | `/notifications/subscriptions/:id` | 빈자리 알림 구독 해지 |
| POST | `/admin/auth/login` | 관리자 로그인 |
| GET | `/admin/overview` | 관리자 요약 |
| GET | `/admin/mapping-issues` | 매핑 이슈 목록 |
| PATCH | `/admin/studio-sources/:id` | 합주실 원본 매핑 수정 |
| POST | `/admin/studio-sources/:id/verify` | 합주실 원본 매핑 검증 |
| PATCH | `/admin/room-sources/:id` | 방 원본 매핑 수정 |
| POST | `/admin/room-sources/:id/verify` | 방 원본 매핑 검증 |
| GET | `/admin/image-issues` | 이미지 이슈 목록 |
| PATCH | `/admin/studios/:id/image` | 합주실 이미지 수정 |
| PATCH | `/admin/studios/:id/status` | 합주실 활성 상태 수정 |
| PATCH | `/admin/rooms/:id/status` | 방 활성 상태 수정 |
| GET | `/admin/audit-logs` | 관리자 작업 로그 조회 |

관리자 API는 `POST /admin/auth/login`을 제외하고 관리자 토큰이 필요하다.

## 3. GET /health

Render Health Check Path에서 사용하는 단순 헬스체크다.

**Response 200**

```json
{ "status": "ok" }
```

## 4. GET /areas

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

## 5. GET /studios

활성화된 합주실 목록을 반환한다. 필터 시트의 합주실 선택 목록과 슬롯 메타 조인에 사용한다.

**Query Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| areaId | number |  | 지역 ID 필터 |

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

`imageUrl`은 수기 입력값(`image_url_manual`)을 우선하고 없으면 수집값(`image_url_scraped`)을 사용한다. `rating`, `reviewCount`는 값이 없으면 `null`이고, `reviewKeywords`는 없으면 `[]`다. `rooms`는 활성 방만 담으며 없으면 `[]`다. 슬롯 응답은 `studioId`·`roomId` 참조만 두므로, 프론트가 이 응답으로 메타데이터를 조인한다.

## 6. GET /slots

날짜 범위와 선택적 지역/합주실 조건으로 예약 가능한 슬롯만 반환한다. 프론트엔드는 응답을 받아 클라이언트에서 시간대·합주실 조건을 즉시 필터링한다.

**Query Parameters**

| Parameter | Type | Description |
| --- | --- | --- |
| dates | string[] | 조회 날짜 목록 (`YYYY-MM-DD` 반복). 미지정 시 서버 기본 범위를 사용한다. |
| areaIds | number[] | 지역 ID 필터 (반복) |
| studioId | number | 합주실 ID 필터 |
| timeWindows | string[] | 시간대 필터. `HH:mm-HH:mm` 형식 반복 (예: `18:00-24:00`) |
| timeFrom | string | 레거시 단일 시작 시각. `timeWindows` 미지정 시 한 윈도우로 흡수 |
| timeTo | string | 레거시 단일 종료 시각 |
| minCapacity | number | 최소 수용 인원 |
| minDuration | number | 최소 연속 가능 시간(시간 단위, 1–4) |

**제약**

- `minDuration`은 1 이상 4 이하다. 벗어나면 `400 INVALID_PARAMETER`.
- `areaIds`는 `studio_areas.area_id` 기준으로 필터링한다.
- `studioId`와 `areaIds`를 함께 보내면 두 조건을 모두 만족하는 슬롯만 반환한다.
- 날짜 범위 정책(양끝 포함 최대 30일, 과거 불가)은 `dates` 파싱 단계에서 검증한다.

**Response 200**

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

`bookingUrl`은 날짜(`startDate`)가 박혀 슬롯마다 다르므로 슬롯에 남긴다. `scrapedAt`은 응답에는 포함되지만 내부 운영용 값이며 사용자 화면 신선도 표시로 쓰지 않는다.

## 7. POST /slots/refresh

당겨서 새로고침에서 화면에 보이는 합주실들의 수집을 온디맨드로 요청한다. 서버 보호를 위해 요청 안에서 전부 수집하지 않고, 오래된 소스 우선으로 제한된 개수만 동기 처리한다.

**Request Body**

```json
{ "studioIds": [1, 2, 3] }
```

- `studioIds`는 양의 정수 배열이어야 한다.
- 요청 payload 상한은 `MANUAL_MAX_REQUEST_STUDIO_IDS`(기본 200)로 제한한다.
- 실제 수집 개수는 `MANUAL_MAX_SOURCES`(기본 6), 전역 동시성은 `MANUAL_SCRAPE_CONCURRENCY`(기본 2)로 제한한다.
- `MANUAL_FRESH_MINUTES` 안에 이미 수집된 소스는 `fresh`, `MANUAL_COOLDOWN_MINUTES` 안에 수동 갱신된 소스는 `cooldown`, 상한 초과분은 `capped`로 건너뛴다.

**Response 200**

```json
{
  "dateFrom": "2026-07-05",
  "dateTo": "2026-07-11",
  "refreshed": [
    { "studioId": 1, "studioName": "그라운드", "sourceCode": "naver", "slots": 12 }
  ],
  "skipped": [
    { "studioId": 2, "sourceCode": "spacecloud", "reason": "fresh" }
  ],
  "failed": [
    { "studioId": 3, "sourceCode": "naver", "error": "매핑된 방이 없습니다(room_sources)" }
  ]
}
```

## 8. Notifications API

빈자리 알림은 네이티브 앱 푸시 토큰을 서버에 등록한 뒤 구독을 저장한다. 신규 앱은 `installId`로 디바이스를 식별하고, FCM/APNs 토큰은 회전 가능한 속성으로 갱신한다. 구버전 호환을 위해 일부 요청은 `deviceToken`도 받는다.

### 8.1 POST /notifications/devices

**Request Body**

```json
{
  "installId": "0f7f3c0e-...",
  "deviceToken": "fcm-token",
  "platform": "ios",
  "appVersion": "1.0.0"
}
```

`platform`은 `ios`, `android`, `web` 중 하나다. `installId`가 있으면 같은 설치의 토큰 회전을 보존한다.

**Response 200/201**

```json
{ "deviceId": 10, "platform": "ios" }
```

### 8.2 POST /notifications/subscriptions

**Request Body**

```json
{
  "installId": "0f7f3c0e-...",
  "studioIds": [1],
  "areaIds": null,
  "dates": ["2026-07-05"],
  "timeWindows": [{ "from": "18:00", "to": "24:00" }],
  "minDuration": 2,
  "minCapacity": 4
}
```

- `installId` 또는 `deviceToken`으로 등록된 디바이스를 찾는다.
- `studioIds`가 있으면 합주실 대상(`scope=studios`), 없고 `areaIds`가 있으면 지역 검색 대상, 둘 다 비면 전체 검색 대상이다.
- `dates`는 필수 배열이다.
- `timeWindows`는 객체 배열이며 비어 있으면 모든 시간이다.
- `minDuration` 기본값은 1이고 1–4만 허용한다.

**Response 200/201**

```json
{
  "id": 123,
  "scope": "studios",
  "studioIds": [1],
  "studios": [{ "id": 1, "name": "그라운드" }],
  "areaIds": [],
  "areas": [],
  "dates": ["2026-07-05"],
  "timeWindows": [{ "from": "18:00", "to": "24:00" }],
  "minDuration": 2,
  "minCapacity": 4,
  "createdAt": "2026-07-05T00:00:00.000Z"
}
```

### 8.3 GET /notifications/subscriptions

**Query Parameters**

| Parameter | Type | Required | Description |
| --- | --- | --- | --- |
| installId | string | 조건부 | 신규 앱의 설치 ID |
| deviceToken | string | 조건부 | 구버전 호환용 디바이스 토큰 |

등록된 디바이스가 없으면 `{ "items": [] }`를 반환한다.

**Response 200**

```json
{ "items": [] }
```

### 8.4 DELETE /notifications/subscriptions/:id

**Request Body**

```json
{ "installId": "0f7f3c0e-..." }
```

본인 디바이스의 구독만 비활성화한다.

**Response 200**

```json
{ "ok": true }
```

현재 수정 API는 따로 없으며, 프론트는 새 구독을 먼저 만든 뒤 기존 구독을 삭제하는 방식으로 수정 UX를 구현한다.

## 9. Admin API

관리자 API는 운영자가 원본 매핑·이미지·활성 상태를 직접 보정하기 위한 내부 API다. 공개 사용자 화면 계약이 아니므로 상세 응답 스키마는 `src/api/src/admin` 구현을 기준으로 한다.

- 로그인: `POST /api/v1/admin/auth/login`
- 보호된 API: `Authorization` 헤더의 관리자 토큰 필요
- 주요 작업: 매핑 이슈 확인, studio/room source 보정 및 검증, 이미지 이슈 확인, studio/room 활성 상태 변경, audit log 조회

## 10. Error Codes

| HTTP | Code | Description |
| --- | --- | --- |
| 400 | INVALID_BODY | 요청 본문 형식이 객체가 아님 |
| 400 | INVALID_PARAMETER | query/body 값이 정책에 맞지 않음 |
| 401 | UNAUTHORIZED | 관리자 인증 실패 |
| 404 | AREA_NOT_FOUND | 존재하지 않거나 비활성 지역 ID |
| 404 | STUDIO_NOT_FOUND | 존재하지 않거나 비활성 합주실 ID |
| 404 | DEVICE_NOT_FOUND | 알림 구독 전에 디바이스가 등록되지 않음 |
| 404 | SUBSCRIPTION_NOT_FOUND | 본인 디바이스의 알림 구독을 찾을 수 없음 |

## 11. 설계 메모

- `slots`는 검색 결과용 read model이므로 flat 배열로 반환한다.
- 합주실·방 메타데이터는 `GET /studios`로 분리해 슬롯 응답 중복을 줄인다.
- 응답에는 `status = AVAILABLE` 슬롯만 포함한다. `UNAVAILABLE`/`UNKNOWN`은 반환하지 않는다.
- `bookingUrl`은 방 단위 예약 링크에 해당 슬롯 날짜를 `startDate=YYYY-MM-DD`로 실어 반환한다.
- 기본 정렬은 `date ASC`, `startTime ASC`, `studio.name ASC`, `room.name ASC`이다.
- 검색 API는 최대 30일 범위를 한 번에 반환한다.
- 빈자리 푸시는 `slot_available_events` 큐를 dispatcher가 소비해 FCM으로 발송한다. 같은 구독·방·날짜·시각 조합은 `notification_deliveries` 유니크 제약으로 중복 발송을 막는다.
