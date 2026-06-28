# 합주실 API (NestJS) 프로덕션 이미지
#
# 빌드 컨텍스트는 레포 루트(render.yaml 의 dockerContext: .).
# API(src/api)와 공유 수집 모듈(src/scrape-core)을 함께 담는다 —
# 수동 갱신(온디맨드 스크랩)이 scrape-core 를 import 하므로 이미지에 포함되어야 하고,
# 디렉터리 구조를 그대로 보존해 상대 import 경로(../../../scrape-core)가
# 로컬·프로덕션에서 동일하게 동작하게 한다.
FROM node:22-alpine

WORKDIR /app/src/api

# 1) 의존성 (런타임에 tsx 로 실행하므로 dev 의존성은 제외)
COPY src/api/package.json src/api/package-lock.json ./
RUN npm ci --omit=dev

# 2) API 소스 + 마이그레이션/시드 SQL
COPY src/api/tsconfig.json ./
COPY src/api/src ./src
COPY src/api/db ./db

# 3) 공유 수집 모듈 (cron 워커와 같은 위치로 보존)
COPY src/scrape-core /app/src/scrape-core

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# 기동 시 마이그레이션(멱등)만 실행 후 서버 시작.
# 시드는 002_studios.sql 이 slots 까지 TRUNCATE 하므로 콜드스타트마다 돌리면 안 된다.
# 시드/스크랩은 GitHub Actions 워크플로(.github/workflows/scrape.yml)에서 담당한다.
CMD ["sh", "-c", "npm run db:migrate && npm run start"]
