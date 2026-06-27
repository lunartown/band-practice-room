import { Module } from '@nestjs/common';
import { NotificationDispatcher } from './dispatcher.service.js';
import { NotificationsController } from './notifications.controller.js';
import { NotificationsRepository } from './notifications.repository.js';
import { NotificationsService } from './notifications.service.js';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsRepository, NotificationsService, NotificationDispatcher],
  exports: [NotificationDispatcher],
})
export class NotificationsModule {}
