import { Module } from '@nestjs/common';
import { AvailabilityModule } from './availability/availability.module.js';
import { HealthController } from './health.controller.js';

@Module({
  imports: [AvailabilityModule],
  controllers: [HealthController],
})
export class AppModule {}

