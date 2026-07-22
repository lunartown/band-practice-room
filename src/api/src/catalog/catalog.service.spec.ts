import { CatalogService } from './catalog.service.js';

describe('CatalogService', () => {
  it('maps active areas to response shape', async () => {
    const service = new CatalogService({
      findActiveAreas: async () => [{ id: '1', slug: 'hongdae', name: '홍대' }],
    } as never);

    await expect(service.getAreas()).resolves.toEqual({
      areas: [{ id: 1, slug: 'hongdae', name: '홍대' }],
    });
  });

  it('maps studio metadata and nested rooms to camelCase response', async () => {
    const service = new CatalogService({
      findActiveStudios: async () => [
        {
          id: '1',
          slug: 'mapo',
          name: '마포 합주실',
          primary_area_id: '2',
          primary_area_name: '마포',
          area_ids: ['2', '3'],
          address: '서울시 마포구 ...',
          image_url: 'https://img',
          images: ['https://img', 'https://img/2', 'https://img/3'],
          rating: '4.8',
          review_count: 123,
          review_keywords: [{ keyword: '방음', count: 30 }],
          equipment: [{ id: 9, slug: 'microphone', name: '마이크', quantity: 4, note: '유선' }],
          rooms: [
            {
              id: 10,
              name: 'A룸',
              price_per_hour: 22000,
              capacity_min: 2,
              capacity_max: 8,
              equipment: [
                { id: 1, slug: 'drum-kit', name: '드럼 세트', quantity: 1, note: null },
              ],
            },
            {
              id: 11,
              name: 'B룸',
              price_per_hour: null,
              capacity_min: null,
              capacity_max: null,
              equipment: [],
            },
          ],
          has_online_booking: true,
        },
      ],
    } as never);

    await expect(service.getStudios({})).resolves.toEqual({
      studios: [
        {
          id: 1,
          slug: 'mapo',
          name: '마포 합주실',
          primaryAreaId: 2,
          primaryAreaName: '마포',
          areaIds: [2, 3],
          address: '서울시 마포구 ...',
          imageUrl: 'https://img',
          images: ['https://img', 'https://img/2', 'https://img/3'],
          rating: 4.8,
          reviewCount: 123,
          reviewKeywords: [{ keyword: '방음', count: 30 }],
          equipment: [{ id: 9, slug: 'microphone', name: '마이크', quantity: 4, note: '유선' }],
          rooms: [
            {
              id: 10,
              name: 'A룸',
              pricePerHour: 22000,
              capacityMin: 2,
              capacityMax: 8,
              equipment: [{ id: 1, slug: 'drum-kit', name: '드럼 세트', quantity: 1, note: null }],
            },
            {
              id: 11,
              name: 'B룸',
              pricePerHour: null,
              capacityMin: null,
              capacityMax: null,
              equipment: [],
            },
          ],
          hasOnlineBooking: true,
        },
      ],
    });
  });

  it('throws AREA_NOT_FOUND before studio lookup', async () => {
    const service = new CatalogService({
      existsActiveArea: async () => false,
      findActiveStudios: async () => [],
    } as never);

    await expect(service.getStudios({ areaId: 999 })).rejects.toMatchObject({
      code: 'AREA_NOT_FOUND',
    });
  });

  it('maps equipment catalog to response shape', async () => {
    const service = new CatalogService({
      findActiveEquipment: async () => [
        {
          id: '1',
          slug: 'drums',
          name: '드럼',
          items: [
            {
              id: 1,
              slug: 'drum-kit',
              name: '드럼 세트',
              normalized_name: 'drum kit',
              aliases: ['드럼', '드럼셋'],
            },
          ],
        },
      ],
    } as never);

    await expect(service.getEquipment()).resolves.toEqual({
      categories: [
        {
          id: 1,
          slug: 'drums',
          name: '드럼',
          items: [
            {
              id: 1,
              slug: 'drum-kit',
              name: '드럼 세트',
              normalizedName: 'drum kit',
              aliases: ['드럼', '드럼셋'],
            },
          ],
        },
      ],
    });
  });

  it('throws EQUIPMENT_NOT_FOUND when any selected equipment is inactive or missing', async () => {
    const service = new CatalogService({
      countActiveEquipmentByIds: async () => 1,
    } as never);

    await expect(service.assertActiveEquipmentIds([1, 2])).rejects.toMatchObject({
      code: 'EQUIPMENT_NOT_FOUND',
    });
  });
});
