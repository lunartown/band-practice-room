import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module.js';
import { AdminAuthService } from './admin-auth.service.js';
import { AdminController } from './admin.controller.js';
import { AdminGuard } from './admin.guard.js';
import { AdminRepository } from './admin.repository.js';
import { AdminService } from './admin.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController],
  providers: [AdminAuthService, AdminGuard, AdminRepository, AdminService],
})
export class AdminModule {}
