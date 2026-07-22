DELETE FROM room_equipment
WHERE source = 'SCRAPED';

DELETE FROM studio_equipment
WHERE source = 'SCRAPED';

DELETE FROM equipment_evidence
WHERE source_kind = 'NAVER_BOOKING';
