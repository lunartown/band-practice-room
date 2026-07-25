import { Controller, Get, Inject, Logger, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './database/database.service.js';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(@Inject(DatabaseService) private readonly database: DatabaseService) {}

  @Get()
  getHealth() {
    return { status: 'ok' };
  }

  @Get('ready')
  async getReadiness() {
    try {
      // 실제 카탈로그 조회와 같은 테이블을 읽어 연결과 스키마를 함께 확인한다.
      await this.database.query('SELECT id FROM areas LIMIT 1');
      return { status: 'ok', database: 'ok' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Database readiness check failed: ${message}`);
      throw new ServiceUnavailableException({ status: 'error', database: 'unavailable' });
    }
  }
}
