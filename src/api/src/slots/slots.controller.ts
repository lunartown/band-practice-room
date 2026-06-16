import { Controller, Get, HttpStatus, Inject, Query } from '@nestjs/common';
import { ApiError } from '../shared/api-error.js';
import {
  parseOptionalPositiveInteger,
  parseOptionalPositiveIntegers,
  parseOptionalTime,
} from '../shared/id.js';
import { parseDates } from './date-range.js';
import { SlotsService } from './slots.service.js';

@Controller('slots')
export class SlotsController {
  constructor(@Inject(SlotsService) private readonly slotsService: SlotsService) {}

  @Get()
  getSlots(
    @Query('dates') datesQuery?: string | string[],
    @Query('areaIds') areaIdsQuery?: string | string[],
    @Query('studioId') studioIdQuery?: string,
    @Query('timeFrom') timeFromQuery?: string,
    @Query('timeTo') timeToQuery?: string,
    @Query('minCapacity') minCapacityQuery?: string,
    @Query('minDuration') minDurationQuery?: string,
  ) {
    const dates = parseDates(datesQuery);
    const areaIds = parseOptionalPositiveIntegers(areaIdsQuery, 'areaIds');
    const studioId = parseOptionalPositiveInteger(studioIdQuery, 'studioId');
    const timeFrom = parseOptionalTime(timeFromQuery, 'timeFrom');
    const timeTo = parseOptionalTime(timeToQuery, 'timeTo');
    const minCapacity = parseOptionalPositiveInteger(minCapacityQuery, 'minCapacity');
    const minDuration = parseOptionalPositiveInteger(minDurationQuery, 'minDuration');

    if (minDuration !== undefined && (minDuration < 1 || minDuration > 4)) {
      throw new ApiError(
        'INVALID_PARAMETER',
        'minDuration must be between 1 and 4',
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.slotsService.getSlots({
      dates,
      areaIds,
      studioId,
      timeFrom,
      timeTo,
      minCapacity,
      minDuration,
    });
  }
}
