import { Module } from '@nestjs/common';
import { CatalogModule } from '../catalog/catalog.module.js';
import { SlotsController } from './slots.controller.js';
import { SlotsRepository } from './slots.repository.js';
import { SlotsService } from './slots.service.js';

@Module({
  imports: [CatalogModule],
  controllers: [SlotsController],
  providers: [SlotsRepository, SlotsService],
})
export class SlotsModule {}
