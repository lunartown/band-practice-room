# Scraper Package

Playwright 기반 예약 페이지 스크래퍼가 위치할 패키지입니다.

## PoC

```bash
npm run scraper:naver:poc
```

기본값은 그라운드합주실 본점의 `S룸,A1,A2,A3,B1,B2`를 오늘 날짜 기준으로 조회합니다.

환경 변수:

```bash
NAVER_BOOKING_URL=https://m.booking.naver.com/booking/10/bizes/1061592
TARGET_DATE=2026-06-12
ROOM_NAMES=S룸,A1,A2
ROOM_NAME=S룸
HEADLESS=false
DEBUG=true
```

## Structure

```txt
src/
  prototype-naver.ts
  naver-reservation/
    date.ts
    naver-reservation.scraper.ts
    naver-reservation.parser.ts
    types.ts
```

## Output

```json
{
  "practiceRoomName": "그라운드합주실 본점",
  "sourceUrl": "https://m.booking.naver.com/booking/10/bizes/1061592",
  "date": "2026-06-13",
  "rooms": [
    {
      "name": "S룸",
      "availableSlots": [
        {
          "roomName": "S룸",
          "date": "2026-06-13",
          "startTime": "09:00",
          "endTime": "10:00",
          "status": "available"
        }
      ]
    }
  ]
}
```

## Current Parsing Rule

네이버 예약 시간 버튼의 `btn_time color*` 클래스를 예약 가능 상태로 판단합니다. `btn_time`만 있고 `color*`가 없으면 현재 PoC에서는 예약 불가로 봅니다.
