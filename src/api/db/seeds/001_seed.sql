INSERT INTO areas (id, slug, name, "order", is_active)
VALUES
  (1, 'hongdae', '홍대', 1, true),
  (2, 'hapjeong', '합정', 2, true),
  (3, 'sinchon', '신촌', 3, true)
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

INSERT INTO sources (id, name, url, auth_kind, is_active)
VALUES
  (1, '네이버 예약', 'https://booking.naver.com/', 'NONE', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  auth_kind = EXCLUDED.auth_kind,
  is_active = EXCLUDED.is_active;

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
