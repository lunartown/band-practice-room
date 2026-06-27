-- 조회가 영구히 안 되는(자리가 평생 없는) / 데이터가 이상한 스튜디오·방을 찾는 진단 쿼리 모음.
-- 운영 DB(Neon)에 직접 붙여 하나씩 실행한다. 읽기 전용(SELECT)이라 안전하다.
--   psql "$DATABASE_URL" -f src/api/db/diagnostics/empty_studios.sql
--
-- 카테고리:
--   [A] 소스 자체가 없는 스튜디오            → 수집 대상이 아예 아님
--   [B] 소스는 있는데 방 매핑(room_sources)이 0 → 매번 영구 실패("매핑된 방이 없습니다")
--   [C] 일부 방만 매핑 누락                   → 그 방만 영구 빈칸
--   [D] 수집은 "성공"하는데 AVAILABLE 슬롯이 0 → bizItemId 변질/항상 만석 등 조용한 실패
--   [E] 최근 슬롯 자체가 안 들어오는 스튜디오
--   [F] scrape_runs 실패 분포
--   [G] 데이터 이상치(가격/상태/시간)

\echo '===== [A] 활성 스튜디오인데 어떤 소스에도 연결 안 됨 (영구 미수집) ====='
SELECT s.id, s.slug, s.name
FROM studios s
WHERE s.is_active = true
  AND NOT EXISTS (SELECT 1 FROM studio_sources ss WHERE ss.studio_id = s.id)
ORDER BY s.id;

\echo '===== [B] 소스는 있으나 매핑된 방(room_sources)이 0 → 매 수집 영구 실패 ====='
SELECT s.id, s.slug, s.name,
       (SELECT count(*) FROM rooms r WHERE r.studio_id = s.id AND r.is_active) AS active_rooms
FROM studios s
WHERE s.is_active = true
  AND EXISTS (SELECT 1 FROM studio_sources ss WHERE ss.studio_id = s.id)
  AND NOT EXISTS (
    SELECT 1 FROM rooms r
    JOIN room_sources rs ON rs.room_id = r.id
    WHERE r.studio_id = s.id AND r.is_active AND rs.external_key IS NOT NULL
  )
ORDER BY s.id;

\echo '===== [C] 일부 방만 room_sources 매핑 누락 (그 방만 영구 빈칸) ====='
SELECT s.name AS studio, r.id AS room_id, r.name AS room
FROM rooms r
JOIN studios s ON s.id = r.studio_id
WHERE r.is_active AND s.is_active
  AND EXISTS (SELECT 1 FROM studio_sources ss WHERE ss.studio_id = s.id)
  AND NOT EXISTS (
    SELECT 1 FROM room_sources rs
    WHERE rs.room_id = r.id AND rs.external_key IS NOT NULL
  )
ORDER BY s.name, r.name;

\echo '===== [D] 최근 수집은 SUCCESS/PARTIAL인데 향후 7일 AVAILABLE 슬롯이 0 (조용한 실패) ====='
WITH last_run AS (
  SELECT DISTINCT ON (studio_id) studio_id, status, slots_found, finished_at
  FROM scrape_runs
  ORDER BY studio_id, finished_at DESC
)
SELECT s.id, s.name, lr.status AS last_status, lr.slots_found, lr.finished_at,
       COALESCE(av.cnt, 0) AS available_next7
FROM studios s
JOIN last_run lr ON lr.studio_id = s.id
LEFT JOIN LATERAL (
  SELECT count(*) AS cnt
  FROM slots sl
  JOIN rooms r ON r.id = sl.room_id
  WHERE r.studio_id = s.id
    AND sl.status = 'AVAILABLE'
    AND sl.date BETWEEN (now() AT TIME ZONE 'Asia/Seoul')::date
                    AND (now() AT TIME ZONE 'Asia/Seoul')::date + 7
) av ON true
WHERE s.is_active = true
  AND lr.status IN ('SUCCESS', 'PARTIAL')
  AND COALESCE(av.cnt, 0) = 0
ORDER BY lr.finished_at DESC;

\echo '===== [E] 최근 24시간 동안 슬롯이 한 건도 갱신 안 된 활성 스튜디오 ====='
SELECT s.id, s.name, max(sl.scraped_at) AS last_scraped
FROM studios s
JOIN rooms r ON r.studio_id = s.id AND r.is_active
LEFT JOIN slots sl ON sl.room_id = r.id
WHERE s.is_active = true
GROUP BY s.id, s.name
HAVING max(sl.scraped_at) IS NULL
    OR max(sl.scraped_at) < now() - interval '24 hours'
ORDER BY last_scraped NULLS FIRST;

\echo '===== [F] 최근 24시간 scrape_runs 상태/에러 분포 ====='
SELECT status, error_kind, count(*)
FROM scrape_runs
WHERE finished_at > now() - interval '24 hours'
GROUP BY status, error_kind
ORDER BY count DESC;

\echo '===== [F2] 영구 FAILED 로 잡힌 잡 + 마지막 에러 ====='
SELECT j.id, st.name AS studio, j.attempts, j.last_error, j.updated_at
FROM scrape_jobs j
JOIN studio_sources ss ON ss.id = j.studio_source_id
JOIN studios st ON st.id = ss.studio_id
WHERE j.status = 'FAILED'
ORDER BY j.updated_at DESC;

\echo '===== [G] 데이터 이상치: AVAILABLE인데 가격<=0, 또는 한 방이 24시간 내내 UNAVAILABLE ====='
-- 가격 이상
SELECT 'price<=0' AS kind, count(*)
FROM slots WHERE status = 'AVAILABLE' AND (price IS NULL OR price <= 0)
UNION ALL
-- 향후 7일 동안 한 칸도 AVAILABLE이 없는 (사실상 평생 만석) 방
SELECT 'room_never_available_7d', count(*) FROM (
  SELECT r.id
  FROM rooms r
  JOIN room_sources rs ON rs.room_id = r.id
  WHERE r.is_active
  GROUP BY r.id
  HAVING NOT EXISTS (
    SELECT 1 FROM slots sl
    WHERE sl.room_id = r.id AND sl.status = 'AVAILABLE'
      AND sl.date BETWEEN (now() AT TIME ZONE 'Asia/Seoul')::date
                      AND (now() AT TIME ZONE 'Asia/Seoul')::date + 7
  )
) t;
