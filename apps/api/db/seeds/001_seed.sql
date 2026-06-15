INSERT INTO areas (id, slug, name, "order", is_active)
VALUES
  (1, 'hongdae', '홍대', 1, true),
  (2, 'sinchon', '신촌', 2, true),
  (3, 'hapjeong', '합정', 3, true)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  "order" = EXCLUDED."order",
  is_active = EXCLUDED.is_active;

INSERT INTO studios (id, slug, name, description, primary_area_id, address, is_active)
VALUES
  (1, 'mapo-studio', '마포 합주실', 'seed 데이터용 합주실', 1, '서울시 마포구 와우산로 1', true),
  (2, 'sinchon-band-room', '신촌 밴드룸', 'seed 데이터용 합주실', 2, '서울시 서대문구 신촌로 1', true)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  primary_area_id = EXCLUDED.primary_area_id,
  address = EXCLUDED.address,
  is_active = EXCLUDED.is_active;

INSERT INTO studio_areas (studio_id, area_id)
VALUES
  (1, 1),
  (1, 3),
  (2, 2)
ON CONFLICT (studio_id, area_id) DO NOTHING;

INSERT INTO sources (id, name, url, auth_kind, is_active)
VALUES
  (1, '네이버 예약', 'https://booking.naver.com/', 'NONE', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  auth_kind = EXCLUDED.auth_kind,
  is_active = EXCLUDED.is_active;

INSERT INTO studio_sources (studio_id, source_id, external_key, url)
VALUES
  (1, 1, 'mapo-studio', 'https://booking.naver.com/mapo-studio'),
  (2, 1, 'sinchon-band-room', 'https://booking.naver.com/sinchon-band-room')
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key,
  url = EXCLUDED.url;

INSERT INTO rooms (id, studio_id, name, price_per_hour, price_source, capacity_min, capacity_max, is_active)
VALUES
  (1, 1, 'A룸', 15000, 'MANUAL', 2, 6, true),
  (2, 1, 'B룸', 20000, 'MANUAL', 4, 8, true),
  (3, 2, '드럼룸', 18000, 'MANUAL', 2, 5, true)
ON CONFLICT (id) DO UPDATE SET
  studio_id = EXCLUDED.studio_id,
  name = EXCLUDED.name,
  price_per_hour = EXCLUDED.price_per_hour,
  price_source = EXCLUDED.price_source,
  capacity_min = EXCLUDED.capacity_min,
  capacity_max = EXCLUDED.capacity_max,
  is_active = EXCLUDED.is_active;

INSERT INTO room_sources (room_id, source_id, external_key, url)
VALUES
  (1, 1, 'mapo-a', 'https://booking.naver.com/mapo-studio/rooms/a'),
  (2, 1, 'mapo-b', 'https://booking.naver.com/mapo-studio/rooms/b'),
  (3, 1, 'sinchon-drum', 'https://booking.naver.com/sinchon-band-room/rooms/drum')
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key,
  url = EXCLUDED.url;

INSERT INTO slots (room_id, date, start_time, end_time, status, price, price_source, scraped_at)
VALUES
  (1, '2026-06-15', '09:00', '10:00', 'AVAILABLE', 15000, 'MANUAL', '2026-06-15T00:00:00.000Z'),
  (1, '2026-06-15', '10:00', '11:00', 'UNAVAILABLE', NULL, 'UNKNOWN', '2026-06-15T00:00:00.000Z'),
  (2, '2026-06-16', '19:00', '21:00', 'AVAILABLE', 40000, 'MANUAL', '2026-06-15T00:00:00.000Z'),
  (3, '2026-06-17', '20:00', '22:00', 'AVAILABLE', 36000, 'MANUAL', '2026-06-15T00:00:00.000Z'),
  (3, '2026-06-18', '18:00', '20:00', 'UNKNOWN', NULL, 'UNKNOWN', '2026-06-15T00:00:00.000Z')
ON CONFLICT (room_id, date, start_time) DO UPDATE SET
  end_time = EXCLUDED.end_time,
  status = EXCLUDED.status,
  price = EXCLUDED.price,
  price_source = EXCLUDED.price_source,
  scraped_at = EXCLUDED.scraped_at;

SELECT setval(pg_get_serial_sequence('areas', 'id'), (SELECT MAX(id) FROM areas));
SELECT setval(pg_get_serial_sequence('studios', 'id'), (SELECT MAX(id) FROM studios));
SELECT setval(pg_get_serial_sequence('sources', 'id'), (SELECT MAX(id) FROM sources));
SELECT setval(pg_get_serial_sequence('rooms', 'id'), (SELECT MAX(id) FROM rooms));
