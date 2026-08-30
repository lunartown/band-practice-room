-- 네이버 예약 현재 설명에서 종류·수량이 직접 확인되지만 모델이 없거나 일부만
-- 확인되는 장비를 일반 장비 항목으로 반영한다. 추정 모델은 만들지 않는다.

CREATE TEMP TABLE manual_20260830_naver_generic_equipment (
  studio_slug TEXT NOT NULL,
  room_name TEXT NOT NULL,
  business_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  equipment JSONB NOT NULL
);

INSERT INTO manual_20260830_naver_generic_equipment
  (studio_slug, room_name, business_id, item_id, equipment)
VALUES
  ('studio-naver-1016362988', '합주실', '1087298', '5715427', '[
    {"slug":"microphone","note":"Microphone, 최대 4대","quantity":4}
  ]'::jsonb),
  ('studio-naver-1162396534', '합주실', '1260482', '6270352', '[
    {"slug":"acoustic-piano","note":"Yamaha G3 Grand Piano","quantity":1}
  ]'::jsonb),
  ('studio-naver-2039748344', '합주실 대여', '1521871', '7153924', '[
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"keyboard","note":"Keyboard","quantity":1},
    {"slug":"guitar-amp","note":"Electric Guitar Amps, 다수","confidence":"MEDIUM"},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1},
    {"slug":"microphone","note":"Vocal Microphone","quantity":1,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-2091202309', '합주실 렌탈', '1465819', '6941477', '[
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"keyboard","note":"Main/Second Keyboard","quantity":2},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1},
    {"slug":"guitar-amp","note":"Electric Guitar Amp","quantity":1},
    {"slug":"mixer","note":"Mixer","quantity":1},
    {"slug":"speaker","note":"Main Speaker","quantity":1},
    {"slug":"microphone","note":"Microphone","quantity":1}
  ]'::jsonb),
  ('studio-naver-1248890199', '합주실', '1123846', '5808488', '[
    {"slug":"keyboard","note":"Keyboard","quantity":2},
    {"slug":"guitar-amp","note":"Guitar Amp","quantity":2},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1},
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"microphone","note":"Microphone","quantity":5}
  ]'::jsonb),
  ('studio-naver-1205198414', '1번방 - 단체 합주실방(10명 입실가능)', '1387969', '6659810', '[
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"keyboard","note":"Keyboard","quantity":1}
  ]'::jsonb),
  ('studio-naver-1205198414', '2번방 - 단체 합주실방(10명 입실가능)', '1387969', '6659818', '[
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"keyboard","note":"Keyboard","quantity":1}
  ]'::jsonb),
  ('studio-naver-1205198414', '3번방 - 합주실(4명 입실가능)', '1387969', '6659833', '[
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"keyboard","note":"Keyboard","quantity":1}
  ]'::jsonb),
  ('studio-naver-2068483762', '합주실', '1495223', '7068311', '[
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"guitar-amp","note":"Guitar Amp","quantity":2},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1},
    {"slug":"keyboard","note":"Keyboard","quantity":1},
    {"slug":"microphone","note":"Microphone","quantity":2}
  ]'::jsonb),
  ('studio-naver-2000516693', '합주실 A (연습실4) -3~4인, 건반 x', '1709172', '7921919', '[
    {"slug":"drum-kit","note":"Pearl Decade Maple + Yamaha Hybrid Maple Snare","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian S Set + Silk Road Traditional Hi-hat 14","quantity":1},
    {"slug":"bass-amp","note":"Fender Rumble 500","quantity":1},
    {"slug":"guitar-amp","note":"Fender Champion 100","quantity":1}
  ]'::jsonb),
  ('studio-naver-1845196611', '중형합주실 앙상블실(15명 연습공간)', '656151', '6652452', '[
    {"slug":"mixer","note":"Mixer","quantity":1},
    {"slug":"guitar-amp","note":"Guitar Amp","quantity":1},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1},
    {"slug":"music-stand","note":"Music Stands","confidence":"MEDIUM"},
    {"slug":"acoustic-piano","note":"Upright Piano","quantity":1},
    {"slug":"keyboard","note":"Synthesizer","quantity":1}
  ]'::jsonb),
  ('studio-naver-1564915611', '합주실', '1249929', '6238240', '[
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"acoustic-piano","note":"Piano","quantity":1,"confidence":"MEDIUM"},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1},
    {"slug":"guitar-amp","note":"Guitar Amp","quantity":2},
    {"slug":"microphone","note":"Microphone","quantity":2},
    {"slug":"mixer","note":"12채널 Mixer (XLR 6 / 5.5 6)","quantity":1}
  ]'::jsonb),
  ('studio-naver-1945784473', '8. 합주실 (밴드 & 보컬 & 클래식 앙상블)', '991010', '5349224', '[
    {"slug":"acoustic-piano","note":"정기 조율 Piano","quantity":1,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-1441528596', '합주실 대여', '664119', '4539933', '[
    {"slug":"drum-kit","note":"Electronic Drum","quantity":1},
    {"slug":"keyboard","note":"Keyboard","quantity":2},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1},
    {"slug":"guitar-amp","note":"Electric Guitar Amp","quantity":1},
    {"slug":"microphone","note":"Microphone","quantity":7}
  ]'::jsonb),
  ('studio-naver-1458963585', '합주실', '356074', '3430899', '[
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1},
    {"slug":"guitar-amp","note":"Electric Guitar Amp 2대; Acoustic Guitar Amp 1대","quantity":3},
    {"slug":"keyboard","note":"2단 Keyboard","quantity":2},
    {"slug":"microphone","note":"Microphone","quantity":2}
  ]'::jsonb),
  ('studio-naver-2077712012', '밴드합주실', '1676754', '7770255', '[
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"mixer","note":"Mixer","quantity":1},
    {"slug":"guitar-amp","note":"Guitar Amp","quantity":1},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1},
    {"slug":"digital-piano","note":"Digital Piano","quantity":1},
    {"slug":"microphone","note":"Microphone","quantity":1},
    {"slug":"music-stand","note":"Music Stand","quantity":1}
  ]'::jsonb),
  ('studio-naver-1661209508', '합주실, 공연장 대여', '1000887', '5382287', '[
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"guitar-amp","note":"Guitar Amp","quantity":1},
    {"slug":"keyboard","note":"Keyboard","quantity":1},
    {"slug":"microphone","note":"Microphone","quantity":1}
  ]'::jsonb),
  ('studio-naver-2024646212', '합주실 A (성인 취미, 직장인추천)', '1672001', '7751481', '[
    {"slug":"guitar-amp","note":"Guitar Amp","quantity":2},
    {"slug":"bass-amp","note":"Bass Amp","quantity":1},
    {"slug":"keyboard","note":"Kurzweil SP4; 추가 Keyboard 가능","quantity":1},
    {"slug":"drum-kit","note":"Drum Set","quantity":1},
    {"slug":"microphone","note":"Vocal Microphone","quantity":3}
  ]'::jsonb),
  ('studio-naver-1308369398', 'NEW 뮤잼 홀 (합주실)', '1351414', '6697119', '[
    {"slug":"guitar-amp","note":"Fender Deluxe 90 DSP","quantity":1},
    {"slug":"bass-amp","note":"Orange Crush 50","quantity":1},
    {"slug":"drum-kit","note":"DW PDP Drum Set","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian S Series Cymbal Set","quantity":1},
    {"slug":"keyboard","note":"Kurzweil SP4-8","quantity":1},
    {"slug":"microphone","note":"Wired Microphone","quantity":4}
  ]'::jsonb),
  ('studio-naver-1566466933', '합주실', '1673987', '7758890', '[
    {"slug":"keyboard","note":"Keyboard","quantity":1}
  ]'::jsonb),
  ('studio-naver-1247276706', '[ROOM X] 합주실 1', '1123399', '5807807', '[
    {"slug":"keyboard","note":"Synthesizer","quantity":1},
    {"slug":"guitar-amp","note":"Orange Crush; Fender Guitar Amp","quantity":2},
    {"slug":"bass-amp","note":"Fender Bass Amp","quantity":1},
    {"slug":"mixer","note":"Mixer","quantity":1},
    {"slug":"speaker","note":"Speaker","quantity":1},
    {"slug":"drum-kit","note":"5기통 Drum Set","quantity":1},
    {"slug":"cymbal-set","note":"Hi-hat 1; Crash 2; Ride 1","quantity":1},
    {"slug":"microphone","note":"Microphone","quantity":2},
    {"slug":"music-stand","note":"Music Stand","quantity":2}
  ]'::jsonb);

