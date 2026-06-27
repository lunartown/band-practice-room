---
name: db-integrity-audit
description: >-
  공유 Postgres(Neon)의 "데이터 정합성 점검"을 읽기 전용(SELECT only)으로 수행한다.
  슬롯 신선도·잡 큐 건강도·수집 신호·참조 무결성·슬롯 sanity·커버리지·매핑·타임존을
  SQL로 검증해 "현재 상태가 정상인가"만 진단하고 이상을 보고한다. 절대 수정/제안/리팩터
  하지 않는다. 사용자가 "DB 정합성 점검", "데이터 audit", "슬롯 신선도 확인" 등을 요청할 때 사용.
---

# DB 정합성 점검 (읽기 전용 진단)

band-practice-room의 공유 Postgres에 대한 **데이터 정합성 점검**을 수행한다.
이건 **읽기 전용 진단**이다. 절대 수정/제안/리팩터 하지 않는다.

## 엄격 규칙 (반드시 지킬 것)

- **SELECT만 실행.** INSERT/UPDATE/DELETE/DDL/트랜잭션 변경 일절 금지. **프로덕션 DB로 간주한다.**
- 접속은 `DATABASE_URL` 사용(`src/scraper/src/db.ts`와 동일). `psql "$DATABASE_URL"` 또는
  기존 `pg` 설정으로 throwaway 조회 스크립트. **어떤 경우에도 데이터를 바꾸지 마.**
- **해결책·작업 추천·리팩터 제안 금지.** 오직 "현재 상태가 정상인가"만 본다.
  단, 이상(anomaly)을 발견하면 **반드시 명확히 보고**할 것. 정상이면 정상이라고 적을 것.

### 안전 접속 방법

읽기 전용 안전벨트로 세션을 read-only로 고정하고 돌린다(데이터 변경 아님, 쓰기 차단 GUC):

```bash
# 단발 점검: heredoc 한 세션 안에서 read-only 고정 후 SELECT만
PGOPTIONS='-c default_transaction_read_only=on' \
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -P pager=off <<'SQL'
SELECT now();              -- 연결 확인
SELECT current_setting('transaction_read_only');  -- 'on' 이어야 안전
SQL
```

- Neon 등 원격은 SSL 필수다. `DATABASE_URL`에 `sslmode=require`가 없으면 붙여서 접속한다.
- `psql`이 없으면 `src/scraper`에서 `pg`로 throwaway 스크립트를 쓰되, `pool.query`로 **SELECT만** 던진다.
- 진단 종료 후 임시 스크립트는 커밋하지 말고 폐기한다.

## 스키마 참조 (실제 마이그레이션 기준)

`src/api/db/migrations/` 기준 실제 컬럼:

- **slots**(id, room_id→rooms, date DATE, start_time TIME, end_time TIME,
  status ∈ `AVAILABLE/UNAVAILABLE/UNKNOWN`, price INT, price_source ∈ `SCRAPED/MANUAL/UNKNOWN`,
  scraped_at TIMESTAMPTZ). UNIQUE(room_id,date,start_time).
  CHECK `end_time > start_time OR end_time = '00:00:00'` (자정=다음날 00:00 허용).
- **rooms**(id, studio_id, name, price_per_hour, price_source, capacity_min/max, is_active).
  UNIQUE(studio_id, name).
- **studios**(id, slug, name, primary_area_id→areas, address, is_active, image_status, rating, review_count …).
- **areas**(id, slug, name, "order", is_active). **studio_areas**(studio_id, area_id).
- **sources**(id, name, url, auth_kind, is_active, **code** ∈ `naver/spacecloud`).
- **studio_sources**(id, studio_id, source_id, external_key, url,
  **mapping_status** ∈ `ACTIVE/NEEDS_MAPPING/DISABLED/NOT_FOUND`, last_verified_at …). UNIQUE(studio_id, source_id).
- **room_sources**(id, room_id, source_id, external_key, url, **mapping_status** 동일 enum …). UNIQUE(room_id, source_id).
  spacecloud의 `external_key`는 `"productId:reservationTypeId"`(숫자:숫자) 형식.
