import { fetchHourlySchedule } from './client.js';
import { toAvailabilitySlots } from './mapper.js';
import type { RoomScrapeResult, ScrapeTarget, StudioScrapeResult } from './types.js';

export type NaverScraperOptions = {
  debug?: boolean;
};

// 방 사이 호출 간격(가벼운 레이트리밋).
const ROOM_DELAY_MS = 200;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * 네이버 예약 GraphQL API 기반 스크래퍼.
 * 방(bizItem)마다 hourlySchedule 을 한 번씩 호출해 기간 전체 슬롯을 수집한다.
 * (과거의 DOM/Playwright 방식을 대체)
 */
export class NaverReservationScraper {
  private readonly debug: boolean;

  constructor(options: NaverScraperOptions = {}) {
    this.debug = options.debug ?? false;
  }

  async scrape(target: ScrapeTarget, dateFrom: string, dateTo: string): Promise<StudioScrapeResult> {
    const rooms: RoomScrapeResult[] = [];

    for (const room of target.rooms) {
      try {
        const hourly = await fetchHourlySchedule({
          businessId: target.businessId,
          businessTypeId: target.businessTypeId,
          bizItemId: room.bizItemId,
          dateFrom,
          dateTo,
        });
        const slots = toAvailabilitySlots(hourly, room.roomName);
        rooms.push({ roomName: room.roomName, slots });

        if (this.debug) {
          console.debug(
            `[naver] ${target.studioName} / ${room.roomName}: ${slots.length}개 슬롯`,
          );
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        rooms.push({ roomName: room.roomName, slots: [], error: message });
        if (this.debug) {
          console.warn(`[naver] ${target.studioName} / ${room.roomName}: ${message}`);
        }
      }

      await sleep(ROOM_DELAY_MS);
    }

    return { rooms };
  }
}
