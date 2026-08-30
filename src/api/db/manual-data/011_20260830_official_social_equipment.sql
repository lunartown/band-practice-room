-- 신규 합주실 중 공식 SNS와 최신 운영자 게시물에서 현재 장비표가 확인된 룸을 반영한다.
-- 사운드뱅크는 2026-03 장비 현황과 2026-07~08 공식 인스타 입고 공지를 합쳤다.
-- 로우비는 공식 인스타 계정을 연락처로 명시한 2026년 운영자 게시물의 장비표를 사용한다.

CREATE TEMP TABLE manual_20260830_social_equipment (
  studio_slug TEXT NOT NULL,
  room_name TEXT NOT NULL,
  evidence_prefix TEXT NOT NULL,
  source_kind TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_title TEXT NOT NULL,
  confidence TEXT NOT NULL,
  equipment JSONB NOT NULL
);

INSERT INTO manual_20260830_social_equipment
  (studio_slug, room_name, evidence_prefix, source_kind, source_url, source_title, confidence, equipment)
VALUES
  ('studio-naver-2061039687', '합주실 이용(직장인)', 'soundbank-instagram-20260830',
   'SOCIAL', 'https://www.instagram.com/soundbank_musicspace/',
   '사운드뱅크 뮤직스페이스 공식 인스타그램 장비 현황·입고 공지', 'HIGH', '[
    {"slug":"drum-kit","note":"Yamaha Stage Custom","quantity":1},
    {"slug":"cymbal-set","note":"Anatolian Cymbal Set","quantity":1},
    {"slug":"bass-amp","note":"Mesa/Boogie Subway D-800 + Ampeg 810 Cabinet; Roland RB-70 + SR-120S Cabinet","quantity":2},
    {"slug":"guitar-amp","note":"Mesa/Boogie Mark V 90W + Blackstar Artisan 412; PRS Archon 50 + Blackstar Artisan 412; Marshall JCM2000 DSL100 + 1960 412; Marshall JCM900 SL-X; Vox AC30C2; Roland Jazz Chorus JC-120; Mesa/Boogie Triple Crown TC-50","quantity":7},
    {"slug":"keyboard","note":"Kurzweil PC4; Yamaha MODX6","quantity":2},
    {"slug":"mixer","note":"Canals BKG-160","quantity":1},
    {"slug":"microphone","note":"Shure SM58 2대; Shure SM57 1대","quantity":3},
    {"slug":"speaker","note":"K.M.L VL12 Main Speaker"},
    {"slug":"monitor-speaker","note":"Headrush FRFR-112","quantity":1}
  ]'::jsonb),
  ('studio-naver-1171625350', '합주실 예약', 'lowb-owner-post-20260830',
   'BLOG', 'https://mule.co.kr/m/room/59875519',
   '로우비 스튜디오 운영자 최신 합주실 장비 안내', 'HIGH', '[
    {"slug":"keyboard","note":"Yamaha S90; Yamaha ES6","quantity":2},
    {"slug":"guitar-amp","note":"Blackstar Stage 60; Tech 21 Trademark 60","quantity":2},
    {"slug":"bass-amp","note":"Markbass Big Bang Head + New York Cabinet","quantity":1},
    {"slug":"drum-kit","note":"Mapex Mars Set","quantity":1},
    {"slug":"cymbal-set","note":"Istanbul Agop Cymbal Set","quantity":1},
    {"slug":"speaker","note":"Mackie TH-15A"},
    {"slug":"mixer","note":"Yamaha MG124CX","quantity":1},
    {"slug":"microphone","note":"Shure SM58 / SM58S"}
  ]'::jsonb);

CREATE TEMP TABLE manual_20260830_social_equipment_rows AS
SELECT seed.studio_slug, seed.room_name, seed.evidence_prefix, seed.source_kind,
       seed.source_url, seed.source_title, seed.confidence,
       item.slug AS equipment_slug, item.note,
       NULLIF(item.quantity, 0)::smallint AS quantity
FROM manual_20260830_social_equipment seed
CROSS JOIN LATERAL jsonb_to_recordset(seed.equipment) AS item(
  slug TEXT, note TEXT, quantity INTEGER
);

INSERT INTO room_equipment (
  room_id, equipment_id, equipment_model_id, quantity, note, source,
  position_label, is_optional, details
)
SELECT r.id, ei.id, NULL, row.quantity, row.note, 'MANUAL', NULL, false,
       jsonb_build_object('raw_models', row.note)
FROM manual_20260830_social_equipment_rows row
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
SELECT row.evidence_prefix || ':' || row.equipment_slug,
       'ROOM', NULL, r.id, ei.id, NULL, re.id, row.source_kind,
       row.source_url, row.source_title, ei.name, row.note, left(row.note, 192),
       NULL, false, row.confidence, '2026-08-30T17:10:00+09:00'::timestamptz
FROM manual_20260830_social_equipment_rows row
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

DROP TABLE manual_20260830_social_equipment_rows;
DROP TABLE manual_20260830_social_equipment;
