# System Overview

## Components

- API Server: NestJS 기반 조회 API
- Scraper Package: Playwright 기반 예약 페이지 수집기
- Database: PostgreSQL
- Scheduler: 주기적으로 오늘/내일 데이터를 수집하는 작업

## Data Flow

```txt
Naver Reservation Page
  -> Playwright Scraper
  -> Availability Parser
  -> PostgreSQL
  -> NestJS API
  -> Client
```

## Initial Strategy

사용자 요청마다 실시간 스크래핑하지 않고, 주기적으로 수집한 데이터를 DB에서 조회합니다.

