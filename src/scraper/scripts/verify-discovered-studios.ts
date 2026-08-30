/**
 * discover-nationwide-studios.ts 결과의 네이버 예약 상품과 시간표를 검증한다.
 * 운영 DB는 변경하지 않으며 `_local/nationwide-studio-verified.json`을 만든다.
 *
 * 실행:
 *   cd src/scraper
 *   npx tsx scripts/verify-discovered-studios.ts
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fetchBizItems, fetchHourlySchedule } from '../../scrape-core/naver/client.js';

type Candidate = {
  placeId: string;
  name: string;
  address: string;
  commonAddress: string;
  category: string;
  bookingUrl: string | null;
  bookingBusinessId: string | null;
  hasBooking: boolean;
  imageUrl: string | null;
  menus: string[];
  visitorReviewCount: number;
  blogCafeReviewCount: number;
  matchedQueries: string[];
};

type VerifiedItem = {
  bizItemId: string;
  name: string;
  bookingTimeUnitCode: string;
  scheduleUnits: number;
  saleUnits: number;
  minPrice: number | null;
  durationMinutes: number | null;
};

type VerifiedCandidate = Candidate & {
  businessTypeId: number;
  businessId: string;
  businessSignal: boolean;
  itemSignal: boolean;
  scheduleSignal: boolean;
  eligible: boolean;
  items: VerifiedItem[];
  error: string | null;
};

const REPO_ROOT = resolve(import.meta.dirname, '../../..');
const INPUT_PATH = resolve(REPO_ROOT, '_local/nationwide-studio-discovery.json');
const OUTPUT_PATH = resolve(REPO_ROOT, '_local/nationwide-studio-verified.json');
const DELAY_MS = 180;

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function kstDate(offsetDays: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3_600_000 + offsetDays * 86_400_000);
  return kst.toISOString().slice(0, 10);
}

function parseBookingUrl(url: string | null): { businessTypeId: number; businessId: string } | null {
  const match = url?.match(/\/booking\/(\d+)\/bizes\/(\d+)/);
  return match ? { businessTypeId: Number(match[1]), businessId: match[2] } : null;
}

function hasBandSignal(text: string): boolean {
  return /합주|밴드|rehearsal/i.test(text);
}

function minPositive(values: number[]): number | null {
  const positive = values.filter((value) => Number.isFinite(value) && value > 0);
  return positive.length ? Math.min(...positive) : null;
}

async function verify(candidate: Candidate): Promise<VerifiedCandidate | null> {
  const booking = parseBookingUrl(candidate.bookingUrl);
  if (!candidate.hasBooking || !booking) return null;

  const base = {
    ...candidate,
    ...booking,
    businessSignal: hasBandSignal([candidate.name, ...candidate.menus].join(' ')),
    itemSignal: false,
    scheduleSignal: false,
    eligible: false,
    items: [] as VerifiedItem[],
    error: null as string | null,
  };

  try {
    const bizItems = await fetchBizItems(booking);
    for (const item of bizItems) {
      let scheduleUnits = 0;
      let saleUnits = 0;
      let minPrice: number | null = null;
      let durationMinutes: number | null = null;
      try {
        const schedule = await fetchHourlySchedule({
          ...booking,
          bizItemId: item.bizItemId,
          dateFrom: kstDate(0),
          dateTo: kstDate(6),
        });
        scheduleUnits = schedule.length;
        saleUnits = schedule.filter((unit) => unit.isUnitSaleDay).length;
        minPrice = minPositive(
          schedule.flatMap((unit) => unit.prices ?? []).map((price) => Number(price.price)),
        );
        durationMinutes = minPositive(schedule.map((unit) => Number(unit.duration)));
      } catch {
        // 상품 하나의 조회 실패가 사업장 전체 검증을 막지 않게 한다.
      }
      base.items.push({
        bizItemId: item.bizItemId,
        name: item.name,
        bookingTimeUnitCode: item.bookingTimeUnitCode,
        scheduleUnits,
        saleUnits,
        minPrice,
        durationMinutes,
      });
      await sleep(DELAY_MS);
    }
    base.itemSignal = base.items.some((item) => hasBandSignal(item.name));
    base.scheduleSignal = base.items.some((item) => item.scheduleUnits > 0);
    base.eligible = (base.businessSignal || base.itemSignal) && base.scheduleSignal;
  } catch (error) {
    base.error = error instanceof Error ? error.message : String(error);
  }
  return base;
}

async function main(): Promise<void> {
  const discovery = JSON.parse(await readFile(INPUT_PATH, 'utf8')) as { candidates: Candidate[] };
  const targets = discovery.candidates.filter((candidate) => candidate.hasBooking && candidate.bookingUrl);
  const verified: VerifiedCandidate[] = [];
  let failed = 0;

  for (const candidate of targets) {
    const result = await verify(candidate);
    if (!result) continue;
    verified.push(result);
    if (result.error) failed++;
    if (verified.length % 10 === 0 || verified.length === targets.length) {
      const eligible = verified.filter((item) => item.eligible).length;
      console.log(`[verify] ${verified.length}/${targets.length}, 적격 ${eligible}곳, 실패 ${failed}`);
      await writeFile(
        OUTPUT_PATH,
        `${JSON.stringify({ generatedAt: new Date().toISOString(), failed, candidates: verified }, null, 2)}\n`,
      );
    }
  }

  console.log(`[verify] 완료: ${OUTPUT_PATH}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
