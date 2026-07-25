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

# 마이그레이션은 Render의 preDeployCommand에서 배포 전에 실행한다.
# 컨테이너가 시작될 때 DB 작업을 기다리지 않아 재시작 중에도 포트를 빠르게 연다.
# 전체 시드(db:seed)는 studios·slots를 TRUNCATE 하므로 콜드스타트마다 실행하지 않고,
# 비주얼 시드와 함께 GitHub Actions 또는 별도 운영 작업으로 실행한다.
CMD ["npm", "run", "start"]
