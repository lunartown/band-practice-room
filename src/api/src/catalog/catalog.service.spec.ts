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

  it('throws AREA_NOT_FOUND before studio lookup', async () => {
    const service = new CatalogService({
      existsActiveArea: async () => false,
      findActiveStudios: async () => [],
    } as never);

    await expect(service.getStudios({ areaId: 999 })).rejects.toMatchObject({
      code: 'AREA_NOT_FOUND',
    });
  });
});
