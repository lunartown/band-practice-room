// 단독 실행 진입점: 변동 이벤트를 구독과 매칭해 푸시를 보낸다.
// 스크래퍼가 슬롯을 갱신한 직후(또는 별도 cron)에 `tsx src/notifications/dispatch.ts` 로 돈다.
// HTTP 서버를 띄우지 않고 Nest 애플리케이션 컨텍스트만 만들어 DI 로 dispatcher 를 꺼낸다.
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module.js';
import { NotificationDispatcher } from './dispatcher.service.js';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, { logger: ['log', 'error', 'warn'] });
  try {
    const dispatcher = app.get(NotificationDispatcher);
    const summary = await dispatcher.dispatch();
    console.log('[notify] ', JSON.stringify(summary));
  } finally {
    await app.close();
  }
}

main().catch((err) => {
  console.error('[notify] 실패:', err);
  process.exit(1);
});
