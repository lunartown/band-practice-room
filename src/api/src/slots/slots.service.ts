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
      studio: {
        id: Number(slot.studio_id),
        name: slot.studio_name,
        primaryAreaId:
          slot.studio_primary_area_id === null ? null : Number(slot.studio_primary_area_id),
        primaryAreaName: slot.studio_primary_area_name,
        address: slot.studio_address,
        imageUrl: slot.studio_image_url ?? null,
        rating: slot.studio_rating == null ? null : Number(slot.studio_rating),
        reviewCount: slot.studio_review_count ?? null,
        reviewKeywords: slot.studio_review_keywords ?? [],
      },
      room: {
        id: Number(slot.room_id),
        name: slot.room_name,
        pricePerHour: slot.room_price_per_hour,
        capacityMin: slot.room_capacity_min,
        capacityMax: slot.room_capacity_max,
      },
      bookingUrl: slot.booking_url,
    };
  }
}
