import { Controller, Get, Inject, Query } from '@nestjs/common';
import { parseOptionalPositiveInteger } from '../shared/id.js';
import { validateDateRange } from './date-range.js';
import { SlotsService } from './slots.service.js';

@Controller('slots')
export class SlotsController {
  constructor(@Inject(SlotsService) private readonly slotsService: SlotsService) {}

  @Get()
  getSlots(
    @Query('dateFrom') dateFromQuery?: string,
    @Query('dateTo') dateToQuery?: string,
    @Query('areaId') areaIdQuery?: string,
    @Query('studioId') studioIdQuery?: string,
  ) {
    const dateRange = validateDateRange(dateFromQuery, dateToQuery);
    const areaId = parseOptionalPositiveInteger(areaIdQuery, 'areaId');
    const studioId = parseOptionalPositiveInteger(studioIdQuery, 'studioId');

    return this.slotsService.getSlots({
      ...dateRange,
      areaId,
      studioId,
    });
  }
}
