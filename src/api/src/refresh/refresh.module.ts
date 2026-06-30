import { Module } from '@nestjs/common';
import { RefreshController } from './refresh.controller.js';
import { RefreshRepository } from './refresh.repository.js';
import { RefreshService } from './refresh.service.js';

@Module({
  controllers: [RefreshController],
  providers: [RefreshRepository, RefreshService],
})
export class RefreshModule {}
