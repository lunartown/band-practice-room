-- 네이버 예약 상품의 추가 설명(extraDescJson)에 공개된 룸별 장비표를 반영한다.
-- 기본 설명만 읽던 기존 감사에서 누락된 현재 운영자 관리 원문이다.

CREATE TEMP TABLE manual_20260830_naver_extra_equipment (
  studio_slug TEXT NOT NULL,
  room_name TEXT NOT NULL,
  business_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  equipment JSONB NOT NULL
);

INSERT INTO manual_20260830_naver_extra_equipment
  (studio_slug, room_name, business_id, item_id, equipment)
VALUES
  ('studio-naver-2011868968', '합주실', '1567952', '7319177', '[
    {"slug":"drum-kit","note":"Pearl Export","quantity":1},
    {"slug":"bass-amp","note":"Fender Rumble 200","quantity":1},
    {"slug":"guitar-amp","note":"Marshall MG100; Fender Champion 100","quantity":2},
    {"slug":"keyboard","note":"Kurzweil SP7","quantity":1},
    {"slug":"microphone","note":"Shure PGA58","quantity":2}
  ]'::jsonb),
  ('studio-naver-1843009753', '합주실 예약', '1134440', '5844329', '[
    {"slug":"microphone","note":"Shure SM58SK 2대; Sennheiser E835-S","quantity":3},
    {"slug":"mixer","note":"Yamaha MG16XU","quantity":1},
    {"slug":"speaker","note":"Yamaha CHR15 + PX10","quantity":1},
    {"slug":"guitar-amp","note":"Orange Super Crush 100 + PPC212V; Blackstar HT Club 50 + Marshall 1936; AER Compact 60/3","quantity":3},
    {"slug":"bass-amp","note":"Ampeg Rocket Bass RB210","quantity":1},
    {"slug":"keyboard","note":"Yamaha Motif XF8","quantity":1},
    {"slug":"drum-kit","note":"Gretsch Catalina Maple 5기통","quantity":1},
    {"slug":"cymbal-set","note":"Istanbul Agop Xist Brilliant Set","quantity":1}
  ]'::jsonb),
  ('studio-naver-1574591189', '합주실 이용 1시간 ', '1301440', '6422602', '[
    {"slug":"drum-kit","note":"Gretsch Catalina","quantity":1},
    {"slug":"bass-amp","note":"Ampeg BA-110","quantity":1},
    {"slug":"guitar-amp","note":"Fender Champion 40; Orange Crush 35","quantity":2},
    {"slug":"keyboard","note":"Yamaha MOXF8","quantity":1},
    {"slug":"speaker","note":"Yamaha Stagepas 400","quantity":1}
  ]'::jsonb),
  ('studio-naver-1646463548', '에이타입사운드 라운지', '984268', '5326848', '[
    {"slug":"guitar-amp","note":"Marshall SC20C Plexi Combo 145; Roland Jazz Chorus JC-40","quantity":2},
    {"slug":"bass-amp","note":"Hartke KB12","quantity":1},
    {"slug":"keyboard","note":"Yamaha MX88; Yamaha Motif XF8","quantity":2},
    {"slug":"speaker","note":"Eric ER-15W 1조","quantity":2},
    {"slug":"mixer","note":"Behringer Xenyx X1222 12채널","quantity":1},
    {"slug":"drum-kit","note":"Pearl Export Taiwan Full Set","quantity":1},
    {"slug":"microphone","note":"Shure SM58","quantity":3}
  ]'::jsonb),
  ('studio-naver-1175196607', 'A룸 (10명 적정수용, 최대 15명 권장)', '1329633', '6460660', '[
    {"slug":"microphone","note":"코러스용 무선 마이크","quantity":4},
    {"slug":"mixer","note":"Yamaha MGP32X; 드럼 전용 믹서","quantity":2},
    {"slug":"speaker","note":"2000W Main Speaker","quantity":2,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Marshall JVM410H; Blackstar HT Stage 100; Laney VH100R","quantity":3},
    {"slug":"keyboard","note":"Yamaha CP88; Yamaha MODX8+; Korg Krome 73","quantity":3},
    {"slug":"bass-amp","note":"Ampeg SVT-3 Pro; Markbass Little Mark III","quantity":2},
    {"slug":"drum-kit","note":"Pearl Reference Set","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian A Custom Set + A Armand Splash 10","quantity":1}
  ]'::jsonb),
  ('studio-naver-1175196607', 'B룸 (6명 적정수용, 최대 9명 권장)', '1329633', '6460793', '[
    {"slug":"microphone","note":"무선 마이크","quantity":4},
    {"slug":"mixer","note":"Yamaha MG16XU","quantity":1},
    {"slug":"speaker","note":"15인치 1800W Main Speaker","quantity":2,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Marshall DSL100; Roland Jazz Chorus JC-120; Fender Frontman 212R","quantity":3},
    {"slug":"keyboard","note":"Yamaha MODX8+; Yamaha MX88","quantity":2},
    {"slug":"bass-amp","note":"Ampeg BA-210 V2","quantity":1},
    {"slug":"drum-kit","note":"Gretsch Renown 2","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian A Custom Set","quantity":1}
  ]'::jsonb),
  ('studio-naver-2041388352', 'C룸 (10명 적정수용, 최대 15명 권장)', '1613542', '7503949', '[
    {"slug":"microphone","note":"무선 마이크","quantity":4},
    {"slug":"mixer","note":"Yamaha MGP32X; 드럼 전용 믹서","quantity":2},
    {"slug":"speaker","note":"2000W Main Speaker 2대 + Vocal Monitor","quantity":3,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Marshall JVM410H; Blackstar HT Stage 60; Roland Jazz Chorus JC-160","quantity":3},
    {"slug":"keyboard","note":"Yamaha CP88; Yamaha MODX8+; Korg Krome 61","quantity":3},
    {"slug":"bass-amp","note":"Ampeg SVT-4 Pro","quantity":1},
    {"slug":"drum-kit","note":"Yamaha Maple Custom 6기통","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian A Custom Set + Istanbul Mehmet Splash 10","quantity":1}
  ]'::jsonb),
  ('studio-naver-2041388352', 'D룸 (6명 적정수용, 최대 9명 권장)', '1613542', '7503948', '[
    {"slug":"microphone","note":"무선 마이크","quantity":4},
    {"slug":"mixer","note":"Yamaha MG16XU; 드럼 전용 믹서","quantity":2},
    {"slug":"speaker","note":"15인치 1800W Main Speaker","quantity":2,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Fender Twin Reverb; Marshall JVM410H; Fender Frontman 212R","quantity":3},
    {"slug":"keyboard","note":"Kurzweil K2700; Yamaha MODX8+","quantity":2},
    {"slug":"bass-amp","note":"Markbass Little Mark 250","quantity":1},
    {"slug":"drum-kit","note":"DW Performance","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian A Custom Set","quantity":1}
  ]'::jsonb),
  ('studio-naver-1252122778', '워십룸/홀 대관', '687024', '7315489', '[
    {"slug":"mixer","note":"Behringer Wing Rack + S32; Behringer P16/P2","quantity":1},
    {"slug":"digital-piano","note":"Yamaha Clavinova Digital Grand Piano","quantity":1},
    {"slug":"keyboard","note":"Yamaha MODX7+; Kurzweil SP6-7","quantity":2},
    {"slug":"drum-kit","note":"NUX DM-210 전자드럼","quantity":1},
    {"slug":"speaker","note":"JBL EON712","quantity":1},
    {"slug":"bass-amp","note":"Fender Rumble 15","quantity":1}
  ]'::jsonb),
  ('studio-naver-34521725', 'A room', '938523', '5172477', '[
    {"slug":"drum-kit","note":"DW Drum","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Marshall JCM2000; Fender Champion II 100W","quantity":2},
    {"slug":"bass-amp","note":"SWR 750X 750W","quantity":1},
    {"slug":"keyboard","note":"Kurzweil SP2X; Kurzweil PC88; Yamaha PSR-E333","quantity":3},
    {"slug":"mixer","note":"Behringer PMP1680S 1600W","quantity":1},
    {"slug":"speaker","note":"JBL JRX115","quantity":1},
    {"slug":"microphone","note":"Microphone","quantity":5,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-34521725', 'B room', '938523', '5172580', '[
    {"slug":"drum-kit","note":"Pearl Drum","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Marshall JCM2000; Laney LV300 Twin","quantity":2},
    {"slug":"bass-amp","note":"Ampeg BA210 V2 450W","quantity":1},
    {"slug":"keyboard","note":"Kurzweil PC1X","quantity":1},
    {"slug":"mixer","note":"Behringer PMP1680S 1600W","quantity":1},
    {"slug":"speaker","note":"JBL JRX115","quantity":1},
    {"slug":"microphone","note":"Microphone","quantity":3,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-34521725', 'C room', '938523', '5172606', '[
    {"slug":"drum-kit","note":"Pearl Drum","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Orange CR120; Marshall MG100FX","quantity":2},
    {"slug":"bass-amp","note":"Fender Rumble 350W","quantity":1},
    {"slug":"keyboard","note":"Kurzweil SP4-8","quantity":1},
    {"slug":"mixer","note":"Behringer PMP1680S 1600W","quantity":1},
    {"slug":"speaker","note":"JBL JRX115","quantity":1},
    {"slug":"microphone","note":"Microphone","quantity":2,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-38314980', '합주실 A룸(~11시 얼리버드 적용)', '305181', '3285442', '[
    {"slug":"drum-kit","note":"Gretsch Catalina Maple 7PCS","quantity":1},
    {"slug":"cymbal-set","note":"Istanbul Agop Xist","quantity":1},
    {"slug":"bass-amp","note":"Ampeg SVT-4PRO + SVT-410HLF","quantity":1},
    {"slug":"guitar-amp","note":"Marshall JVM410H + 1960A; Marshall DSL40CR","quantity":2},
    {"slug":"keyboard","note":"Yamaha S90XS; Korg Krome 73","quantity":2},
    {"slug":"mixer","note":"Yamaha Powered Mixer EMX2S","quantity":1},
    {"slug":"speaker","note":"HK Audio RS122","quantity":1},
    {"slug":"microphone","note":"Shure SM58","quantity":2}
  ]'::jsonb),
  ('studio-naver-38314980', '합주실 B룸(~11시 얼리버드 적용)', '305181', '3285443', '[
    {"slug":"drum-kit","note":"Pearl Session Studio 5PCS","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian A Custom","quantity":1},
    {"slug":"bass-amp","note":"Markbass Black Line 250 + Black Line 104","quantity":1},
    {"slug":"guitar-amp","note":"Marshall DSL40C; Fender Hot Rod Deluxe","quantity":2},
    {"slug":"keyboard","note":"Kurzweil SP6; Korg Krome 73","quantity":2},
    {"slug":"mixer","note":"Yamaha Powered Mixer EMX2S","quantity":1},
    {"slug":"speaker","note":"HK Audio RS122","quantity":1},
    {"slug":"microphone","note":"Shure SM58S","quantity":2}
  ]'::jsonb),
  ('studio-naver-2098186164', '[합주실] Crescent (5人)', '1670639', '7746314', '[
    {"slug":"drum-kit","note":"Tama Drum Set","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Marshall Amp","quantity":1,"confidence":"MEDIUM"},
    {"slug":"keyboard","note":"Keyboard","quantity":2,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-2098186164', '[합주실] Full Moon (6人)', '1670639', '7746304', '[
    {"slug":"drum-kit","note":"Mapex Drum Set","quantity":1,"confidence":"MEDIUM"},
    {"slug":"keyboard","note":"Korg Kronos","quantity":1}
  ]'::jsonb),
  ('studio-naver-2098186164', '[합주실] New Moon (4人)', '1670639', '7746318', '[
    {"slug":"drum-kit","note":"Drum Set + Drum Shield","quantity":1,"confidence":"MEDIUM"},
    {"slug":"guitar-amp","note":"Marshall Amp","quantity":1,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-1187934379', '밴드연습실', '415748', '3597613', '[
    {"slug":"drum-kit","note":"Gretsch Catalina Maple 6PCS","quantity":1},
    {"slug":"cymbal-set","note":"Zildjian A Custom Set","quantity":1},
    {"slug":"bass-amp","note":"Markbass CMD JB Player School 300W","quantity":1},
    {"slug":"guitar-amp","note":"Marshall Valvestate 8100 + 8412 Cabinet","quantity":1},
    {"slug":"keyboard","note":"Yamaha MODX8+","quantity":1},
    {"slug":"microphone","note":"Shure SM58; Shure PGA Drum Kit Microphone","quantity":2},
    {"slug":"mixer","note":"Mackie ProFX16 V3","quantity":1},
    {"slug":"speaker","note":"JBL EON615 1조","quantity":2}
  ]'::jsonb),
  ('studio-naver-1710978660', '합주실', '624459', '4254566', '[
    {"slug":"keyboard","note":"Yamaha Montage 8","quantity":1},
    {"slug":"drum-kit","note":"Gretsch Catalina Maple","quantity":1},
    {"slug":"cymbal-set","note":"Masterwork Custom Cymbal","quantity":1},
    {"slug":"bass-amp","note":"Fender Rumble 100","quantity":1},
    {"slug":"guitar-amp","note":"Fender Champion 100","quantity":1},
    {"slug":"microphone","note":"Audix OM2; Shure SM58","quantity":2},
    {"slug":"mixer","note":"Mackie ProFX12 V3","quantity":1},
    {"slug":"speaker","note":"Mackie SRM350","quantity":1}
  ]'::jsonb),
  ('studio-naver-1510661945', '합주실(당일예약X)', '860988', '4923393', '[
    {"slug":"guitar-amp","note":"Marshall Code 100H; Cort CM15G","quantity":2},
    {"slug":"bass-amp","note":"Orange Crush Bass 50","quantity":1},
    {"slug":"digital-piano","note":"DS Music DS-880","quantity":1},
    {"slug":"microphone","note":"Microphone","quantity":2,"confidence":"MEDIUM"},
    {"slug":"mixer","note":"Mixer","quantity":1,"confidence":"MEDIUM"},
    {"slug":"speaker","note":"Alto TS312 1조","quantity":2},
    {"slug":"drum-kit","note":"Drum Set","quantity":1,"confidence":"MEDIUM"},
    {"slug":"music-stand","note":"Music Stand","quantity":2,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-2095488188', 'A ROOM', '1653159', '7674394', '[
    {"slug":"guitar-amp","note":"Blackstar Series One 100H + 4x12 Cabinet; Marshall DSL100HR + 4x12 Cabinet; Marshall MA100H","quantity":3},
    {"slug":"bass-amp","note":"EBS Magni 502-115","quantity":1},
    {"slug":"keyboard","note":"Korg Kross 2-88; Korg Kross 2-61","quantity":2},
    {"slug":"drum-kit","note":"Yamaha Stage Custom","quantity":1},
    {"slug":"cymbal-set","note":"Amedia Classic Set + Meinl HCS Splash","quantity":1},
    {"slug":"monitor-speaker","note":"Alto SXM112A Active","quantity":1},
    {"slug":"mixer","note":"Yamaha MG16XU","quantity":1},
    {"slug":"microphone","note":"Shure Beta 58A; SM58S; SM58; Volt VT-1000S","quantity":4},
    {"slug":"speaker","note":"JBL MRX512M","quantity":2}
  ]'::jsonb),
  ('studio-naver-2095488188', 'B ROOM', '1653159', '7676857', '[
    {"slug":"guitar-amp","note":"Marshall Code 100H + 2x12 Cabinet; Fender Champion II 100","quantity":2},
    {"slug":"bass-amp","note":"EBS S120","quantity":1},
    {"slug":"keyboard","note":"Yamaha MX88","quantity":1},
    {"slug":"drum-kit","note":"Yamaha Rydeen","quantity":1},
    {"slug":"cymbal-set","note":"Anatolian Ambient Set + Istanbul Mehmet IMC Crash 18","quantity":1},
    {"slug":"mixer","note":"Yamaha MG10XU","quantity":1},
    {"slug":"microphone","note":"Shure SM58S; Shure PGA48; Inter-M MD-710V","quantity":3},
    {"slug":"speaker","note":"GNS GS10","quantity":2}
  ]'::jsonb),
  ('studio-naver-1727420146', 'A룸_일반 예약(24시간)', '1261904', '6275791', '[
    {"slug":"guitar-amp","note":"Marshall DSL100H + Cabinet; Fender Champion 100","quantity":2},
    {"slug":"bass-amp","note":"Markbass 58R + Standard HR","quantity":1},
    {"slug":"keyboard","note":"Yamaha MX88; Kurzweil PC4","quantity":2},
    {"slug":"drum-kit","note":"Markers Pro Sound with Pearl Hardware","quantity":1},
    {"slug":"cymbal-set","note":"Istanbul Agop Xist; Istanbul IMC; Sabian Splash","quantity":1},
    {"slug":"microphone","note":"Shure Beta 58A; SM58 2대","quantity":3},
    {"slug":"mixer","note":"Yamaha MG12XU","quantity":1},
    {"slug":"speaker","note":"Yamaha DBR15; Behringer Eurolive B110D","quantity":2}
  ]'::jsonb),
  ('studio-naver-1727420146', 'B룸_일반 예약(24시간)', '1261904', '6948581', '[
    {"slug":"guitar-amp","note":"Marshall DSL40; Fender Champion 100","quantity":2},
    {"slug":"bass-amp","note":"Fender Rumble 100","quantity":1},
    {"slug":"keyboard","note":"Kurzweil PC3X","quantity":1},
    {"slug":"drum-kit","note":"EFNOTE 3X 전자드럼","quantity":1},
    {"slug":"microphone","note":"Shure SM58","quantity":2},
    {"slug":"mixer","note":"Behringer Xenyx X1622USB","quantity":1},
    {"slug":"speaker","note":"Behringer DR110DSP","quantity":1}
  ]'::jsonb),
  ('studio-naver-2064616859', '합주실(적정 인원 7명, 최대 10명)', '1641413', '7617848', '[
    {"slug":"drum-kit","note":"Ludwig Classic Maple","quantity":1},
    {"slug":"bass-amp","note":"Ampeg RB115","quantity":1},
    {"slug":"guitar-amp","note":"Marshall DSL40CR; Blackstar Debut 100R","quantity":2},
    {"slug":"keyboard","note":"Yamaha MODX M8","quantity":1},
    {"slug":"mixer","note":"Yamaha MG12XU","quantity":1},
    {"slug":"speaker","note":"Yamaha DBR12","quantity":1},
    {"slug":"microphone","note":"Sennheiser E845S","quantity":1}
  ]'::jsonb),
  ('studio-naver-2006460524', 'A룸_일반 예약(24시간)', '1714320', '7948588', '[
    {"slug":"drum-kit","note":"Markers Pro Sound 2","quantity":1},
    {"slug":"cymbal-set","note":"Istanbul IMC Brilliant 14/16/18/21","quantity":1},
    {"slug":"speaker","note":"Yamaha DBR15","quantity":2},
    {"slug":"mixer","note":"Yamaha MG16XU","quantity":1},
    {"slug":"guitar-amp","note":"Marshall JCM2000 + 1960A; Fender Champion 100","quantity":2},
    {"slug":"bass-amp","note":"Aguilar Tone Hammer 700 + SL210","quantity":1},
    {"slug":"keyboard","note":"Kurzweil SP8","quantity":1},
    {"slug":"microphone","note":"Shure SM58","quantity":3}
  ]'::jsonb),
  ('studio-naver-2006460524', 'B룸_일반 예약(24시간)', '1714320', '7964527', '[
    {"slug":"drum-kit","note":"Yamaha Stage Custom","quantity":1},
    {"slug":"cymbal-set","note":"Istanbul IMC Brilliant 14/16/18/21","quantity":1},
    {"slug":"speaker","note":"Yamaha DBR15","quantity":2},
    {"slug":"mixer","note":"Yamaha MG16XU","quantity":1},
    {"slug":"guitar-amp","note":"Orange Super Crush 100H + Crush Pro 412; Fender Champion 100","quantity":2},
    {"slug":"bass-amp","note":"Darkglass Alpha Omega 500 + 112N","quantity":1},
    {"slug":"keyboard","note":"Yamaha CK88","quantity":1},
    {"slug":"microphone","note":"Shure SM58","quantity":3}
  ]'::jsonb),
  ('studio-naver-2070351623', '숲 (5인 이하 / 합주실)', '1488638', '7025011', '[
    {"slug":"guitar-amp","note":"Fender Champion 50","quantity":1},
    {"slug":"bass-amp","note":"Fender Rumble 25","quantity":1},
    {"slug":"keyboard","note":"Kurzweil Keyboard","quantity":1,"confidence":"MEDIUM"},
    {"slug":"microphone","note":"Shure SM58SK","quantity":2},
    {"slug":"drum-kit","note":"Drum Set","quantity":1,"confidence":"MEDIUM"}
  ]'::jsonb),
  ('studio-naver-2070351623', '바다 (6~12인 / 합주실)', '1488638', '7025008', '[
    {"slug":"guitar-amp","note":"Fender Champion 100","quantity":1},
    {"slug":"bass-amp","note":"Fender Rumble 100","quantity":1},
    {"slug":"mixer","note":"Yamaha MG24","quantity":1},
    {"slug":"speaker","note":"Behringer DR115DSP; Harrison LA1234","quantity":2},
    {"slug":"keyboard","note":"Kurzweil SP7","quantity":1},
    {"slug":"microphone","note":"Shure SM58SK","quantity":3},
    {"slug":"drum-kit","note":"Tama Imperialstar","quantity":1}
  ]'::jsonb);

CREATE TEMP TABLE manual_20260830_naver_extra_equipment_rows AS
SELECT seed.studio_slug, seed.room_name, seed.business_id, seed.item_id,
       item.slug AS equipment_slug, item.note,
       NULLIF(item.quantity, 0)::smallint AS quantity,
       COALESCE(item.confidence, 'HIGH') AS confidence
FROM manual_20260830_naver_extra_equipment seed
CROSS JOIN LATERAL jsonb_to_recordset(seed.equipment) AS item(
  slug TEXT, note TEXT, quantity INTEGER, confidence TEXT
);

INSERT INTO room_equipment (
  room_id, equipment_id, equipment_model_id, quantity, note, source,
  position_label, is_optional, details
)
SELECT r.id, ei.id, NULL, row.quantity, row.note, 'MANUAL', NULL, false,
       jsonb_build_object('raw_models', row.note)
FROM manual_20260830_naver_extra_equipment_rows row
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
SELECT 'naver-extra-current:' || row.business_id || ':' || row.item_id || ':' || row.equipment_slug,
       'ROOM', NULL, r.id, ei.id, NULL, re.id, 'NAVER_BOOKING',
       'https://m.booking.naver.com/booking/10/bizes/' || row.business_id || '/items/' || row.item_id,
       s.name || ' ' || r.name || ' 네이버 예약 추가 설명', ei.name, row.note, row.note,
       NULL, false, row.confidence, '2026-08-30T18:30:00+09:00'::timestamptz
FROM manual_20260830_naver_extra_equipment_rows row
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

DROP TABLE manual_20260830_naver_extra_equipment_rows;
DROP TABLE manual_20260830_naver_extra_equipment;
