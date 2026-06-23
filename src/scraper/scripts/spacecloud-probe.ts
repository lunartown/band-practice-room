/**
 * 스페이스클라우드 가용성 API 를 라이브로 찔러보고 슬롯 변환까지 검증하는 도구.
 * (이 레포 원격 환경은 아웃바운드가 막혀 있어 동작 검증은 네트워크가 열린 곳에서 실행해야 한다)
 *
 * 하는 일:
 *   1) /products/{productId}/prices 를 오늘 기준 7일이 걸친 달만큼 호출
 *   2) mapper 로 우리 슬롯 모델 변환
 *   3) 날짜별 available 슬롯 수를 출력 (매핑/파싱이 맞는지 눈으로 확인)
 *
 * 사용:
 *   cd src/scraper
 *   SPACECLOUD_API_TOKEN='<JWT>' npx tsx scripts/spacecloud-probe.ts \
 *     --product 116331 --reservation-type 203716 [--days 7]
 *
 * 토큰 없이도 200 이 오면 인증 불필요라는 뜻(그대로 두면 됨).
 */
import { SpaceCloudScraper } from '../src/spacecloud/scraper.js';

function arg(flag: string, fallback?: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : fallback;
}

function kstToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const productId = arg('--product', '116331')!;
const reservationTypeId = arg('--reservation-type', '203716')!;
const span = Number(arg('--days', '7'));

const dateFrom = kstToday();
const dateTo = addDays(dateFrom, span - 1);

console.log(
  `[probe] product=${productId} reservationType=${reservationTypeId} ` +
    `range=${dateFrom}~${dateTo} token=${process.env.SPACECLOUD_API_TOKEN ? '있음' : '없음'}`,
);

const scraper = new SpaceCloudScraper(
  { studioName: 'probe', rooms: [{ roomName: 'probe-room', productId, reservationTypeId }] },
  { debug: true },
);

const result = await scraper.scrape(dateFrom, dateTo);
for (const room of result.rooms) {
  if (room.error) {
    console.error(`[probe] 실패: ${room.error}`);
    continue;
  }
  const byDate = new Map<string, { total: number; available: number }>();
  for (const s of room.slots) {
    const cur = byDate.get(s.date) ?? { total: 0, available: 0 };
    cur.total += 1;
    if (s.status === 'available') cur.available += 1;
    byDate.set(s.date, cur);
  }
  console.log(`[probe] ${room.slots.length}개 슬롯`);
  for (const [date, c] of [...byDate.entries()].sort()) {
    console.log(`  ${date}: available ${c.available}/${c.total}`);
  }
}