CREATE TEMP TABLE manual_20260830_naver_generic_equipment_rows AS
SELECT seed.studio_slug, seed.room_name, seed.business_id, seed.item_id,
       item.slug AS equipment_slug, item.note,
       NULLIF(item.quantity, 0)::smallint AS quantity,
       COALESCE(item.confidence, 'MEDIUM') AS confidence
FROM manual_20260830_naver_generic_equipment seed
CROSS JOIN LATERAL jsonb_to_recordset(seed.equipment) AS item(
  slug TEXT, note TEXT, quantity INTEGER, confidence TEXT
);

INSERT INTO room_equipment (
  room_id, equipment_id, equipment_model_id, quantity, note, source,
  position_label, is_optional, details
)
SELECT r.id, ei.id, NULL, row.quantity, row.note, 'MANUAL', NULL, false,
       jsonb_build_object('raw_models', row.note)
FROM manual_20260830_naver_generic_equipment_rows row
JOIN studios s ON s.slug = row.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = row.room_name
JOIN equipment_items ei ON ei.slug = row.equipment_slug
ON CONFLICT (room_id, equipment_id, COALESCE(equipment_model_id, 0), COALESCE(position_label, ''))
DO UPDATE SET quantity = EXCLUDED.quantity, note = EXCLUDED.note,
  source = EXCLUDED.source, details = EXCLUDED.details, updated_at = now();

