import { getTodayInSeoul } from './naver-reservation/date.js';
import { NaverReservationScraper } from './naver-reservation/naver-reservation.scraper.js';
import type { ScrapeTarget } from './naver-reservation/types.js';

const defaultTarget: ScrapeTarget = {
  id: 'ground-hongdae-main',
  name: '그라운드합주실 본점',
  sourceUrl: 'https://m.booking.naver.com/booking/10/bizes/1061592',
};

const target: ScrapeTarget = {
  ...defaultTarget,
  sourceUrl: process.env.NAVER_BOOKING_URL ?? defaultTarget.sourceUrl,
};

const targetDate = process.env.TARGET_DATE ?? getTodayInSeoul();
const roomNames = (process.env.ROOM_NAMES ?? process.env.ROOM_NAME ?? 'S룸,A1,A2,A3,B1,B2')
  .split(',')
  .map((roomName) => roomName.trim())
  .filter(Boolean);
const headless = process.env.HEADLESS !== 'false';
const debug = process.env.DEBUG === 'true';

async function main() {
  const scraper = new NaverReservationScraper({ headless, debug });
  const result = await scraper.scrape(target, targetDate, roomNames);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

