import { Controller, Get, Inject, Query } from '@nestjs/common';
import { parseOptionalPositiveInteger } from '../shared/id.js';
import { CatalogService } from './catalog.service.js';

@Controller()
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalogService: CatalogService) {}

  @Get('areas')
  getAreas() {
    return this.catalogService.getAreas();
  }

  @Get('studios')
  getStudios(@Query('areaId') areaIdQuery?: string) {
    const areaId = parseOptionalPositiveInteger(areaIdQuery, 'areaId');
    return this.catalogService.getStudios({ areaId });
  }
}
