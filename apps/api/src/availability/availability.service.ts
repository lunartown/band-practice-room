import { BadRequestException, Injectable } from '@nestjs/common';
import {
  getTodayInSeoul,
  NaverReservationScraper,
  type ScrapeTarget,
} from '@band-practice-room/scraper';

const defaultTarget: ScrapeTarget = {
  id: 'ground-hongdae-main',
  name: '그라운드합주실 본점',
  sourceUrl: 'https://m.booking.naver.com/booking/10/bizes/1061592',
};

const defaultRoomNames = ['S룸', 'A1', 'A2', 'A3', 'B1', 'B2'];

type GetAvailabilityInput = {
  date?: string;
  roomNames?: string[];
  debug?: boolean;
};

@Injectable()
export class AvailabilityService {
  async getAvailability(input: GetAvailabilityInput) {
    const date = input.date ?? getTodayInSeoul();
    this.assertDate(date);

    const roomNames = input.roomNames?.length ? input.roomNames : defaultRoomNames;
    const scraper = new NaverReservationScraper({
      headless: true,
      debug: input.debug ?? false,
    });

    return scraper.scrape(defaultTarget, date, roomNames);
  }

  private assertDate(date: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new BadRequestException('date must use YYYY-MM-DD format');
    }
  }
}

