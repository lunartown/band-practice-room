# Hapjusil API

합주실 예약 가능 시간 조회 API. ORM 없이 SQL을 직접 작성한다(쿼리는 repository 계층).
seed 데이터로 합주실·매핑을 채우고, 실제 `slots`는 스크래퍼(`src/scraper`)가 네이버·스페이스클라우드에서 수집한다.

## 실행

```sh
# 저장소 루트에서 로컬 PostgreSQL 기동
docker compose up -d postgres

cd src/api
npm install
npm run db:migrate   # 마이그레이션 (idempotent)
npm run db:seed      # 합주실 시드 + 매핑 (slots TRUNCATE 후 재생성)
npm run dev          # tsx watch
```

## API

- `GET /api/v1/health`
- `GET /api/v1/areas`
- `GET /api/v1/studios?areaId=1`
- `GET /api/v1/slots?dates=2026-06-15&dates=2026-06-16`

슬롯 조회의 전체 파라미터(`dates`, `areaIds`, `studioId`, `timeWindows`, `minCapacity`, `minDuration` 등)는
[API 명세](../../docs/02_설계/06_API_명세.md) 참고.

로컬 Docker PostgreSQL은 호스트 `15432` 포트를 사용한다.
