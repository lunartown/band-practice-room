# 합주실 API (NestJS) 프로덕션 이미지
# Railway에서 서비스 Root Directory를 src/api 로 설정해 빌드한다.
FROM node:22-alpine

WORKDIR /app

# 1) 의존성 (런타임에 tsx 로 실행하므로 dev 의존성은 제외)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# 2) 소스 + 마이그레이션/시드 SQL
COPY tsconfig.json ./
COPY src ./src
COPY db ./db

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

# 기동 시 마이그레이션(멱등)만 실행 후 서버 시작.
# 시드는 002_studios.sql 이 slots 까지 TRUNCATE 하므로 콜드스타트마다 돌리면 안 된다.
# 시드/스크랩은 GitHub Actions 워크플로(.github/workflows/scrape.yml)에서 담당한다.
CMD ["sh", "-c", "npm run db:migrate && npm run start"]
