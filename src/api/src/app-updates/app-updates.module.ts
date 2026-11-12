import { Module } from '@nestjs/common';
import { AppUpdatesController } from './app-updates.controller.js';
import { AppUpdatesRepository } from './app-updates.repository.js';
import { AppUpdatesService } from './app-updates.service.js';

@Module({
  controllers: [AppUpdatesController],
  providers: [AppUpdatesRepository, AppUpdatesService],
})
export class AppUpdatesModule {}
