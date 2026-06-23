-- 스페이스클라우드 예약 합주실 배선 (source_id=2).
-- ⚠️ 이 파일은 scripts/apply-spacecloud-mapping.ts 로 생성된다. 직접 수정하지 말고
--    spacecloud-mapping.json 을 고친 뒤 스크립트를 다시 실행할 것.
-- room_sources.external_key 형식: 'productId:reservationTypeId'

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
