import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ApiErrorFilter } from './shared/api-error.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new ApiErrorFilter());

  // CORS: 운영 도메인만 허용. CORS_ORIGIN(쉼표 구분)으로 덮어쓸 수 있다.
  // 예: 추가 고정 도메인이 필요하면 Render 환경변수에 CORS_ORIGIN 설정.
  const corsOrigin: (string | RegExp)[] = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : ['https://hapjusil.com', 'https://www.hapjusil.com'];

  // Vercel 프리뷰 배포는 브랜치마다 동적 URL을 받는다
  // (band-practice-room-git-<브랜치>-<해시>-...vercel.app).
  // 프론트 테스트용 프리뷰 도메인을 정규식으로 한 번에 허용한다. CORS_PREVIEW=false 로 끌 수 있다.
  if (process.env.CORS_PREVIEW !== 'false') {
    corsOrigin.push(/^https:\/\/band-practice-room-[a-z0-9-]+\.vercel\.app$/);
  }

  app.enableCors({ origin: corsOrigin });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
