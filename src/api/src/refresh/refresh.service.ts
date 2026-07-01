import { Inject, Injectable, Logger } from '@nestjs/common';
import { buildStudioScraper } from '../../../scrape-core/build.js';
import { RefreshRepository, RefreshTargetRow } from './refresh.repository.js';

// 신선도 게이트: 이 소스의 최신 slots.scraped_at 이 이 시간 이내면 "이미 최신"으로 보고 스킵.
const FRESH_MINUTES = Math.max(1, Math.floor(Number(process.env.MANUAL_FRESH_MINUTES) || 10));
// 쿨다운: 같은 소스를 직전 수동 갱신한 지 이 시간 이내면 스킵(연타·남용 방지).
const COOLDOWN_MINUTES = Math.max(1, Math.floor(Number(process.env.MANUAL_COOLDOWN_MINUTES) || 5));
// 한 요청에서 실제 스크랩할 소스 최대 개수(무료 dyno 보호).
const MAX_SOURCES = Math.max(1, Math.floor(Number(process.env.MANUAL_MAX_SOURCES) || 6));
// 전역 동시 스크랩 상한(모든 요청 합산). 외부 사이트 과부하·차단과 dyno 부하를 막는다.
const CONCURRENCY = Math.max(1, Math.floor(Number(process.env.MANUAL_SCRAPE_CONCURRENCY) || 2));
// 소스 1건 스크랩 타임아웃(ms). 넘으면 실패로 처리하고 응답을 막지 않는다.
const TIMEOUT_MS = Math.max(1000, Math.floor(Number(process.env.MANUAL_SCRAPE_TIMEOUT_MS) || 20000));
// 수집 날짜 범위(오늘 포함 N일). cron 워커(JOB_DATE_SPAN_DAYS)와 맞춰 데이터 일관성 유지.
const DATE_SPAN_DAYS = 6;

export type SkipReason = 'fresh' | 'cooldown' | 'capped';

export interface RefreshSkipped {
  studioId: number;
  sourceCode: string;
  reason: SkipReason;
}

export interface RefreshResult {
  dateFrom: string;
  dateTo: string;
  refreshed: Array<{ studioId: number; studioName: string; sourceCode: string; slots: number }>;
  skipped: RefreshSkipped[];
  failed: Array<{ studioId: number; sourceCode: string; error: string }>;
}

interface RefreshPlanOptions {
  now: number;
  freshMs: number;
  cooldownMs: number;
  maxSources: number;
}

export interface RefreshPlan {
  toScrape: RefreshTargetRow[];
  skipped: RefreshSkipped[];
}

function timestamp(value: Date | null): number | null {
  if (!value) return null;
  const n = new Date(value).getTime();
  return Number.isFinite(n) ? n : null;
}

function targetStudioId(target: RefreshTargetRow): number {
  return Number(target.studio_id);
}

function targetSourceCode(target: RefreshTargetRow): string {
  return target.source_code ?? 'naver';
}

export function compareRefreshTargets(a: RefreshTargetRow, b: RefreshTargetRow): number {
  const aScraped = timestamp(a.last_scraped_at);
  const bScraped = timestamp(b.last_scraped_at);
  if (aScraped == null && bScraped != null) return -1;
  if (aScraped != null && bScraped == null) return 1;
  if (aScraped != null && bScraped != null && aScraped !== bScraped) {
    return aScraped - bScraped;
  }
  return targetStudioId(a) - targetStudioId(b) || Number(a.id) - Number(b.id);
}

export function buildRefreshPlan(
  targets: RefreshTargetRow[],
  { now, freshMs, cooldownMs, maxSources }: RefreshPlanOptions,
): RefreshPlan {
  const eligible: RefreshTargetRow[] = [];
  const skipped: RefreshSkipped[] = [];

  for (const target of [...targets].sort(compareRefreshTargets)) {
    const sourceCode = targetSourceCode(target);
    const studioId = targetStudioId(target);
    const lastScraped = timestamp(target.last_scraped_at);
    const lastManual = timestamp(target.manual_updated_at);

    if (lastScraped != null && now - lastScraped < freshMs) {
      skipped.push({ studioId, sourceCode, reason: 'fresh' });
    } else if (lastManual != null && now - lastManual < cooldownMs) {
      skipped.push({ studioId, sourceCode, reason: 'cooldown' });
    } else {
      eligible.push(target);
    }
  }

  const toScrape = eligible.slice(0, maxSources);
  for (const target of eligible.slice(maxSources)) {
    skipped.push({
      studioId: targetStudioId(target),
      sourceCode: targetSourceCode(target),
      reason: 'capped',
    });
  }

  return { toScrape, skipped };
}

