import { Inject, Injectable } from '@nestjs/common';
import { CatalogService } from '../catalog/catalog.service.js';
import { formatTime, toIsoString } from '../shared/time.js';
import { SlotFilters, SlotRow, SlotsRepository } from './slots.repository.js';

@Injectable()
export class SlotsService {
  constructor(
    @Inject(SlotsRepository)
    private readonly slotsRepository: SlotsRepository,
    @Inject(CatalogService)
    private readonly catalogService: CatalogService,
  ) {}

  async getSlots(filters: SlotFilters) {
    if (filters.studioId !== undefined) {
      await this.catalogService.assertActiveStudio(filters.studioId);
    }

    const slots = await this.slotsRepository.findSlots(filters);

    return {
      dates: filters.dates,
      slots: slots.map((slot) => this.toSlotResponse(slot)),
    };
  }

  private toSlotResponse(slot: SlotRow) {
    return {
      date: slot.date,
      startTime: formatTime(slot.start_time),
      endTime: formatTime(slot.end_time),
      status: slot.status,
      price: slot.price,
      priceSource: slot.price_source,
      scrapedAt: toIsoString(slot.scraped_at),
      // 합주실·방 메타는 슬롯마다 싣지 않는다. 클라이언트가 studios 카탈로그로
      // studioId·roomId 를 조인해 메타를 채운다(egress 절감).
      studioId: Number(slot.studio_id),
      roomId: Number(slot.room_id),
      bookingUrl: slot.booking_url,
    };
  }
}
