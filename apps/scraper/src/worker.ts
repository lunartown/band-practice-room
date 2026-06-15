import { query } from './db.js';
import { NaverReservationScraper } from './naver/scraper.js';
import type { AvailabilitySlot } from './naver/types.js';

const MAX_ATTEMPTS = 5;
const SUCCESS_REQUEUE_MINUTES = 60;
const FAILURE_RETRY_MINUTES = 15;

// 한 Job당 스크래핑 날짜 범위 (오늘 포함 N일)
const JOB_DATE_SPAN_DAYS = 6; // 7일 (0~6)

interface JobRow {
  id: string;
  studio_source_id: string;
  date_from: string;
  date_to: string;
  attempts: number;
}

interface StudioSourceRow {
  studio_id: string;
  source_id: string;
  url: string | null;
  studio_name: string;
}

interface RoomRow {
  id: string;
  name: string;
}

export async function runOnce(): Promise<boolean> {
  await provisionJobs();

  const job = await claimJob();
  if (!job) return false;

  const source = await getStudioSource(job.studio_source_id);
  if (!source || !source.url) {
    await failJob(job.id, 'studio_source URL이 없습니다', 'UNKNOWN');
    return true;
  }

  const rooms = await getRooms(source.studio_id);
  if (rooms.length === 0) {
    await failJob(job.id, '등록된 방이 없습니다', 'UNKNOWN');
    return true;
  }

  const startedAt = new Date();
  console.log(`[worker] 수집 시작: ${source.studio_name} (${job.date_from} ~ ${job.date_to})`);

  try {
    const dates = getDatesInRange(job.date_from, job.date_to);
    const roomNames = rooms.map((r) => r.name);
    const roomIdByName = new Map(rooms.map((r) => [r.name, r.id]));

    const scraper = new NaverReservationScraper({
      headless: process.env.HEADLESS !== 'false',
      debug: process.env.DEBUG === 'true',
    });

    const dateResults = await scraper.scrape(
      { studioSourceId: job.studio_source_id, studioName: source.studio_name, url: source.url },
      dates,
      roomNames,
    );

    let totalSlots = 0;
    let totalRooms = 0;
    const allSlots: AvailabilitySlot[] = [];

    for (const dateResult of dateResults) {
      for (const roomResult of dateResult.rooms) {
        if (roomResult.error) continue;
        if (roomResult.slots.length > 0) totalRooms++;
        allSlots.push(...roomResult.slots);
        totalSlots += roomResult.slots.length;
      }
    }

    await upsertSlots(allSlots, roomIdByName);

    await createScrapeRun({
      jobId: job.id,
      studioId: source.studio_id,
      sourceId: source.source_id,
      dateFrom: job.date_from,
      dateTo: job.date_to,
      status: 'SUCCESS',
      startedAt,
      roomsFound: totalRooms,
      slotsFound: totalSlots,
    });

    await requeueJob(job.id, SUCCESS_REQUEUE_MINUTES);
    console.log(`[worker] 수집 완료: ${source.studio_name} / 슬롯 ${totalSlots}건`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const errorKind = classifyError(message);

    await createScrapeRun({
      jobId: job.id,
      studioId: source.studio_id,
      sourceId: source.source_id,
      dateFrom: job.date_from,
      dateTo: job.date_to,
      status: 'FAILED',
      startedAt,
      errorKind,
      errorMessage: message,
    });

    await failJob(job.id, message, errorKind);
    console.error(`[worker] 수집 실패: ${source.studio_name} / ${message}`);
  }

  return true;
}

async function provisionJobs() {
  await query(`
    INSERT INTO scrape_jobs (studio_source_id, date_from, date_to, status, priority)
    SELECT
      ss.id,
      (NOW() AT TIME ZONE 'Asia/Seoul')::date,
      (NOW() AT TIME ZONE 'Asia/Seoul')::date + $1::integer,
      'PENDING',
      0
    FROM studio_sources ss
    INNER JOIN studios st ON st.id = ss.studio_id AND st.is_active = true
    INNER JOIN sources src ON src.id = ss.source_id AND src.is_active = true
    WHERE NOT EXISTS (
      SELECT 1 FROM scrape_jobs j
      WHERE j.studio_source_id = ss.id
        AND j.status IN ('PENDING', 'RUNNING')
    )
  `, [JOB_DATE_SPAN_DAYS]);
}

async function claimJob(): Promise<JobRow | null> {
  const result = await query<JobRow>(`
    UPDATE scrape_jobs
    SET
      status = 'RUNNING',
      attempts = attempts + 1,
      updated_at = NOW()
    WHERE id = (
      SELECT id FROM scrape_jobs
      WHERE status = 'PENDING'
        AND (run_after IS NULL OR run_after <= NOW())
      ORDER BY priority DESC, run_after ASC NULLS FIRST
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING id, studio_source_id, date_from::text, date_to::text, attempts
  `);
  return result.rows[0] ?? null;
}

async function getStudioSource(studioSourceId: string): Promise<StudioSourceRow | null> {
  const result = await query<StudioSourceRow>(`
    SELECT ss.studio_id, ss.source_id, ss.url, st.name AS studio_name
    FROM studio_sources ss
    INNER JOIN studios st ON st.id = ss.studio_id
    WHERE ss.id = $1
  `, [studioSourceId]);
  return result.rows[0] ?? null;
}

async function getRooms(studioId: string): Promise<RoomRow[]> {
  const result = await query<RoomRow>(`
    SELECT id, name
    FROM rooms
    WHERE studio_id = $1 AND is_active = true
    ORDER BY id ASC
  `, [studioId]);
  return result.rows;
}

async function upsertSlots(
  slots: AvailabilitySlot[],
  roomIdByName: Map<string, string>,
): Promise<void> {
  for (const slot of slots) {
    const roomId = roomIdByName.get(slot.roomName);
    if (!roomId) continue;

    const status = slot.status.toUpperCase();
    await query(`
      INSERT INTO slots (room_id, date, start_time, end_time, status, price, price_source, scraped_at)
      VALUES ($1, $2, $3, $4, $5, NULL, 'UNKNOWN', NOW())
      ON CONFLICT (room_id, date, start_time) DO UPDATE SET
        end_time = EXCLUDED.end_time,
        status = EXCLUDED.status,
        price_source = EXCLUDED.price_source,
        scraped_at = EXCLUDED.scraped_at
    `, [roomId, slot.date, slot.startTime, slot.endTime, status]);
  }
}

async function createScrapeRun(params: {
  jobId: string;
  studioId: string;
  sourceId: string;
  dateFrom: string;
  dateTo: string;
  status: 'SUCCESS' | 'FAILED' | 'PARTIAL';
  startedAt: Date;
  roomsFound?: number;
  slotsFound?: number;
  errorKind?: string;
  errorMessage?: string;
}): Promise<void> {
  await query(`
    INSERT INTO scrape_runs
      (job_id, studio_id, source_id, date_from, date_to, status, started_at, finished_at,
       rooms_found, slots_found, error_kind, error_message)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11)
  `, [
    params.jobId,
    params.studioId,
    params.sourceId,
    params.dateFrom,
    params.dateTo,
    params.status,
    params.startedAt.toISOString(),
    params.roomsFound ?? null,
    params.slotsFound ?? null,
    params.errorKind ?? null,
    params.errorMessage ?? null,
  ]);
}

async function requeueJob(jobId: string, delayMinutes: number): Promise<void> {
  await query(`
    UPDATE scrape_jobs
    SET
      status = 'PENDING',
      date_from = (NOW() AT TIME ZONE 'Asia/Seoul')::date,
      date_to = (NOW() AT TIME ZONE 'Asia/Seoul')::date + $1::integer,
      run_after = NOW() + ($2 || ' minutes')::interval,
      updated_at = NOW()
    WHERE id = $3
  `, [JOB_DATE_SPAN_DAYS, delayMinutes, jobId]);
}

async function failJob(jobId: string, message: string, errorKind: string): Promise<void> {
  const result = await query<{ attempts: number }>(`
    SELECT attempts FROM scrape_jobs WHERE id = $1
  `, [jobId]);
  const attempts = result.rows[0]?.attempts ?? 0;
  const shouldRetry = attempts < MAX_ATTEMPTS;

  await query(`
    UPDATE scrape_jobs
    SET
      status = $1,
      last_error = $2,
      run_after = CASE WHEN $3 THEN NOW() + ($5 || ' minutes')::interval ELSE NULL END,
      updated_at = NOW()
    WHERE id = $4
  `, [shouldRetry ? 'PENDING' : 'FAILED', message, shouldRetry, jobId, FAILURE_RETRY_MINUTES]);

  if (!shouldRetry) {
    console.error(`[worker] 최대 재시도 횟수 초과, 작업 중단: job ${jobId}`);
  }
}

function classifyError(message: string): 'TIMEOUT' | 'AUTH_FAILED' | 'PARSE_FAILED' | 'UNKNOWN' {
  if (/timeout/i.test(message)) return 'TIMEOUT';
  if (/auth|login|session|403|401/i.test(message)) return 'AUTH_FAILED';
  if (/parse|selector|not found/i.test(message)) return 'PARSE_FAILED';
  return 'UNKNOWN';
}

function getDatesInRange(dateFrom: string, dateTo: string): string[] {
  const todaySeoul = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Seoul' }).format(new Date());
  const dates: string[] = [];
  const current = new Date(dateFrom + 'T00:00:00');
  const end = new Date(dateTo + 'T00:00:00');
  while (current <= end) {
    const dateStr = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}-${String(current.getDate()).padStart(2, '0')}`;
    if (dateStr >= todaySeoul) {
      dates.push(dateStr);
    }
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
