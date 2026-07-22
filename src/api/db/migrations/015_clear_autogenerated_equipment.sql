DELETE FROM room_equipment
WHERE source = 'SCRAPED';

DELETE FROM studio_equipment
WHERE source = 'SCRAPED';

DELETE FROM equipment_evidence
WHERE source_kind = 'NAVER_BOOKING'
  AND observed_at = '2026-07-22T00:00:00+09:00'::timestamptz;