- **scrape_jobs**(id, studio_source_id, date_from, date_to,
  status ∈ `PENDING/RUNNING/SUCCESS/FAILED`, priority, run_after TIMESTAMPTZ, attempts, last_error, created_at, updated_at).
  ⚠️ 실제 enum에 `SUCCESS`도 포함됨(요청 설명의 PENDING/RUNNING/FAILED와 다름).
- **scrape_runs**(id, job_id, studio_id, source_id, date_from, date_to,
  status ∈ `SUCCESS/FAILED/PARTIAL`, started_at, finished_at, rooms_found, slots_found,
  error_kind ∈ `TIMEOUT/AUTH_FAILED/PARSE_FAILED/UNKNOWN`, error_message).

전제: 스크래퍼는 slots를 **upsert만** 하고 삭제하지 않는다. 수집주기 약 60분.
타임존: `date`는 KST 기준 영업일. "오늘(KST)" = `(now() AT TIME ZONE 'Asia/Seoul')::date`.

## 점검 항목 (각 항목 SQL → 판정)

아래 가설을 각각 SQL로 검증한다. 떠오르는 다른 각도가 있으면 추가한다.

### 1. 신선도 (Freshness)

```sql
-- 스튜디오/방별 최신 수집 시각 (오래된 순)
SELECT s.name AS studio, r.name AS room,
       MAX(sl.scraped_at) AS last_scraped, now() - MAX(sl.scraped_at) AS age
FROM slots sl JOIN rooms r ON r.id = sl.room_id JOIN studios s ON s.id = r.studio_id
GROUP BY s.name, r.name ORDER BY last_scraped ASC NULLS FIRST LIMIT 30;

-- mapping ACTIVE + 활성 방인데 수집이 3시간+ 오래된(또는 한 번도 없는) 방
SELECT s.name AS studio, r.name AS room, rs.mapping_status,
       MAX(sl.scraped_at) AS last_scraped, now() - MAX(sl.scraped_at) AS age
FROM room_sources rs JOIN rooms r ON r.id = rs.room_id JOIN studios s ON s.id = r.studio_id
LEFT JOIN slots sl ON sl.room_id = r.id
WHERE rs.mapping_status = 'ACTIVE' AND r.is_active
GROUP BY s.name, r.name, rs.mapping_status
HAVING MAX(sl.scraped_at) IS NULL OR MAX(sl.scraped_at) < now() - INTERVAL '3 hours'
ORDER BY last_scraped ASC NULLS FIRST;

-- 미래 날짜 + AVAILABLE 인데 scraped_at 이 낡은(3h+) 슬롯 규모
SELECT count(*) FILTER (WHERE sl.scraped_at < now() - INTERVAL '3 hours') AS stale_future_available,
       count(*) AS total_future_available
FROM slots sl
WHERE sl.status = 'AVAILABLE' AND sl.date >= (now() AT TIME ZONE 'Asia/Seoul')::date;
```

판정 기준: 수집주기 60분이므로 ACTIVE 방의 last_scraped가 수 시간(>3h) 밀리면 이상.
사용자에게 낡은 AVAILABLE이 노출되면 **심각도 높음**.

### 2. 잡 큐 건강도

```sql
SELECT status, count(*) FROM scrape_jobs GROUP BY status ORDER BY status;

-- 좀비: 30분+ RUNNING 정체
SELECT id, studio_source_id, status, updated_at, now() - updated_at AS running_for, attempts
FROM scrape_jobs WHERE status = 'RUNNING' AND updated_at < now() - INTERVAL '30 minutes'
ORDER BY updated_at ASC;

-- run_after 가 한참 과거인데 안 집힌 PENDING
SELECT id, studio_source_id, run_after, now() - run_after AS overdue, attempts
FROM scrape_jobs WHERE status = 'PENDING' AND run_after IS NOT NULL
  AND run_after < now() - INTERVAL '30 minutes' ORDER BY run_after ASC;

-- ACTIVE studio_source 인데 잡이 아예 없음
SELECT ss.id, st.name AS studio, ss.mapping_status
FROM studio_sources ss JOIN studios st ON st.id = ss.studio_id
LEFT JOIN scrape_jobs j ON j.studio_source_id = ss.id
WHERE ss.mapping_status = 'ACTIVE' AND j.id IS NULL;
```

