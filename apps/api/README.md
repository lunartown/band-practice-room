# API App

NestJS API 서버가 위치할 앱입니다.

## Run

```bash
npm run db:migrate
npm run api:dev
```

## Endpoints

```txt
GET /health
GET /availability?date=2026-06-13&rooms=S룸,A1
POST /availability/scrape?date=2026-06-13&rooms=S룸,A1
```

`POST /availability/scrape`는 현재 그라운드합주실 본점 네이버 예약 페이지를 실시간 스크래핑한 뒤 PostgreSQL에 저장합니다.

`GET /availability`는 저장된 예약 가능 시간대를 조회합니다.

## Planned Modules

- practice-rooms
- rooms
- availability
- scrapers
- health
