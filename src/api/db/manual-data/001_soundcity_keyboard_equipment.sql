WITH model_seed(equipment_slug, slug, brand, model, variant, display_name, normalized_name, specs) AS (
  VALUES
    ('keyboard', 'yamaha-s90', 'Yamaha', 'S90', NULL, 'Yamaha S90', 'yamaha s90', '{}'::jsonb),
    ('keyboard', 'yamaha-s90es', 'Yamaha', 'S90ES', NULL, 'Yamaha S90ES', 'yamaha s90es', '{}'::jsonb),
    ('keyboard', 'yamaha-motif-7', 'Yamaha', 'Motif 7', NULL, 'Yamaha Motif 7', 'yamaha motif 7', '{}'::jsonb),
    ('keyboard', 'yamaha-motif-es8', 'Yamaha', 'Motif ES8', NULL, 'Yamaha Motif ES8', 'yamaha motif es8', '{}'::jsonb),
    ('keyboard', 'yamaha-motif-xf8', 'Yamaha', 'Motif XF8', NULL, 'Yamaha Motif XF8', 'yamaha motif xf8', '{}'::jsonb),
    ('keyboard', 'yamaha-modx7-plus', 'Yamaha', 'MODX7+', NULL, 'Yamaha MODX7+', 'yamaha modx7 plus', '{}'::jsonb),
    ('keyboard', 'korg-kross-61', 'Korg', 'Kross 61', NULL, 'Korg Kross 61', 'korg kross 61', '{}'::jsonb)
)
INSERT INTO equipment_models (
  equipment_id,
  slug,
  brand,
  model,
  variant,
  display_name,
  normalized_name,
  specs
)
SELECT
  ei.id,
  model_seed.slug,
  model_seed.brand,
  model_seed.model,
  model_seed.variant,
  model_seed.display_name,
  model_seed.normalized_name,
  model_seed.specs
FROM model_seed
JOIN equipment_items ei ON ei.slug = model_seed.equipment_slug
ON CONFLICT (slug) DO UPDATE SET
  equipment_id = EXCLUDED.equipment_id,
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  variant = EXCLUDED.variant,
  display_name = EXCLUDED.display_name,
  normalized_name = EXCLUDED.normalized_name,
  specs = EXCLUDED.specs,
  is_active = true,
  updated_at = now();