### 3. 수집 신호 (scrape_runs)

```sql
-- SUCCESS 인데 slots_found=0 (빈 응답을 성공처리한 흔적)
SELECT sr.id, st.name AS studio, sr.status, sr.slots_found, sr.rooms_found, sr.started_at
FROM scrape_runs sr JOIN studios st ON st.id = sr.studio_id
WHERE sr.status = 'SUCCESS' AND COALESCE(sr.slots_found, 0) = 0
  AND sr.started_at > now() - INTERVAL '24 hours' ORDER BY sr.started_at DESC;

-- 최근 24h status 비율 (FAILED/PARTIAL 비중)
SELECT status, count(*), round(100.0 * count(*) / SUM(count(*)) OVER (), 1) AS pct
FROM scrape_runs WHERE started_at > now() - INTERVAL '24 hours' GROUP BY status;

-- 스튜디오별 마지막 run 상태
SELECT DISTINCT ON (sr.studio_id) st.name AS studio, sr.status,
       sr.slots_found, sr.error_kind, sr.started_at
FROM scrape_runs sr JOIN studios st ON st.id = sr.studio_id
ORDER BY sr.studio_id, sr.started_at DESC;
```

### 4. 참조 무결성 / 고아

```sql
-- 비활성 room/studio 를 가리키는 미래 AVAILABLE 슬롯(사용자 노출 위험)
SELECT count(*) FROM slots sl
JOIN rooms r ON r.id = sl.room_id JOIN studios s ON s.id = r.studio_id
WHERE (NOT r.is_active OR NOT s.is_active)
  AND sl.date >= (now() AT TIME ZONE 'Asia/Seoul')::date AND sl.status = 'AVAILABLE';

-- ACTIVE studio_source 인데 같은 source 로 매핑된 활성 방(ACTIVE room_source)이 없음
SELECT ss.id, st.name AS studio, ss.source_id
FROM studio_sources ss JOIN studios st ON st.id = ss.studio_id
WHERE ss.mapping_status = 'ACTIVE' AND NOT EXISTS (
  SELECT 1 FROM rooms r JOIN room_sources rs ON rs.room_id = r.id AND rs.source_id = ss.source_id
  WHERE r.studio_id = ss.studio_id AND r.is_active AND rs.mapping_status = 'ACTIVE');

-- is_active 인데 room_sources 가 하나도 없는 방
SELECT r.id, s.name AS studio, r.name AS room
FROM rooms r JOIN studios s ON s.id = r.studio_id
LEFT JOIN room_sources rs ON rs.room_id = r.id
WHERE r.is_active AND rs.id IS NULL;
```

### 5. 슬롯 sanity

```sql
-- CHECK 위반 (자정 예외 제외하고 end<=start 가 있으면 제약이 뚫린 것)
SELECT count(*) AS check_violations FROM slots
WHERE end_time <= start_time AND end_time <> '00:00:00';

-- 가격 이상 분포
SELECT count(*) FILTER (WHERE price IS NULL) AS null_price,
       count(*) FILTER (WHERE price = 0) AS zero_price,
       count(*) FILTER (WHERE price < 0) AS neg_price,
       count(*) FILTER (WHERE price > 200000) AS huge_price,
       min(price) AS min_price, max(price) AS max_price, round(avg(price)) AS avg_price
FROM slots;

-- status 분포
SELECT status, count(*), round(100.0 * count(*) / SUM(count(*)) OVER (), 1) AS pct
FROM slots GROUP BY status ORDER BY count DESC;

-- 과거 날짜 슬롯 누적 규모(upsert만 하므로 계속 쌓임 — 규모만 확인)
SELECT count(*) AS past_slots, min(date) AS oldest_date
FROM slots WHERE date < (now() AT TIME ZONE 'Asia/Seoul')::date;
```