// 모든 요청이 공유하는 전역 세마포어. 동시 스크랩 수를 CONCURRENCY 로 제한한다.
class Semaphore {
  private active = 0;
  private readonly queue: Array<() => void> = [];
  constructor(private readonly max: number) {}
  async acquire(): Promise<void> {
    if (this.active < this.max) {
      this.active += 1;
      return;
    }
    await new Promise<void>((resolve) => this.queue.push(resolve));
  }
  release(): void {
    const next = this.queue.shift();
    if (next) next();
    else this.active -= 1;
  }
}
const scrapeSemaphore = new Semaphore(CONCURRENCY);

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} 타임아웃(${ms}ms)`)), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

// KST 기준 오늘 날짜(YYYY-MM-DD). en-CA 로케일이 ISO 형식을 준다.
function kstToday(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

@Injectable()
export class RefreshService {
  private readonly logger = new Logger(RefreshService.name);

  constructor(
    @Inject(RefreshRepository)
    private readonly repository: RefreshRepository,
  ) {}

  async refresh(studioIds: number[]): Promise<RefreshResult> {
    const dateFrom = kstToday();
    const dateTo = addDays(dateFrom, DATE_SPAN_DAYS);

    const result: RefreshResult = { dateFrom, dateTo, refreshed: [], skipped: [], failed: [] };
    if (studioIds.length === 0) return result;

    const targets = await this.repository.findRefreshTargets(studioIds);
    const plan = buildRefreshPlan(targets, {
      now: Date.now(),
      freshMs: FRESH_MINUTES * 60_000,
      cooldownMs: COOLDOWN_MINUTES * 60_000,
      maxSources: MAX_SOURCES,
    });
    result.skipped.push(...plan.skipped);

    const settled = await Promise.all(
      plan.toScrape.map((target) => this.scrapeOne(target, dateFrom, dateTo)),
    );
    for (const item of settled) {
      if (item.ok) result.refreshed.push(item.value);
      else result.failed.push(item.value);
    }

    return result;
  }

  private async scrapeOne(
    target: RefreshTargetRow,
    dateFrom: string,
    dateTo: string,
  ): Promise<
    | { ok: true; value: { studioId: number; studioName: string; sourceCode: string; slots: number } }
    | { ok: false; value: { studioId: number; sourceCode: string; error: string } }
  > {
    const studioId = Number(target.studio_id);
    const sourceCode = target.source_code ?? 'naver';
    const fail = (error: string) => ({ ok: false as const, value: { studioId, sourceCode, error } });

    try {
      const rooms = await this.repository.getMappedRooms(target.studio_id, target.source_id);
      if (rooms.length === 0) return fail('매핑된 방이 없습니다(room_sources)');

      const dispatch = buildStudioScraper({
        sourceCode: target.source_code,
        studioName: target.studio_name,
        url: target.url,
        externalKey: target.external_key,
        rooms: rooms.map((r) => ({ name: r.name, externalKey: r.external_key })),
        studioSourceId: target.id,
        debug: process.env.DEBUG === 'true',
      });
      if ('error' in dispatch) return fail(dispatch.error);

      const roomIdByName = new Map(rooms.map((r) => [r.name, r.id]));

      await scrapeSemaphore.acquire();
      const scrapePromise = dispatch
        .scrape(dateFrom, dateTo)
        .finally(() => scrapeSemaphore.release());
      const scraped = await withTimeout(scrapePromise, TIMEOUT_MS, target.studio_name);

      const okRooms = scraped.rooms.filter((r) => !r.error);
      if (okRooms.length === 0) {
        const firstErr = scraped.rooms.find((r) => r.error)?.error;
        return fail(`모든 방 수집 실패${firstErr ? ` (예: ${firstErr})` : ''}`);
      }

      const allSlots = okRooms.flatMap((r) => r.slots);
      const slotCount = await this.repository.upsertSlots(allSlots, roomIdByName);
      await this.repository.markManualUpdated(target.id);

      this.logger.log(
        `수동 갱신: ${target.studio_name}(${sourceCode}) 슬롯 ${slotCount}건` +
          (okRooms.length < scraped.rooms.length
            ? ` / 방 ${scraped.rooms.length - okRooms.length}개 실패`
            : ''),
      );
      return {
        ok: true,
        value: { studioId, studioName: target.studio_name, sourceCode, slots: slotCount },
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.warn(`수동 갱신 실패: ${target.studio_name}(${sourceCode}) / ${message}`);
      return fail(message);
    }
  }
}
