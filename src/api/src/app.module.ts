import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { DatabaseModule } from './database/database.module.js';
import { HealthController } from './health.controller.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { RefreshModule } from './refresh/refresh.module.js';
import { SlotsModule } from './slots/slots.module.js';

@Module({
  imports: [DatabaseModule, CatalogModule, SlotsModule, RefreshModule, AdminModule, NotificationsModule],
  controllers: [HealthController],
})
export class AppModule {}
