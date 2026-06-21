import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ApiErrorFilter } from './shared/api-error.filter.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new ApiErrorFilter());

  // CORS: 운영 도메인만 허용. CORS_ORIGIN(쉼표 구분)으로 덮어쓸 수 있다.
  // 예: 프리뷰 도메인 추가가 필요하면 Render 환경변수에 CORS_ORIGIN 설정.
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean)
    : ['https://hapjusil.com', 'https://www.hapjusil.com'];
  app.enableCors({ origin: corsOrigin });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
