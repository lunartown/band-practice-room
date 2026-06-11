import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

const defaultPort = 3000;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.PORT ?? defaultPort);

  app.enableCors();

  await app.listen(port);
  console.log(`API server listening on http://localhost:${port}`);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

