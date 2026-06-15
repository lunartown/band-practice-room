import { SlotsService } from './slots.service.js';

describe('SlotsService', () => {
  it('validates filters and maps slots to response shape', async () => {
    const findSlots = jest.fn().mockResolvedValue([
      {
        date: '2026-06-15',
        start_time: '09:00:00',
        end_time: '10:00:00',
        status: 'AVAILABLE',
        price: 15000,
        price_source: 'MANUAL',
        scraped_at: new Date('2026-06-15T00:00:00.000Z'),
        booking_url: 'https://booking.example/rooms/a',
        studio_id: '1',
        studio_name: '마포 합주실',
        studio_primary_area_id: '1',
        studio_address: '서울시 마포구',
        room_id: '1',
        room_name: 'A룸',
        room_price_per_hour: 15000,
        room_capacity_min: 2,
        room_capacity_max: 6,
      },
    ]);
    const assertActiveArea = jest.fn().mockResolvedValue(undefined);
    const assertActiveStudio = jest.fn().mockResolvedValue(undefined);

    const service = new SlotsService(
      { findSlots } as never,
      { assertActiveArea, assertActiveStudio } as never,
    );

    await expect(
      service.getSlots({
        dateFrom: '2026-06-15',
        dateTo: '2026-06-15',
        areaId: 1,
        studioId: 1,
      }),
    ).resolves.toEqual({
      dateFrom: '2026-06-15',
      dateTo: '2026-06-15',
      slots: [
        {
          date: '2026-06-15',
          startTime: '09:00',
          endTime: '10:00',
          status: 'AVAILABLE',
          price: 15000,
          priceSource: 'MANUAL',
          scrapedAt: '2026-06-15T00:00:00.000Z',
          studio: {
            id: 1,
            name: '마포 합주실',
            primaryAreaId: 1,
            address: '서울시 마포구',
          },
          room: {
            id: 1,
            name: 'A룸',
            pricePerHour: 15000,
            capacityMin: 2,
            capacityMax: 6,
          },
          bookingUrl: 'https://booking.example/rooms/a',
        },
      ],
    });

    expect(assertActiveArea).toHaveBeenCalledWith(1);
    expect(assertActiveStudio).toHaveBeenCalledWith(1);
    expect(findSlots).toHaveBeenCalledWith({
      dateFrom: '2026-06-15',
      dateTo: '2026-06-15',
      areaId: 1,
      studioId: 1,
    });
  });
});
