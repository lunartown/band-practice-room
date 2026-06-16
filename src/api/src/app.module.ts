import { Module } from '@nestjs/common';
import { CatalogModule } from './catalog/catalog.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health.controller.js';
import { SlotsModule } from './slots/slots.module.js';

@Module({
  imports: [DatabaseModule, CatalogModule, SlotsModule],
  controllers: [HealthController],
})
export class AppModule {}