### 6. 커버리지 이상치

```sql
-- 활성 스튜디오/방인데 향후 7일 AVAILABLE 슬롯이 0
SELECT s.name AS studio, r.name AS room
FROM rooms r JOIN studios s ON s.id = r.studio_id
WHERE r.is_active AND s.is_active AND NOT EXISTS (
  SELECT 1 FROM slots sl WHERE sl.room_id = r.id AND sl.status = 'AVAILABLE'
    AND sl.date BETWEEN (now() AT TIME ZONE 'Asia/Seoul')::date
                    AND (now() AT TIME ZONE 'Asia/Seoul')::date + 7)
ORDER BY studio, room;

-- 방별 날짜별 슬롯 수 (요일/날짜 구멍 패턴 확인)
SELECT s.name AS studio, r.name AS room, sl.date, count(*) AS slots
FROM slots sl JOIN rooms r ON r.id = sl.room_id JOIN studios s ON s.id = r.studio_id
WHERE sl.date BETWEEN (now() AT TIME ZONE 'Asia/Seoul')::date
                  AND (now() AT TIME ZONE 'Asia/Seoul')::date + 7
GROUP BY s.name, r.name, sl.date ORDER BY studio, room, sl.date;

-- 스튜디오 간 비교 (future_slots outlier 탐지)
SELECT s.name AS studio, count(*) AS future_slots,
       count(*) FILTER (WHERE sl.status = 'AVAILABLE') AS available
FROM slots sl JOIN rooms r ON r.id = sl.room_id JOIN studios s ON s.id = r.studio_id
WHERE sl.date >= (now() AT TIME ZONE 'Asia/Seoul')::date
GROUP BY s.name ORDER BY future_slots ASC;
```

### 7. 매핑 일관성

```sql
-- spacecloud external_key 가 "숫자:숫자" 패턴에 안 맞는 ACTIVE 행
SELECT rs.id, s.name AS studio, r.name AS room, rs.external_key
FROM room_sources rs JOIN rooms r ON r.id = rs.room_id JOIN studios s ON s.id = r.studio_id
JOIN sources src ON src.id = rs.source_id
WHERE src.code = 'spacecloud' AND rs.mapping_status = 'ACTIVE'
  AND (rs.external_key IS NULL OR rs.external_key !~ '^[0-9]+:[0-9]+$');

-- 중복 스튜디오명
SELECT name, count(*) FROM studios GROUP BY name HAVING count(*) > 1;

-- area 미배정 활성 스튜디오
SELECT id, name FROM studios WHERE is_active AND primary_area_id IS NULL;
```

### 8. 시간 / 타임존

```sql
-- 오늘(KST) 이전 날짜인데 AVAILABLE 로 남은 슬롯 (가짜 노출 위험)
SELECT count(*) FROM slots
WHERE date < (now() AT TIME ZONE 'Asia/Seoul')::date AND status = 'AVAILABLE';

-- 자정 경계 슬롯 규모(end_time='00:00:00' 사용 현황 — 정상 패턴인지 확인)
SELECT count(*) FILTER (WHERE end_time = '00:00:00') AS midnight_end,
       count(*) FILTER (WHERE start_time = '00:00:00') AS midnight_start
FROM slots WHERE date >= (now() AT TIME ZONE 'Asia/Seoul')::date;
```

## 출력 형식

각 점검을 항목별로:

- **점검명 / 판정**: 정상 | 이상
- **근거**: 실제 쿼리 결과(개수, 비율). 이상이면 샘플 행 3~5개(스튜디오명·room·date 포함).
- **심각도**: 높음/중간/낮음 — 기준은 "사용자에게 가짜 정보가 나가는가".

마지막에 **"이상 발견 항목"만** 모은 짧은 요약 테이블을 붙인다. **해결책은 쓰지 마.**
실행한 쿼리도 함께 남겨 재현 가능하게 한다.
