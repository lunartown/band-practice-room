import { Module } from '@nestjs/common';
import { AvailabilityModule } from './availability/availability.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [DatabaseModule, AvailabilityModule],
  controllers: [HealthController],
})
export class AppModule {}