INSERT INTO equipment_evidence (
  evidence_key, target_kind, studio_id, room_id, equipment_id, equipment_model_id,
  room_equipment_id, source_kind, source_url, source_title, raw_name, raw_text,
  parsed_name, position_label, is_optional, confidence, observed_at
)
SELECT 'naver-generic-current:' || row.business_id || ':' || row.item_id || ':' || row.equipment_slug,
       'ROOM', NULL, r.id, ei.id, NULL, re.id, 'NAVER_BOOKING',
       'https://m.booking.naver.com/booking/10/bizes/' || row.business_id || '/items/' || row.item_id,
       s.name || ' ' || r.name || ' 네이버 예약 현재 설명', ei.name, row.note, row.note,
       NULL, false, row.confidence, '2026-08-30T19:00:00+09:00'::timestamptz
FROM manual_20260830_naver_generic_equipment_rows row
JOIN studios s ON s.slug = row.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = row.room_name
JOIN equipment_items ei ON ei.slug = row.equipment_slug
JOIN room_equipment re ON re.room_id = r.id AND re.equipment_id = ei.id
  AND re.equipment_model_id IS NULL AND re.position_label IS NULL
ON CONFLICT (evidence_key) DO UPDATE SET
  room_id = EXCLUDED.room_id, equipment_id = EXCLUDED.equipment_id,
  room_equipment_id = EXCLUDED.room_equipment_id, source_kind = EXCLUDED.source_kind,
  source_url = EXCLUDED.source_url, source_title = EXCLUDED.source_title,
  raw_name = EXCLUDED.raw_name, raw_text = EXCLUDED.raw_text,
  parsed_name = EXCLUDED.parsed_name, confidence = EXCLUDED.confidence,
  observed_at = EXCLUDED.observed_at;

DROP TABLE manual_20260830_naver_generic_equipment_rows;
DROP TABLE manual_20260830_naver_generic_equipment;