WITH placement_seed(
  studio_slug,
  room_name,
  equipment_slug,
  model_slug,
  position_label,
  is_optional,
  details,
  evidence_key,
  source_url,
  source_title,
  raw_text,
  parsed_name,
  confidence
) AS (
  VALUES
    ('studio-합정/홍대-사운드시티', 'Live Room', 'keyboard', 'yamaha-s90es', NULL, false, '{}'::jsonb, 'naver:1033058:5933800:keyboard:yamaha-s90es', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '야마하 S90ES', 'Yamaha S90ES', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Live Room', 'keyboard', 'yamaha-motif-es8', NULL, false, '{}'::jsonb, 'naver:1033058:5933800:keyboard:yamaha-motif-es8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '야마하 모티프 ES 8', 'Yamaha Motif ES8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Live Room', 'keyboard', 'yamaha-motif-7', NULL, false, '{}'::jsonb, 'naver:1033058:5933800:keyboard:yamaha-motif-7', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '야마하 모티프 7', 'Yamaha Motif 7', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room A', 'keyboard', 'yamaha-motif-xf8', NULL, false, '{}'::jsonb, 'naver:1033058:5486389:keyboard:yamaha-motif-xf8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '야마하 모티프 XF8', 'Yamaha Motif XF8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room A', 'keyboard', 'yamaha-modx7-plus', NULL, false, '{}'::jsonb, 'naver:1033058:5486389:keyboard:yamaha-modx7-plus', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', 'modx 7플러스', 'Yamaha MODX7+', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room A', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486389:keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '코르그 크로스61(옵션)', 'Korg Kross 61', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room B', 'keyboard', 'yamaha-motif-xf8', NULL, false, '{"keys":88,"action":"hammer"}'::jsonb, 'naver:1033058:5486506:keyboard:yamaha-motif-xf8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '야마하 모티프 XF8 88 (해머)', 'Yamaha Motif XF8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room B', 'keyboard', 'yamaha-modx7-plus', NULL, false, '{}'::jsonb, 'naver:1033058:5486506:keyboard:yamaha-modx7-plus', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', 'modx 7플러스', 'Yamaha MODX7+', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room B', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486506:keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '코르그 크로스61(옵션)', 'Korg Kross 61', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room C', 'keyboard', 'yamaha-motif-xf8', NULL, false, '{}'::jsonb, 'naver:1033058:5486549:keyboard:yamaha-motif-xf8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '모티프 XF8', 'Yamaha Motif XF8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room C', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486549:optional-keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '옵션:korg kros 61 랜트가능', 'Korg Kross 61', 'MEDIUM'),
    ('studio-합정/홍대-사운드시티', 'Room D', 'keyboard', 'yamaha-s90', NULL, false, '{"keys":88}'::jsonb, 'naver:1033058:5486609:keyboard:yamaha-s90', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '야마하 S90 88', 'Yamaha S90', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room D', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486609:optional-keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '옵션:코르그 크로스 61 랜트 가능', 'Korg Kross 61', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room E', 'keyboard', 'yamaha-s90', NULL, false, '{"keys":88}'::jsonb, 'naver:1033058:5486623:keyboard:yamaha-s90', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '야마하 S90 88', 'Yamaha S90', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room E', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486623:optional-keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '옵션.코르그 크로스 61 랜트 가능', 'Korg Kross 61', 'HIGH')
)
DELETE FROM room_equipment re
USING placement_seed
JOIN studios s ON s.slug = placement_seed.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = placement_seed.room_name
JOIN equipment_items ei ON ei.slug = placement_seed.equipment_slug
JOIN equipment_models em ON em.slug = placement_seed.model_slug
WHERE re.room_id = r.id
  AND re.equipment_id = ei.id
  AND re.equipment_model_id = em.id
  AND re.position_label IS NOT DISTINCT FROM placement_seed.position_label;

WITH placement_seed(
  studio_slug,
  room_name,
  equipment_slug,
  model_slug,
  position_label,
  is_optional,
  details,
  evidence_key,
  source_url,
  source_title,
  raw_text,
  parsed_name,
  confidence
) AS (
  VALUES
    ('studio-합정/홍대-사운드시티', 'Live Room', 'keyboard', 'yamaha-s90es', NULL, false, '{}'::jsonb, 'naver:1033058:5933800:keyboard:yamaha-s90es', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '야마하 S90ES', 'Yamaha S90ES', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Live Room', 'keyboard', 'yamaha-motif-es8', NULL, false, '{}'::jsonb, 'naver:1033058:5933800:keyboard:yamaha-motif-es8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '야마하 모티프 ES 8', 'Yamaha Motif ES8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Live Room', 'keyboard', 'yamaha-motif-7', NULL, false, '{}'::jsonb, 'naver:1033058:5933800:keyboard:yamaha-motif-7', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '야마하 모티프 7', 'Yamaha Motif 7', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room A', 'keyboard', 'yamaha-motif-xf8', NULL, false, '{}'::jsonb, 'naver:1033058:5486389:keyboard:yamaha-motif-xf8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '야마하 모티프 XF8', 'Yamaha Motif XF8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room A', 'keyboard', 'yamaha-modx7-plus', NULL, false, '{}'::jsonb, 'naver:1033058:5486389:keyboard:yamaha-modx7-plus', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', 'modx 7플러스', 'Yamaha MODX7+', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room A', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486389:keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '코르그 크로스61(옵션)', 'Korg Kross 61', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room B', 'keyboard', 'yamaha-motif-xf8', NULL, false, '{"keys":88,"action":"hammer"}'::jsonb, 'naver:1033058:5486506:keyboard:yamaha-motif-xf8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '야마하 모티프 XF8 88 (해머)', 'Yamaha Motif XF8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room B', 'keyboard', 'yamaha-modx7-plus', NULL, false, '{}'::jsonb, 'naver:1033058:5486506:keyboard:yamaha-modx7-plus', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', 'modx 7플러스', 'Yamaha MODX7+', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room B', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486506:keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '코르그 크로스61(옵션)', 'Korg Kross 61', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room C', 'keyboard', 'yamaha-motif-xf8', NULL, false, '{}'::jsonb, 'naver:1033058:5486549:keyboard:yamaha-motif-xf8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '모티프 XF8', 'Yamaha Motif XF8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room C', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486549:optional-keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '옵션:korg kros 61 랜트가능', 'Korg Kross 61', 'MEDIUM'),
    ('studio-합정/홍대-사운드시티', 'Room D', 'keyboard', 'yamaha-s90', NULL, false, '{"keys":88}'::jsonb, 'naver:1033058:5486609:keyboard:yamaha-s90', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '야마하 S90 88', 'Yamaha S90', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room D', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486609:optional-keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '옵션:코르그 크로스 61 랜트 가능', 'Korg Kross 61', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room E', 'keyboard', 'yamaha-s90', NULL, false, '{"keys":88}'::jsonb, 'naver:1033058:5486623:keyboard:yamaha-s90', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '야마하 S90 88', 'Yamaha S90', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room E', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486623:optional-keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '옵션.코르그 크로스 61 랜트 가능', 'Korg Kross 61', 'HIGH')
)
INSERT INTO room_equipment (
  room_id,
  equipment_id,
  equipment_model_id,
  quantity,
  note,
  source,
  position_label,
  is_optional,
  details
)
SELECT
  r.id,
  ei.id,
  em.id,
  1,
  NULL,
  'MANUAL',
  placement_seed.position_label,
  placement_seed.is_optional,
  placement_seed.details
FROM placement_seed
JOIN studios s ON s.slug = placement_seed.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = placement_seed.room_name
JOIN equipment_items ei ON ei.slug = placement_seed.equipment_slug
JOIN equipment_models em ON em.slug = placement_seed.model_slug;

DELETE FROM equipment_evidence
WHERE evidence_key LIKE 'naver:1033058:%:keyboard-i:%'
   OR evidence_key LIKE 'naver:1033058:%:keyboard-ii:%'
   OR evidence_key LIKE 'naver:1033058:%:keyboard-iii:%';

WITH placement_seed(
  studio_slug,
  room_name,
  equipment_slug,
  model_slug,
  position_label,
  is_optional,
  details,
  evidence_key,
  source_url,
  source_title,
  raw_text,
  parsed_name,
  confidence
) AS (
  VALUES
    ('studio-합정/홍대-사운드시티', 'Live Room', 'keyboard', 'yamaha-s90es', NULL, false, '{}'::jsonb, 'naver:1033058:5933800:keyboard:yamaha-s90es', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '야마하 S90ES', 'Yamaha S90ES', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Live Room', 'keyboard', 'yamaha-motif-es8', NULL, false, '{}'::jsonb, 'naver:1033058:5933800:keyboard:yamaha-motif-es8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '야마하 모티프 ES 8', 'Yamaha Motif ES8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Live Room', 'keyboard', 'yamaha-motif-7', NULL, false, '{}'::jsonb, 'naver:1033058:5933800:keyboard:yamaha-motif-7', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '야마하 모티프 7', 'Yamaha Motif 7', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room A', 'keyboard', 'yamaha-motif-xf8', NULL, false, '{}'::jsonb, 'naver:1033058:5486389:keyboard:yamaha-motif-xf8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '야마하 모티프 XF8', 'Yamaha Motif XF8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room A', 'keyboard', 'yamaha-modx7-plus', NULL, false, '{}'::jsonb, 'naver:1033058:5486389:keyboard:yamaha-modx7-plus', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', 'modx 7플러스', 'Yamaha MODX7+', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room A', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486389:keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '코르그 크로스61(옵션)', 'Korg Kross 61', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room B', 'keyboard', 'yamaha-motif-xf8', NULL, false, '{"keys":88,"action":"hammer"}'::jsonb, 'naver:1033058:5486506:keyboard:yamaha-motif-xf8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '야마하 모티프 XF8 88 (해머)', 'Yamaha Motif XF8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room B', 'keyboard', 'yamaha-modx7-plus', NULL, false, '{}'::jsonb, 'naver:1033058:5486506:keyboard:yamaha-modx7-plus', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', 'modx 7플러스', 'Yamaha MODX7+', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room B', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486506:keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '코르그 크로스61(옵션)', 'Korg Kross 61', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room C', 'keyboard', 'yamaha-motif-xf8', NULL, false, '{}'::jsonb, 'naver:1033058:5486549:keyboard:yamaha-motif-xf8', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '모티프 XF8', 'Yamaha Motif XF8', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room C', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486549:optional-keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '옵션:korg kros 61 랜트가능', 'Korg Kross 61', 'MEDIUM'),
    ('studio-합정/홍대-사운드시티', 'Room D', 'keyboard', 'yamaha-s90', NULL, false, '{"keys":88}'::jsonb, 'naver:1033058:5486609:keyboard:yamaha-s90', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '야마하 S90 88', 'Yamaha S90', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room D', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486609:optional-keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '옵션:코르그 크로스 61 랜트 가능', 'Korg Kross 61', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room E', 'keyboard', 'yamaha-s90', NULL, false, '{"keys":88}'::jsonb, 'naver:1033058:5486623:keyboard:yamaha-s90', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '야마하 S90 88', 'Yamaha S90', 'HIGH'),
    ('studio-합정/홍대-사운드시티', 'Room E', 'keyboard', 'korg-kross-61', NULL, true, '{}'::jsonb, 'naver:1033058:5486623:optional-keyboard:korg-kross-61', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '옵션.코르그 크로스 61 랜트 가능', 'Korg Kross 61', 'HIGH')
)
INSERT INTO equipment_evidence (
  evidence_key,
  target_kind,
  studio_id,
  room_id,
  equipment_id,
  equipment_model_id,
  room_equipment_id,
  source_kind,
  source_url,
  source_title,
  raw_name,
  raw_text,
  parsed_name,
  position_label,
  is_optional,
  confidence,
  observed_at
)
SELECT
  placement_seed.evidence_key,
  'ROOM',
  NULL,
  r.id,
  ei.id,
  em.id,
  re.id,
  'NAVER_BOOKING',
  placement_seed.source_url,
  placement_seed.source_title,
  '방 설명',
  placement_seed.raw_text,
  placement_seed.parsed_name,
  placement_seed.position_label,
  placement_seed.is_optional,
  placement_seed.confidence,
  '2026-07-22T11:00:00+09:00'::timestamptz
FROM placement_seed
JOIN studios s ON s.slug = placement_seed.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = placement_seed.room_name
JOIN equipment_items ei ON ei.slug = placement_seed.equipment_slug
JOIN equipment_models em ON em.slug = placement_seed.model_slug
JOIN room_equipment re
  ON re.room_id = r.id
  AND re.equipment_id = ei.id
  AND re.equipment_model_id = em.id
  AND re.position_label IS NOT DISTINCT FROM placement_seed.position_label
ON CONFLICT (evidence_key) DO UPDATE SET
  room_id = EXCLUDED.room_id,
  equipment_id = EXCLUDED.equipment_id,
  equipment_model_id = EXCLUDED.equipment_model_id,
  room_equipment_id = EXCLUDED.room_equipment_id,
  source_kind = EXCLUDED.source_kind,
  source_url = EXCLUDED.source_url,
  source_title = EXCLUDED.source_title,
  raw_name = EXCLUDED.raw_name,
  raw_text = EXCLUDED.raw_text,
  parsed_name = EXCLUDED.parsed_name,
  position_label = EXCLUDED.position_label,
  is_optional = EXCLUDED.is_optional,
  confidence = EXCLUDED.confidence,
  observed_at = EXCLUDED.observed_at;
