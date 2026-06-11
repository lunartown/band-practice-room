import { Controller, Get, Inject, Query } from '@nestjs/common';
import { AvailabilityService } from './availability.service.js';

@Controller('availability')
export class AvailabilityController {
  constructor(
    @Inject(AvailabilityService)
    private readonly availabilityService: AvailabilityService,
  ) {}

  @Get()
  getAvailability(
    @Query('date') date?: string,
    @Query('rooms') rooms?: string,
    @Query('debug') debug?: string,
  ) {
    const roomNames = rooms
      ?.split(',')
      .map((roomName) => roomName.trim())
      .filter(Boolean);

    return this.availabilityService.getAvailability({
      date,
      roomNames,
      debug: debug === 'true',
    });
  }
}
