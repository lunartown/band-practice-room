# Scraper Package

Playwright 기반 예약 페이지 스크래퍼가 위치할 패키지입니다.

## PoC

```bash
npm run scraper:naver:poc
```

환경 변수:

```bash
NAVER_BOOKING_URL=https://m.booking.naver.com/booking/10/bizes/1061592
TARGET_DATE=2026-06-12
HEADLESS=false
```

## Planned Structure

```txt
src/
  naver-reservation/
    naver-reservation.scraper.ts
    naver-reservation.parser.ts
  types.ts
```
