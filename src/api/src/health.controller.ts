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
      await this.database.query('SELECT id FROM areas LIMIT 1');
      return { status: 'ok', database: 'ok' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Database readiness check failed: ${message}`);
      throw new ServiceUnavailableException({ status: 'error', database: 'unavailable' });
    }
  }
}
