# Hapjusil API

스크래핑 없이 seed 데이터 기반으로 1차 조회 API를 제공한다.

## 실행

```sh
source ~/.nvm/nvm.sh
npm install
cd ../..
docker compose up -d postgres
cd apps/api
npm run db:migrate
npm run db:seed
npm run dev
```

## API

- `GET /api/v1/health`
- `GET /api/v1/areas`
- `GET /api/v1/studios?areaId=1`
- `GET /api/v1/slots?dateFrom=2026-06-15&dateTo=2026-07-14`

로컬 Docker PostgreSQL은 호스트 `15432` 포트를 사용한다.
