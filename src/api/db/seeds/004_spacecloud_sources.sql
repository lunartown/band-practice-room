-- 스페이스클라우드 예약 합주실 배선 (source_id=2).
-- ⚠️ 이 파일은 scripts/apply-spacecloud-mapping.ts 로 생성된다. 직접 수정하지 말고
--    spacecloud-mapping.json 을 고친 뒤 스크립트를 다시 실행할 것.
-- room_sources.external_key 형식: 'productId:reservationTypeId'

-- studio-합정/홍대-앨리
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
SELECT id, 2, '9391', 'https://www.spacecloud.kr/space/9391' FROM studios WHERE slug = 'studio-합정/홍대-앨리'
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '14175:42936', 'https://www.spacecloud.kr/space/9391' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-합정/홍대-앨리' AND r.name = '부스1'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '14176:42933', 'https://www.spacecloud.kr/space/9391' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-합정/홍대-앨리' AND r.name = '부스2'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '14177:42934', 'https://www.spacecloud.kr/space/9391' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-합정/홍대-앨리' AND r.name = '부스3'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '14178:42935', 'https://www.spacecloud.kr/space/9391' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-합정/홍대-앨리' AND r.name = '부스4'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;

-- studio-합정/홍대-홍대리엠뮤직
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
SELECT id, 2, '25558', 'https://www.spacecloud.kr/space/25558' FROM studios WHERE slug = 'studio-합정/홍대-홍대리엠뮤직'
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '41963:80189', 'https://www.spacecloud.kr/space/25558' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-합정/홍대-홍대리엠뮤직' AND r.name = '합주실'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;

-- studio-신촌-신촌fms
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
SELECT id, 2, '4817', 'https://www.spacecloud.kr/space/4817' FROM studios WHERE slug = 'studio-신촌-신촌fms'
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '7459:39277', 'https://www.spacecloud.kr/space/4817' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-신촌-신촌fms' AND r.name = '합주실'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;

-- studio-혜화/성신여대-성북천-음악소
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
SELECT id, 2, '27007', 'https://www.spacecloud.kr/space/27007' FROM studios WHERE slug = 'studio-혜화/성신여대-성북천-음악소'
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '44815:84988', 'https://www.spacecloud.kr/space/27007' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-혜화/성신여대-성북천-음악소' AND r.name = '1번방'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;

-- studio-강남-레드스튜디오
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
SELECT id, 2, '4572', 'https://www.spacecloud.kr/space/4572' FROM studios WHERE slug = 'studio-강남-레드스튜디오'
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '7042:38765', 'https://www.spacecloud.kr/space/4572' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-강남-레드스튜디오' AND r.name = '합주실'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;

-- studio-강남-리엠뮤직-강남
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
SELECT id, 2, '46871', 'https://www.spacecloud.kr/space/46871' FROM studios WHERE slug = 'studio-강남-리엠뮤직-강남'
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '78000:139605', 'https://www.spacecloud.kr/space/46871' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-강남-리엠뮤직-강남' AND r.name = '리엠뮤직합주실'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;

-- studio-강동/송파-리엠뮤직-잠실
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
SELECT id, 2, '59441', 'https://www.spacecloud.kr/space/59441' FROM studios WHERE slug = 'studio-강동/송파-리엠뮤직-잠실'
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '98507:174256', 'https://www.spacecloud.kr/space/59441' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-강동/송파-리엠뮤직-잠실' AND r.name = '리엠뮤직합주실'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;

-- studio-기타-서울-리엠뮤직-숙대입구
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
SELECT id, 2, '63705', 'https://www.spacecloud.kr/space/63705' FROM studios WHERE slug = 'studio-기타-서울-리엠뮤직-숙대입구'
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '105117:185125', 'https://www.spacecloud.kr/space/63705' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-기타-서울-리엠뮤직-숙대입구' AND r.name = '리엠뮤직합주실'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;

-- studio-기타-서울-리엠뮤직-건대
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
SELECT id, 2, '19861', 'https://www.spacecloud.kr/space/19861' FROM studios WHERE slug = 'studio-기타-서울-리엠뮤직-건대'
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '34500:68254', 'https://www.spacecloud.kr/space/19861' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-기타-서울-리엠뮤직-건대' AND r.name = '1번방'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '32428:63621', 'https://www.spacecloud.kr/space/19861' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-기타-서울-리엠뮤직-건대' AND r.name = '2번방'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;

-- studio-기타-서울-리엠뮤직-금호
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
SELECT id, 2, '69512', 'https://www.spacecloud.kr/space/69512' FROM studios WHERE slug = 'studio-기타-서울-리엠뮤직-금호'
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '114094:200146', 'https://www.spacecloud.kr/space/69512' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-기타-서울-리엠뮤직-금호' AND r.name = '리엠뮤직합주실'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;

-- studio-기타-서울-헤르츠
INSERT INTO studio_sources (studio_id, source_id, external_key, url)
SELECT id, 2, '20018', 'https://www.spacecloud.kr/space/20018' FROM studios WHERE slug = 'studio-기타-서울-헤르츠'
ON CONFLICT (studio_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '32699:63729', 'https://www.spacecloud.kr/space/20018' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-기타-서울-헤르츠' AND r.name = '메인합주실'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
INSERT INTO room_sources (room_id, source_id, external_key, url)
SELECT r.id, 2, '66375:120194', 'https://www.spacecloud.kr/space/20018' FROM rooms r JOIN studios s ON r.studio_id = s.id
WHERE s.slug = 'studio-기타-서울-헤르츠' AND r.name = '그랜드합주실 B Room'
ON CONFLICT (room_id, source_id) DO UPDATE SET
  external_key = EXCLUDED.external_key, url = EXCLUDED.url;
