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
        room_id: '1',
      },
    ]);
    const assertActiveStudio = jest.fn().mockResolvedValue(undefined);

    const service = new SlotsService(
      { findSlots } as never,
      { assertActiveStudio } as never,
    );

    const dates = ['2026-06-15'];
    await expect(
      service.getSlots({ dates, studioId: 1 }),
    ).resolves.toEqual({
      dates,
      slots: [
        {
          date: '2026-06-15',
          startTime: '09:00',
          endTime: '10:00',
          status: 'AVAILABLE',
          price: 15000,
          priceSource: 'MANUAL',
          scrapedAt: '2026-06-15T00:00:00.000Z',
          studioId: 1,
          roomId: 1,
          bookingUrl: 'https://booking.example/rooms/a',
        },
      ],
    });

    expect(assertActiveStudio).toHaveBeenCalledWith(1);
    expect(findSlots).toHaveBeenCalledWith({ dates, studioId: 1 });
  });
});
