import { RefreshController } from './refresh.controller.js';

describe('RefreshController', () => {
  function result() {
    return { dateFrom: '', dateTo: '', refreshed: [], skipped: [], failed: [] };
  }

  it('passes more than 40 studio ids to the refresh service', async () => {
    const refresh = jest.fn().mockResolvedValue(result());
    const controller = new RefreshController({ refresh } as never);
    const studioIds = Array.from({ length: 90 }, (_, idx) => idx + 1);

    await expect(controller.refresh(studioIds)).resolves.toEqual(result());

    expect(refresh).toHaveBeenCalledWith(studioIds);
  });

  it('deduplicates numeric studio ids before calling the service', async () => {
    const refresh = jest.fn().mockResolvedValue(result());
    const controller = new RefreshController({ refresh } as never);

    await controller.refresh([1, '1', 2, '2', 3]);

    expect(refresh).toHaveBeenCalledWith([1, 2, 3]);
  });

  it('rejects invalid studio ids', () => {
    const refresh = jest.fn();
    const controller = new RefreshController({ refresh } as never);

    try {
      controller.refresh([1, 0]);
      throw new Error('expected refresh to throw');
    } catch (error) {
      expect((error as { getResponse: () => unknown }).getResponse()).toEqual({
        error: {
          code: 'INVALID_PARAMETER',
          message: 'studioIds must contain positive integers',
        },
      });
    }
    expect(refresh).not.toHaveBeenCalled();
  });
});
