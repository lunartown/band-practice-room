# API App

NestJS API 서버가 위치할 앱입니다.

## Run

```bash
npm run api:dev
```

## Endpoints

```txt
GET /health
GET /availability?date=2026-06-13&rooms=S룸,A1
```

`/availability`는 현재 그라운드합주실 본점 네이버 예약 페이지를 실시간 스크래핑해서 반환합니다. DB 저장은 다음 단계입니다.

## Planned Modules

- practice-rooms
- rooms
- availability
- scrapers
- health
