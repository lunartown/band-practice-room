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

# tsx 로 직접 기동 (package.json 의 start 스크립트와 동일)
CMD ["npm", "run", "start"]
