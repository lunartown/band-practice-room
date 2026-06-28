-- 주의: area id 1~3 은 002_studios.sql 과 반드시 동일해야 한다.
-- (예전에 여기서 홍대/합정/신촌으로 쪼개 두는 바람에 002 의 합정/홍대 통합과 충돌해
--  스튜디오들이 한 칸씩 밀려 잘못된 지역에 붙는 사고가 났다.)
INSERT INTO areas (id, slug, name, "order", is_active)
VALUES
  (1, 'hapjeong-hongdae', '합정/홍대', 1, true),
  (2, 'sinchon', '신촌', 2, true),
  (3, 'sadang-isu', '사당/이수', 3, true)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  "order" = EXCLUDED."order",
  is_active = EXCLUDED.is_active;

INSERT INTO studios (id, slug, name, description, primary_area_id, address, is_active)
VALUES
  (1, 'ground-hongdae', '그라운드합주실 홍대 본점', NULL, 1, '서울 마포구 동교로 162-5', true)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  primary_area_id = EXCLUDED.primary_area_id,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active;

INSERT INTO studio_areas (studio_id, area_id)
VALUES
  (1, 1)
ON CONFLICT (studio_id, area_id) DO NOTHING;

-- code 컬럼은 006 마이그레이션에서 추가된다(migrate → seed 순서 보장).
INSERT INTO sources (id, name, url, auth_kind, credential_key, is_active, code)
VALUES
  (1, '네이버 예약', 'https://booking.naver.com/', 'NONE', NULL, true, 'naver'),
  (2, '스페이스클라우드', 'https://www.spacecloud.kr/', 'MANUAL_SESSION', 'SPACECLOUD_API_TOKEN', true, 'spacecloud')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  auth_kind = EXCLUDED.auth_kind,
  credential_key = EXCLUDED.credential_key,
  is_active = EXCLUDED.is_active,
  code = EXCLUDED.code;

-- url: 네이버 예약 모바일 URL (스크래퍼가 이 URL로 접근)
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
VALUES
  (1, 1, '1061592', 'https://m.booking.naver.com/booking/10/bizes/1061592')
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key,
  url = EXCLUDED.url;

INSERT INTO rooms (id, studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active)
VALUES
  (1, 1, 'S룸',  15000, 'MANUAL', 2, 4, true),
  (2, 1, 'A1',   18000, 'MANUAL', 2, 6, true),
  (3, 1, 'A2',   18000, 'MANUAL', 2, 6, true),
  (4, 1, 'A3',   18000, 'MANUAL', 2, 6, true),
  (5, 1, 'B1',   22000, 'MANUAL', 4, 8, true),
  (6, 1, 'B2',   22000, 'MANUAL', 4, 8, true)
ON CONFLICT (id) DO UPDATE SET
  studio_id     = EXCLUDED.studio_id,
  name          = EXCLUDED.name,
  price_per_hour = EXCLUDED.price_per_hour,
  price_source  = EXCLUDED.price_source,
  capacity_min  = EXCLUDED.capacity_min,
  capacity_max  = EXCLUDED.capacity_max,
  is_active     = EXCLUDED.is_active;

SELECT setval(pg_get_serial_sequence('areas',   'id'), (SELECT MAX(id) FROM areas));
SELECT setval(pg_get_serial_sequence('studios',  'id'), (SELECT MAX(id) FROM studios));
SELECT setval(pg_get_serial_sequence('sources',  'id'), (SELECT MAX(id) FROM sources));
SELECT setval(pg_get_serial_sequence('rooms',    'id'), (SELECT MAX(id) FROM rooms));
