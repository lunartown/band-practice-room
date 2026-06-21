import { query } from './db.js';
import { NaverReservationScraper } from './naver/scraper.js';
import type { AvailabilitySlot, ScrapeRoom } from './naver/types.js';

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
  external_key: string | null;
  studio_name: string;
}

interface RoomRow {
  id: string;
  name: string;
  biz_item_id: string;
}

export async function runOnce(): Promise<boolean> {
  await provisionJobs();

  const job = await claimJob();
  if (!job) return false;

  const source = await getStudioSource(job.studio_source_id);
  if (!source || !source.url || !source.external_key) {
    await failJob(job.id, 'studio_source URL/식별자가 없습니다', 'UNKNOWN');
    return true;
  }

  const businessTypeId = parseBusinessTypeId(source.url);
  if (businessTypeId === null) {
    await failJob(job.id, `URL에서 businessTypeId 파싱 실패: ${source.url}`, 'UNKNOWN');
    return true;
  }

  const rooms = await getMappedRooms(source.studio_id, source.source_id);
  if (rooms.length === 0) {
    // 네이버 매핑(room_sources)이 없는 스튜디오 → 수집 대상 아님. 재시도해도 의미 없음.
    await failJob(job.id, '네이버에 매핑된 방이 없습니다', 'UNKNOWN');
    return true;
  }

  const startedAt = new Date();
  console.log(`[worker] 수집 시작: ${source.studio_name} (${job.date_from} ~ ${job.date_to})`);

  try {
    const roomIdByName = new Map(rooms.map((r) => [r.name, r.id]));
    const scrapeRooms: ScrapeRoom[] = rooms.map((r) => ({
      roomName: r.name,
      bizItemId: r.biz_item_id,
    }));

    const scraper = new NaverReservationScraper({ debug: process.env.DEBUG === 'true' });
    const result = await scraper.scrape(
      {
        studioSourceId: job.studio_source_id,
        studioName: source.studio_name,
        businessId: source.external_key,
        businessTypeId,
        rooms: scrapeRooms,
      },
      job.date_from,
      job.date_to,
    );

    const erroredRooms = result.rooms.filter((r) => r.error);
    if (erroredRooms.length === result.rooms.length) {
      // 모든 방 실패 → 작업 실패로 간주하고 재시도 경로로 보낸다.
      throw new Error(`모든 방 수집 실패 (예: ${erroredRooms[0]?.error})`);
    }

    let totalSlots = 0;
    let roomsWithSlots = 0;
    const allSlots: AvailabilitySlot[] = [];
    for (const roomResult of result.rooms) {
      if (roomResult.error) continue;
      if (roomResult.slots.length > 0) roomsWithSlots++;
      allSlots.push(...roomResult.slots);
      totalSlots += roomResult.slots.length;
    }

    await upsertSlots(allSlots, roomIdByName);

    const status = erroredRooms.length > 0 ? 'PARTIAL' : 'SUCCESS';
    await createScrapeRun({
      jobId: job.id,
      studioId: source.studio_id,
      sourceId: source.source_id,
      dateFrom: job.date_from,
      dateTo: job.date_to,
      status,
      startedAt,
      roomsFound: roomsWithSlots,
      slotsFound: totalSlots,
      errorMessage: erroredRooms.length ? `방 ${erroredRooms.length}개 실패` : undefined,
    });

    await requeueJob(job.id, SUCCESS_REQUEUE_MINUTES);
    console.log(
      `[worker] 수집 완료(${status}): ${source.studio_name} / 슬롯 ${totalSlots}건` +
        (erroredRooms.length ? ` / 방 ${erroredRooms.length}개 실패` : ''),
    );
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

// URL 의 /booking/{N}/ 세그먼트가 businessTypeId (보통 10, 일부 13).
function parseBusinessTypeId(url: string): number | null {
  const m = url.match(/\/booking\/(\d+)\//);
  return m ? Number(m[1]) : null;
}

async function provisionJobs() {
  // PENDING/RUNNING 잡이 있거나, 최근(6시간 내) 영구 FAILED 한 스튜디오는 재생성하지 않는다.
  // → 일시 장애로 죽은 잡을 곧바로 되살려 백오프를 무력화하던 문제를 막는다.
  await query(
    `
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
        AND (
          j.status IN ('PENDING', 'RUNNING')
          OR (j.status = 'FAILED' AND j.updated_at > NOW() - INTERVAL '6 hours')
        )
    )
  `,
    [JOB_DATE_SPAN_DAYS],
  );
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
  const result = await query<StudioSourceRow>(
    `
    SELECT ss.studio_id, ss.source_id, ss.url, ss.external_key, st.name AS studio_name
    FROM studio_sources ss
    INNER JOIN studios st ON st.id = ss.studio_id
    WHERE ss.id = $1
  `,
    [studioSourceId],
  );
  return result.rows[0] ?? null;
}

// 네이버 bizItemId 가 매핑된(room_sources 가 있는) 활성 방만 가져온다.
async function getMappedRooms(studioId: string, sourceId: string): Promise<RoomRow[]> {
  const result = await query<RoomRow>(
    `
    SELECT r.id, r.name, rs.external_key AS biz_item_id
    FROM rooms r
    INNER JOIN room_sources rs ON rs.room_id = r.id AND rs.source_id = $2
    WHERE r.studio_id = $1 AND r.is_active = true AND rs.external_key IS NOT NULL
    ORDER BY r.id ASC
  `,
    [studioId, sourceId],
  );
  return result.rows;
}

// 한 INSERT 당 행 수 (Postgres 파라미터 한도 65535 / 7컬럼 ≈ 9362, 여유 있게 500).
const SLOT_BATCH_SIZE = 500;

interface SlotRow {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  price: number | null;
  priceSource: string;
}

async function upsertSlots(
  slots: AvailabilitySlot[],
  roomIdByName: Map<string, string>,
): Promise<void> {
  // 같은 (room_id, date, start_time) 가 한 배치에 두 번 들어가면 ON CONFLICT DO UPDATE 가
  // "한 행을 두 번 갱신할 수 없다" 에러를 내므로, 키 기준 중복 제거(마지막 값 우선).
  const dedup = new Map<string, SlotRow>();
  for (const slot of slots) {
    const roomId = roomIdByName.get(slot.roomName);
    if (!roomId) continue;
    dedup.set(`${roomId}|${slot.date}|${slot.startTime}`, {
      roomId,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      status: slot.status.toUpperCase(),
      price: slot.price,
      priceSource: slot.price !== null ? 'SCRAPED' : 'UNKNOWN',
    });
  }

  const rows = [...dedup.values()];
  // 슬롯당 1쿼리 대신, 배치당 1쿼리(다중 행)로 DB 왕복을 크게 줄인다.
  for (let i = 0; i < rows.length; i += SLOT_BATCH_SIZE) {
    const batch = rows.slice(i, i + SLOT_BATCH_SIZE);
    const params: unknown[] = [];
    const tuples = batch.map((r, idx) => {
      const b = idx * 7;
      params.push(r.roomId, r.date, r.startTime, r.endTime, r.status, r.price, r.priceSource);
      return `($${b + 1}, $${b + 2}, $${b + 3}, $${b + 4}, $${b + 5}, $${b + 6}, $${b + 7}, NOW())`;
    });
    await query(
      `
      INSERT INTO slots (room_id, date, start_time, end_time, status, price, price_source, scraped_at)
      VALUES ${tuples.join(', ')}
      ON CONFLICT (room_id, date, start_time) DO UPDATE SET
        end_time = EXCLUDED.end_time,
        status = EXCLUDED.status,
        price = EXCLUDED.price,
        price_source = EXCLUDED.price_source,
        scraped_at = EXCLUDED.scraped_at
    `,
      params,
    );
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
  await query(
    `
    INSERT INTO scrape_runs
      (job_id, studio_id, source_id, date_from, date_to, status, started_at, finished_at,
       rooms_found, slots_found, error_kind, error_message)
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9, $10, $11)
  `,
    [
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
    ],
  );
}

async function requeueJob(jobId: string, delayMinutes: number): Promise<void> {
  // 성공 시 attempts 를 0 으로 되돌린다. (리셋하지 않으면 성공이 누적돼도
  // attempts 가 계속 늘어 결국 MAX_ATTEMPTS 를 넘겨 잡이 영구 실패하던 버그)
  await query(
    `
    UPDATE scrape_jobs
    SET
      status = 'PENDING',
      attempts = 0,
      date_from = (NOW() AT TIME ZONE 'Asia/Seoul')::date,
      date_to = (NOW() AT TIME ZONE 'Asia/Seoul')::date + $1::integer,
      run_after = NOW() + ($2 || ' minutes')::interval,
      updated_at = NOW()
    WHERE id = $3
  `,
    [JOB_DATE_SPAN_DAYS, delayMinutes, jobId],
  );
}

async function failJob(jobId: string, message: string, errorKind: string): Promise<void> {
  const result = await query<{ attempts: number }>(
    `SELECT attempts FROM scrape_jobs WHERE id = $1`,
    [jobId],
  );
  const attempts = result.rows[0]?.attempts ?? 0;
  const shouldRetry = attempts < MAX_ATTEMPTS;

  await query(
    `
    UPDATE scrape_jobs
    SET
      status = $1,
      last_error = $2,
      run_after = CASE WHEN $3 THEN NOW() + ($5 || ' minutes')::interval ELSE NULL END,
      updated_at = NOW()
    WHERE id = $4
  `,
    [shouldRetry ? 'PENDING' : 'FAILED', message, shouldRetry, jobId, FAILURE_RETRY_MINUTES],
  );

  if (!shouldRetry) {
    console.error(`[worker] 최대 재시도 횟수 초과, 작업 중단: job ${jobId}`);
  }
}

function classifyError(message: string): 'TIMEOUT' | 'AUTH_FAILED' | 'PARSE_FAILED' | 'UNKNOWN' {
  if (/timeout/i.test(message)) return 'TIMEOUT';
  if (/auth|login|session|403|401/i.test(message)) return 'AUTH_FAILED';
  if (/parse|bizitem|not found|빈 응답|매핑/i.test(message)) return 'PARSE_FAILED';
  return 'UNKNOWN';
}
