import type { RoomScrapeResult, StudioScraper, StudioScrapeResult } from '../types.js';
import { fetchMonthlyPrices } from './client.js';
import { toAvailabilitySlots } from './mapper.js';
import type { SpaceCloudScrapeTarget } from './types.js';

export type SpaceCloudScraperOptions = {
  debug?: boolean;
};

// 호출 간격(가벼운 레이트리밋).
const CALL_DELAY_MS = 200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// [dateFrom, dateTo] 가 걸치는 (year, month) 목록. 보통 1~2개.
function monthsInRange(dateFrom: string, dateTo: string): Array<{ year: number; month: number }> {
  const [fy, fm] = dateFrom.split('-').map(Number);
  const [ty, tm] = dateTo.split('-').map(Number);
  const months: Array<{ year: number; month: number }> = [];
  let y = fy;
  let m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    months.push({ year: y, month: m });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  return months;
}

/**
 * 스페이스클라우드 가용성 스크래퍼.
 * 방(product)마다 기간이 걸친 달 수만큼 prices 를 호출해 기간 전체 슬롯을 모은다.
 */
export class SpaceCloudScraper implements StudioScraper {
  private readonly debug: boolean;

  constructor(
    private readonly target: SpaceCloudScrapeTarget,
    options: SpaceCloudScraperOptions = {},
  ) {
    this.debug = options.debug ?? false;
  }

  async scrape(dateFrom: string, dateTo: string): Promise<StudioScrapeResult> {
    const months = monthsInRange(dateFrom, dateTo);
    const rooms: RoomScrapeResult[] = [];

    for (const room of this.target.rooms) {
      try {
        const slots = [];
        for (const { year, month } of months) {
          const res = await fetchMonthlyPrices({
            productId: room.productId,
            reservationTypeId: room.reservationTypeId,
            year,
            month,
          });
          slots.push(...toAvailabilitySlots(res.days ?? [], room.roomName, dateFrom, dateTo));
          await sleep(CALL_DELAY_MS);
        }
        rooms.push({ roomName: room.roomName, slots });

        if (this.debug) {
          console.debug(
            `[spacecloud] ${this.target.studioName} / ${room.roomName}: ${slots.length}개 슬롯`,
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        rooms.push({ roomName: room.roomName, slots: [], error: message });
        if (this.debug) {
          console.warn(`[spacecloud] ${this.target.studioName} / ${room.roomName}: ${message}`);
        }
      }
    }

    return { rooms };
  }
}
