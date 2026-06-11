# Local Setup

아직 코드 생성 전 단계입니다.

## Planned Stack

- Node.js 20+
- TypeScript
- NestJS
- PostgreSQL
- Playwright

## Commands

```bash
npm install
docker compose up -d postgres
npm run db:migrate
npm run api:dev
npm run api:typecheck
npm run scraper:typecheck
```

## Local API

```txt
GET http://localhost:3000/health
GET http://localhost:3000/availability?date=2026-06-13&rooms=S룸,A1
POST http://localhost:3000/availability/scrape?date=2026-06-13&rooms=S룸,A1
```
