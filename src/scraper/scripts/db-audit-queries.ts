// DB 정합성 점검(db-audit)의 읽기 전용 진단 쿼리 단일 소스.
// 사람이 읽는 판정 기준·설명은 .claude/skills/db-audit/SKILL.md 에 있고, 여기는 실행용 SQL 만 담는다.
// 모든 SQL 은 SELECT 전용이며, 실행 시 세션을 read-only 로 고정한다(db-audit.ts).
// 무제한 결과가 나올 수 있는 쿼리에는 LIMIT 을 걸어 로그 크기를 제한한다.

export interface AuditCheck {
  id: string;
  title: string;
  sql: string;
}

export interface AuditSection {
  section: string;
  title: string;
  checks: AuditCheck[];
}

export const AUDIT_SECTIONS: AuditSection[] = [
  {
    section: 'freshness',
    title: '신선도',
    checks: [
      {
        id: 'stale_active_rooms',
        title: 'mapping ACTIVE + 활성 방인데 수집이 3시간+ 밀린(또는 없는) 방',
        // provisionJobs(worker.ts)는 studios/sources 가 비활성이면 잡을 만들지 않으므로,
        // 그런 방은 수집이 안 되는 게 정상이다. 부모 studio·source 활성 조건을 함께 걸어
        // 의도적으로 제외된 방을 거짓 stale 로 잡지 않는다.
        sql: `SELECT s.name AS studio, r.name AS room, rs.mapping_status,
       MAX(sl.scraped_at) AS last_scraped, now() - MAX(sl.scraped_at) AS age
FROM room_sources rs JOIN rooms r ON r.id = rs.room_id JOIN studios s ON s.id = r.studio_id
JOIN sources src ON src.id = rs.source_id
LEFT JOIN slots sl ON sl.room_id = r.id
WHERE rs.mapping_status = 'ACTIVE' AND r.is_active AND s.is_active AND src.is_active
GROUP BY s.name, r.name, rs.mapping_status
HAVING MAX(sl.scraped_at) IS NULL OR MAX(sl.scraped_at) < now() - INTERVAL '3 hours'
ORDER BY last_scraped ASC NULLS FIRST
LIMIT 100`,
      },
      {
        id: 'oldest_rooms',
        title: '스튜디오/방별 최신 수집 시각 (오래된 순 30)',
        sql: `SELECT s.name AS studio, r.name AS room,
       MAX(sl.scraped_at) AS last_scraped, now() - MAX(sl.scraped_at) AS age
FROM slots sl JOIN rooms r ON r.id = sl.room_id JOIN studios s ON s.id = r.studio_id
GROUP BY s.name, r.name ORDER BY last_scraped ASC NULLS FIRST LIMIT 30`,
      },
      {
        id: 'stale_future_available',
        title: '미래 AVAILABLE 인데 scraped_at 이 3시간+ 낡은 슬롯 규모',
        sql: `SELECT count(*) FILTER (WHERE sl.scraped_at < now() - INTERVAL '3 hours') AS stale_future_available,
       count(*) AS total_future_available
FROM slots sl
WHERE sl.status = 'AVAILABLE' AND sl.date >= (now() AT TIME ZONE 'Asia/Seoul')::date`,
      },
    ],
  },
  {
    section: 'job_queue',
    title: '잡 큐 건강도',
    checks: [
      {
        id: 'job_status_counts',
        title: 'scrape_jobs status 분포',
        sql: `SELECT status, count(*)::int AS count FROM scrape_jobs GROUP BY status ORDER BY status`,
      },
      {
        id: 'zombie_running',
        title: '30분+ RUNNING 정체(좀비)',
        sql: `SELECT id, studio_source_id, status, updated_at, now() - updated_at AS running_for, attempts
FROM scrape_jobs WHERE status = 'RUNNING' AND updated_at < now() - INTERVAL '30 minutes'
ORDER BY updated_at ASC LIMIT 100`,
      },
      {
        id: 'overdue_pending',
        title: 'run_after 가 30분+ 지난 PENDING',
        sql: `SELECT id, studio_source_id, run_after, now() - run_after AS overdue, attempts
FROM scrape_jobs WHERE status = 'PENDING' AND run_after IS NOT NULL
  AND run_after < now() - INTERVAL '30 minutes' ORDER BY run_after ASC LIMIT 100`,
      },
      {
        id: 'active_source_no_job',
        title: 'ACTIVE studio_source 인데 잡이 아예 없음',
        sql: `SELECT ss.id, st.name AS studio, ss.mapping_status
FROM studio_sources ss JOIN studios st ON st.id = ss.studio_id
LEFT JOIN scrape_jobs j ON j.studio_source_id = ss.id
WHERE ss.mapping_status = 'ACTIVE' AND j.id IS NULL LIMIT 100`,
      },
    ],
  },
  {
    section: 'scrape_signals',
    title: '수집 신호',
    checks: [
      {
        id: 'success_zero_slots',
        title: 'SUCCESS 인데 slots_found=0 (최근 24h)',
        sql: `SELECT sr.id, st.name AS studio, sr.status, sr.slots_found, sr.rooms_found, sr.started_at
FROM scrape_runs sr JOIN studios st ON st.id = sr.studio_id
WHERE sr.status = 'SUCCESS' AND COALESCE(sr.slots_found, 0) = 0
  AND sr.started_at > now() - INTERVAL '24 hours' ORDER BY sr.started_at DESC LIMIT 100`,
      },
      {
        id: 'run_status_ratio_24h',
        title: '최근 24h scrape_runs status 비율',
        sql: `SELECT status, count(*)::int AS count, round(100.0 * count(*) / SUM(count(*)) OVER (), 1) AS pct
FROM scrape_runs WHERE started_at > now() - INTERVAL '24 hours' GROUP BY status`,
      },
      {
        id: 'last_run_per_studio',
        title: '스튜디오별 마지막 run 상태',
        sql: `SELECT DISTINCT ON (sr.studio_id) st.name AS studio, sr.status,
       sr.slots_found, sr.error_kind, sr.started_at
FROM scrape_runs sr JOIN studios st ON st.id = sr.studio_id
ORDER BY sr.studio_id, sr.started_at DESC`,
      },
    ],
  },
  {
    section: 'referential_integrity',
    title: '참조 무결성 / 고아',
    checks: [
      {
        id: 'inactive_exposed_available',
        title: '비활성 room/studio 를 가리키는 미래 AVAILABLE 슬롯',
        sql: `SELECT count(*)::int AS count FROM slots sl
JOIN rooms r ON r.id = sl.room_id JOIN studios s ON s.id = r.studio_id
WHERE (NOT r.is_active OR NOT s.is_active)
  AND sl.date >= (now() AT TIME ZONE 'Asia/Seoul')::date AND sl.status = 'AVAILABLE'`,
      },
      {
        id: 'active_source_no_active_room_mapping',
        title: 'ACTIVE studio_source 인데 같은 source 로 매핑된 활성 방이 없음',
        sql: `SELECT ss.id, st.name AS studio, ss.source_id
FROM studio_sources ss JOIN studios st ON st.id = ss.studio_id
WHERE ss.mapping_status = 'ACTIVE' AND NOT EXISTS (
  SELECT 1 FROM rooms r JOIN room_sources rs ON rs.room_id = r.id AND rs.source_id = ss.source_id
  WHERE r.studio_id = ss.studio_id AND r.is_active AND rs.mapping_status = 'ACTIVE') LIMIT 100`,
      },
      {
        id: 'active_room_no_source',
        title: 'is_active 인데 room_sources 가 하나도 없는 방',
        sql: `SELECT r.id, s.name AS studio, r.name AS room
FROM rooms r JOIN studios s ON s.id = r.studio_id
LEFT JOIN room_sources rs ON rs.room_id = r.id
WHERE r.is_active AND rs.id IS NULL LIMIT 100`,
      },
    ],
  },
  {
    section: 'slot_sanity',
    title: '슬롯 sanity',
    checks: [
      {
        id: 'check_violations',
        title: 'end<=start CHECK 위반(자정 예외 제외)',
        sql: `SELECT count(*)::int AS check_violations FROM slots
WHERE end_time <= start_time AND end_time <> '00:00:00'`,
      },
      {
        id: 'price_distribution',
        title: '가격 이상 분포',
        sql: `SELECT count(*) FILTER (WHERE price IS NULL)::int AS null_price,
       count(*) FILTER (WHERE price = 0)::int AS zero_price,
       count(*) FILTER (WHERE price < 0)::int AS neg_price,
       count(*) FILTER (WHERE price > 200000)::int AS huge_price,
       min(price) AS min_price, max(price) AS max_price, round(avg(price)) AS avg_price
FROM slots`,
      },
      {
        id: 'status_distribution',
        title: 'slots status 분포',
        sql: `SELECT status, count(*)::int AS count, round(100.0 * count(*) / SUM(count(*)) OVER (), 1) AS pct
FROM slots GROUP BY status ORDER BY count DESC`,
      },
      {
        id: 'past_slots',
        title: '과거 날짜 슬롯 누적 규모',
        sql: `SELECT count(*)::int AS past_slots, min(date) AS oldest_date
FROM slots WHERE date < (now() AT TIME ZONE 'Asia/Seoul')::date`,
      },
    ],
  },
  {
    section: 'coverage',
    title: '커버리지 이상치',
    checks: [
      {
        id: 'no_availability_7d',
        title: '활성 방인데 향후 7일 AVAILABLE 슬롯이 0',
        sql: `SELECT s.name AS studio, r.name AS room
FROM rooms r JOIN studios s ON s.id = r.studio_id
WHERE r.is_active AND s.is_active AND NOT EXISTS (
  SELECT 1 FROM slots sl WHERE sl.room_id = r.id AND sl.status = 'AVAILABLE'
    AND sl.date BETWEEN (now() AT TIME ZONE 'Asia/Seoul')::date
                    AND (now() AT TIME ZONE 'Asia/Seoul')::date + 7)
ORDER BY studio, room LIMIT 200`,
      },
      {
        id: 'room_date_coverage',
        title: '방별·날짜별 슬롯 수 (향후 7일, 요일/날짜 구멍 패턴)',
        sql: `SELECT s.id AS studio_id, s.name AS studio, r.id AS room_id, r.name AS room,
       sl.date, count(*)::int AS slots
FROM slots sl JOIN rooms r ON r.id = sl.room_id JOIN studios s ON s.id = r.studio_id
WHERE sl.date BETWEEN (now() AT TIME ZONE 'Asia/Seoul')::date
                  AND (now() AT TIME ZONE 'Asia/Seoul')::date + 7
GROUP BY s.id, s.name, r.id, r.name, sl.date
ORDER BY studio, room, sl.date LIMIT 3000`,
      },
      {
        id: 'studio_future_slots',
        title: '스튜디오별 미래 슬롯 수 (outlier 탐지)',
        sql: `SELECT s.id AS studio_id, s.name AS studio, count(*)::int AS future_slots,
       count(*) FILTER (WHERE sl.status = 'AVAILABLE')::int AS available
FROM slots sl JOIN rooms r ON r.id = sl.room_id JOIN studios s ON s.id = r.studio_id
WHERE sl.date >= (now() AT TIME ZONE 'Asia/Seoul')::date
GROUP BY s.id, s.name ORDER BY future_slots ASC`,
      },
    ],
  },
  {
    section: 'mapping_consistency',
    title: '매핑 일관성',
    checks: [
      {
        id: 'spacecloud_bad_external_key',
        title: 'spacecloud external_key 가 "숫자:숫자" 패턴 위반(ACTIVE)',
        sql: `SELECT rs.id, s.name AS studio, r.name AS room, rs.external_key
FROM room_sources rs JOIN rooms r ON r.id = rs.room_id JOIN studios s ON s.id = r.studio_id
JOIN sources src ON src.id = rs.source_id
WHERE src.code = 'spacecloud' AND rs.mapping_status = 'ACTIVE'
  AND (rs.external_key IS NULL OR rs.external_key !~ '^[0-9]+:[0-9]+$') LIMIT 100`,
      },
      {
        id: 'duplicate_studio_names',
        title: '중복 스튜디오명',
        sql: `SELECT name, count(*)::int AS count FROM studios GROUP BY name HAVING count(*) > 1`,
      },
      {
        id: 'studio_without_area',
        title: 'area 미배정 활성 스튜디오',
        sql: `SELECT id, name FROM studios WHERE is_active AND primary_area_id IS NULL LIMIT 100`,
      },
    ],
  },
  {
    section: 'timezone',
    title: '시간 / 타임존',
    checks: [
      {
        id: 'past_available',
        title: '오늘(KST) 이전 날짜인데 AVAILABLE 로 남은 슬롯',
        sql: `SELECT count(*)::int AS count FROM slots
WHERE date < (now() AT TIME ZONE 'Asia/Seoul')::date AND status = 'AVAILABLE'`,
      },
      {
        id: 'midnight_boundary',
        title: '자정 경계 슬롯 규모(미래)',
        sql: `SELECT count(*) FILTER (WHERE end_time = '00:00:00')::int AS midnight_end,
       count(*) FILTER (WHERE start_time = '00:00:00')::int AS midnight_start
FROM slots WHERE date >= (now() AT TIME ZONE 'Asia/Seoul')::date`,
      },
    ],
  },
];
