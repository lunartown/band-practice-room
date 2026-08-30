-- 2026-08-30 네이버 예약 상품 본문을 직접 다시 열어 확인한 장비만 반영한다.
-- 밴드룸 공개 카탈로그는 조사 후보를 찾는 데만 사용했고, 최종 source_url/raw_text는 네이버 원문이다.

WITH model_seed(equipment_slug, slug, brand, model, display_name, normalized_name, specs) AS (
  VALUES
    ('drum-kit', 'sonor-aq1', 'Sonor', 'AQ1', 'Sonor AQ1', 'sonor aq1', '{}'::jsonb),
    ('drum-kit', 'tama-starclassic-bubinga', 'Tama', 'Starclassic Bubinga', 'Tama Starclassic Bubinga', 'tama starclassic bubinga', '{}'::jsonb),
    ('guitar-amp', 'line-6-dt50-head', 'Line 6', 'DT50 Head', 'Line 6 DT50 Head', 'line 6 dt50 head', '{}'::jsonb),
    ('guitar-amp', 'line-6-dt50-212-combo', 'Line 6', 'DT50 212 Combo', 'Line 6 DT50 212 Combo', 'line 6 dt50 212 combo', '{}'::jsonb),
    ('guitar-amp', 'line-6-spider-iv-hd150', 'Line 6', 'Spider IV HD150', 'Line 6 Spider IV HD150', 'line 6 spider iv hd150', '{}'::jsonb),
    ('bass-amp', 'peavey-tour-450', 'Peavey', 'Tour 450', 'Peavey Tour 450', 'peavey tour 450', '{}'::jsonb),
    ('bass-amp', 'tech-21-vt-bass-combo-200', 'Tech 21', 'VT Bass Combo 200', 'Tech 21 VT Bass Combo 200', 'tech 21 vt bass combo 200', '{}'::jsonb),
    ('bass-amp', 'ampeg-ba-210', 'Ampeg', 'BA-210', 'Ampeg BA-210', 'ampeg ba 210', '{}'::jsonb),
    ('digital-piano', 'kawai-mp5', 'Kawai', 'MP5', 'Kawai MP5', 'kawai mp5', '{}'::jsonb),
    ('keyboard', 'yamaha-ck88', 'Yamaha', 'CK88', 'Yamaha CK88', 'yamaha ck88', '{"keys":88}'::jsonb),
    ('mixer', 'behringer-x32', 'Behringer', 'X32', 'Behringer X32', 'behringer x32', '{}'::jsonb),
    ('mixer', 'mackie-onyx16', 'Mackie', 'ONYX16', 'Mackie ONYX16', 'mackie onyx16', '{}'::jsonb),
    ('mixer', 'behringer-eurorack-mx2642a', 'Behringer', 'Eurorack MX2642A', 'Behringer Eurorack MX2642A', 'behringer eurorack mx2642a', '{}'::jsonb),
    ('mixer', 'behringer-eurorack-ub1222fx-pro', 'Behringer', 'Eurorack UB1222FX-Pro', 'Behringer Eurorack UB1222FX-Pro', 'behringer eurorack ub1222fx pro', '{}'::jsonb),
    ('speaker', 'yamaha-stagepas-1k', 'Yamaha', 'STAGEPAS 1K', 'Yamaha STAGEPAS 1K', 'yamaha stagepas 1k', '{}'::jsonb),
    ('speaker', 'dynacord-d12', 'Dynacord', 'D12', 'Dynacord D12', 'dynacord d12', '{}'::jsonb)
)
INSERT INTO equipment_models (equipment_id, slug, brand, model, display_name, normalized_name, specs)
SELECT ei.id, model_seed.slug, model_seed.brand, model_seed.model,
  model_seed.display_name, model_seed.normalized_name, model_seed.specs
FROM model_seed
JOIN equipment_items ei ON ei.slug = model_seed.equipment_slug
ON CONFLICT (slug) DO UPDATE SET
  equipment_id = EXCLUDED.equipment_id,
  brand = EXCLUDED.brand,
  model = EXCLUDED.model,
  display_name = EXCLUDED.display_name,
  normalized_name = EXCLUDED.normalized_name,
  specs = EXCLUDED.specs,
  is_active = true;

CREATE TEMP TABLE manual_20260830_verified_equipment (
  studio_slug TEXT NOT NULL,
  room_name TEXT NOT NULL,
  equipment_slug TEXT NOT NULL,
  model_slug TEXT,
  quantity SMALLINT,
  details JSONB NOT NULL,
  evidence_key TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_title TEXT NOT NULL,
  raw_name TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  parsed_name TEXT NOT NULL,
  confidence TEXT NOT NULL
);

INSERT INTO manual_20260830_verified_equipment (
  studio_slug, room_name, equipment_slug, model_slug, quantity, details,
  evidence_key, source_url, source_title, raw_name, raw_text, parsed_name, confidence
)
VALUES
  -- 사운드시티 낙성대점 V Room
  ('studio-naver-2033382004', '[오전, 오후 확인] V Room (다인원 수용 가능)', 'speaker', NULL, 1, '{"raw_model":"EV 15인치"}'::jsonb, 'naver-current:1700366:7876115:speaker:ev-15', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876115', '사운드시티 낙성대점 V Room 네이버 예약 상세', '스피커', '스피커: EV 15인치', '스피커', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인] V Room (다인원 수용 가능)', 'mixer', NULL, 1, '{"raw_model":"Yamaha"}'::jsonb, 'naver-current:1700366:7876115:mixer:yamaha', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876115', '사운드시티 낙성대점 V Room 네이버 예약 상세', '믹서', '믹서: 야마하', '믹서', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인] V Room (다인원 수용 가능)', 'drum-kit', NULL, 1, '{"pieces":5,"raw_model":"DW Pacific"}'::jsonb, 'naver-current:1700366:7876115:drum:dw-pacific', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876115', '사운드시티 낙성대점 V Room 네이버 예약 상세', '드럼', '드럼: dw pacific 5기통', '드럼 세트', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인] V Room (다인원 수용 가능)', 'bass-amp', 'ampeg-svt-4pro', 1, '{"cabinet_raw":"HAKE 케비넷"}'::jsonb, 'naver-current:1700366:7876115:bass:ampeg-svt-4pro', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876115', '사운드시티 낙성대점 V Room 네이버 예약 상세', '베이스앰프', '베이스엠프: 암펙 SVT4 Pro + HAKE 케비넷', 'Ampeg SVT-4PRO', 'HIGH'),
  ('studio-naver-2033382004', '[오전, 오후 확인] V Room (다인원 수용 가능)', 'keyboard', 'yamaha-s90es', 1, '{"keys":88}'::jsonb, 'naver-current:1700366:7876115:keyboard:yamaha-s90es', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876115', '사운드시티 낙성대점 V Room 네이버 예약 상세', '건반I', '건반I: 야마하 S90 ES', 'Yamaha S90ES', 'HIGH'),
  ('studio-naver-2033382004', '[오전, 오후 확인] V Room (다인원 수용 가능)', 'keyboard', 'yamaha-modx8', 1, '{"keys":88}'::jsonb, 'naver-current:1700366:7876115:keyboard:yamaha-modx8', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876115', '사운드시티 낙성대점 V Room 네이버 예약 상세', '건반II', '건반 II: 야마하 MODX 8', 'Yamaha MODX8', 'HIGH'),
  ('studio-naver-2033382004', '[오전, 오후 확인] V Room (다인원 수용 가능)', 'guitar-amp', NULL, 2, '{"raw_models":["Hughes & Kettner 헤드 분리형","Laney 헤드 분리형"]}'::jsonb, 'naver-current:1700366:7876115:guitar:unspecified-heads', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876115', '사운드시티 낙성대점 V Room 네이버 예약 상세', '기타앰프', '기타 엠프 I: 휴거스케트너 헤드 분리형 / 기타 엠프 II: 레이니 헤드 분리형', '기타 앰프', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인] V Room (다인원 수용 가능)', 'microphone', NULL, 4, '{"wireless":4}'::jsonb, 'naver-current:1700366:7876115:microphone:wireless', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876115', '사운드시티 낙성대점 V Room 네이버 예약 상세', '마이크', '무선 마이크 4개', '무선 마이크', 'HIGH'),

  -- 사운드시티 낙성대점 X Room
  ('studio-naver-2033382004', '[오전, 오후 확인] X Room (다인원 수용 가능)', 'speaker', NULL, 1, '{"raw_model":"Yamaha 15인치"}'::jsonb, 'naver-current:1700366:7876227:speaker:yamaha-15', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876227', '사운드시티 낙성대점 X Room 네이버 예약 상세', '스피커', '스피커: 야마하 15인치', '스피커', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인] X Room (다인원 수용 가능)', 'mixer', NULL, 1, '{"raw_model":"Yamaha"}'::jsonb, 'naver-current:1700366:7876227:mixer:yamaha', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876227', '사운드시티 낙성대점 X Room 네이버 예약 상세', '믹서', '믹서: 야마하', '믹서', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인] X Room (다인원 수용 가능)', 'drum-kit', NULL, 1, '{"pieces":5,"raw_model":"Ludwig Custom"}'::jsonb, 'naver-current:1700366:7876227:drum:ludwig-custom', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876227', '사운드시티 낙성대점 X Room 네이버 예약 상세', '드럼', '드럼: 루딕 커스텀 5기통', '드럼 세트', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인] X Room (다인원 수용 가능)', 'bass-amp', NULL, 1, '{"raw_model":"Trace Elliot"}'::jsonb, 'naver-current:1700366:7876227:bass:trace-elliot', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876227', '사운드시티 낙성대점 X Room 네이버 예약 상세', '베이스앰프', '베이스엠프: 트레이스 엘리엇', '베이스 앰프', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인] X Room (다인원 수용 가능)', 'keyboard', 'yamaha-modx8', 1, '{"keys":88}'::jsonb, 'naver-current:1700366:7876227:keyboard:yamaha-modx8', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876227', '사운드시티 낙성대점 X Room 네이버 예약 상세', '건반I', '건반I: 야마하 MODX 8', 'Yamaha MODX8', 'HIGH'),
  ('studio-naver-2033382004', '[오전, 오후 확인] X Room (다인원 수용 가능)', 'keyboard', NULL, 1, '{"keys":76,"raw_model":"Korg"}'::jsonb, 'naver-current:1700366:7876227:keyboard:korg-76', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876227', '사운드시티 낙성대점 X Room 네이버 예약 상세', '건반II', '건반 II: KORG 76', '키보드', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인] X Room (다인원 수용 가능)', 'guitar-amp', NULL, 1, '{"raw_model":"Marshall Plexi"}'::jsonb, 'naver-current:1700366:7876227:guitar:marshall-plexi', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876227', '사운드시티 낙성대점 X Room 네이버 예약 상세', '기타앰프I', '기타 엠프 I: 마샬 플랙시', '기타 앰프', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인] X Room (다인원 수용 가능)', 'guitar-amp', 'marshall-mg100fx', 1, '{}'::jsonb, 'naver-current:1700366:7876227:guitar:marshall-mg100fx', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876227', '사운드시티 낙성대점 X Room 네이버 예약 상세', '기타앰프II', '기타 엠프 II: 마샬 MG100FX', 'Marshall MG100FX', 'HIGH'),
  ('studio-naver-2033382004', '[오전, 오후 확인] X Room (다인원 수용 가능)', 'microphone', NULL, 4, '{"wireless":4}'::jsonb, 'naver-current:1700366:7876227:microphone:wireless', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876227', '사운드시티 낙성대점 X Room 네이버 예약 상세', '마이크', '무선 마이크 4개', '무선 마이크', 'HIGH'),

  -- 사운드시티 낙성대점 Y Room
  ('studio-naver-2033382004', '[오전, 오후 확인]  Y Room', 'speaker', NULL, 1, '{"raw_model":"JBL 15인치"}'::jsonb, 'naver-current:1700366:7876231:speaker:jbl-15', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876231', '사운드시티 낙성대점 Y Room 네이버 예약 상세', '스피커', '스피커: JBL 15인치', '스피커', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인]  Y Room', 'mixer', NULL, 1, '{"raw_model":"Yamaha"}'::jsonb, 'naver-current:1700366:7876231:mixer:yamaha', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876231', '사운드시티 낙성대점 Y Room 네이버 예약 상세', '믹서', '믹서: 야마하', '믹서', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인]  Y Room', 'drum-kit', NULL, 1, '{"pieces":5,"raw_model":"Pearl"}'::jsonb, 'naver-current:1700366:7876231:drum:pearl-5pc', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876231', '사운드시티 낙성대점 Y Room 네이버 예약 상세', '드럼', '드럼: 펄 5기통', '드럼 세트', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인]  Y Room', 'bass-amp', NULL, 1, '{"power_watts":100}'::jsonb, 'naver-current:1700366:7876231:bass:100w', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876231', '사운드시티 낙성대점 Y Room 네이버 예약 상세', '베이스앰프', '베이스엠프: 100W', '베이스 앰프', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인]  Y Room', 'keyboard', 'yamaha-modx8-plus', 1, '{"keys":88}'::jsonb, 'naver-current:1700366:7876231:keyboard:yamaha-modx8-plus', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876231', '사운드시티 낙성대점 Y Room 네이버 예약 상세', '건반I', '건반I: 야마하 MODX 8+', 'Yamaha MODX8+', 'HIGH'),
  ('studio-naver-2033382004', '[오전, 오후 확인]  Y Room', 'keyboard', 'yamaha-ck61', 1, '{"keys":61}'::jsonb, 'naver-current:1700366:7876231:keyboard:yamaha-ck61', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876231', '사운드시티 낙성대점 Y Room 네이버 예약 상세', '건반II', '건반 II: 야마하 CK61', 'Yamaha CK61', 'HIGH'),
  ('studio-naver-2033382004', '[오전, 오후 확인]  Y Room', 'guitar-amp', NULL, 2, '{"raw_models":["Marshall Origin 헤드 분리형","Roland Jazz Chorus"]}'::jsonb, 'naver-current:1700366:7876231:guitar:unspecified', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876231', '사운드시티 낙성대점 Y Room 네이버 예약 상세', '기타앰프', '기타 엠프 I: 마샬 오리진 헤드 분리형 / 기타 엠프 II: 롤랜드 재즈코러스', '기타 앰프', 'MEDIUM'),
  ('studio-naver-2033382004', '[오전, 오후 확인]  Y Room', 'microphone', NULL, 4, '{"wireless":4}'::jsonb, 'naver-current:1700366:7876231:microphone:wireless', 'https://m.booking.naver.com/booking/10/bizes/1700366/items/7876231', '사운드시티 낙성대점 Y Room 네이버 예약 상세', '마이크', '무선 마이크 4개', '무선 마이크', 'HIGH'),

  -- 분당합주실
  ('studio-naver-1544433117', '분당 합주실', 'drum-kit', 'tama-starclassic-bubinga', 1, '{"pieces":5}'::jsonb, 'naver-current:1268865:6300696:drum:tama-starclassic-bubinga', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Drums (Pop & Rock)', 'Tama Starclassic Bubinga (B20,T10,12,14,16)', 'Tama Starclassic Bubinga', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'drum-kit', NULL, 1, '{"pieces":4,"raw_model":"Sonor Bob (Jazz)"}'::jsonb, 'naver-current:1268865:6300696:drum:sonor-bob-jazz', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Drums (Jazz)', 'Sonor Bob (Jazz B18,T12,14,S14)', '드럼 세트', 'MEDIUM'),
  ('studio-naver-1544433117', '분당 합주실', 'cymbal-set', NULL, 1, '{"raw_model":"Zildjian K"}'::jsonb, 'naver-current:1268865:6300696:cymbal:zildjian-k', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Cymbal', 'Cymbal Zildjian K (H14,C16,16,18,R20 China18.Splash10)', '심벌 세트', 'MEDIUM'),
  ('studio-naver-1544433117', '분당 합주실', 'guitar-amp', 'marshall-jvm410h', 1, '{"cabinet_raw":"Marshall 1960A"}'::jsonb, 'naver-current:1268865:6300696:guitar:marshall-jvm410h', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Guitar Amp', 'Marshall JVM410H & 1960A', 'Marshall JVM410H', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'guitar-amp', 'marshall-jvm410c', 1, '{}'::jsonb, 'naver-current:1268865:6300696:guitar:marshall-jvm410c', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Guitar Amp', 'Marshall JVM410C', 'Marshall JVM410C', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'bass-amp', 'ampeg-svt-4pro', 1, '{"cabinet_raw":"Ampeg SVT-410E"}'::jsonb, 'naver-current:1268865:6300696:bass:ampeg-svt-4pro', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Bass Amp', 'Ampeg SVT 4pro & SVT 410E', 'Ampeg SVT-4PRO', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'bass-amp', 'ampeg-ba-210', 1, '{}'::jsonb, 'naver-current:1268865:6300696:bass:ampeg-ba-210', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Bass Amp', 'Ampeg BA_-210', 'Ampeg BA-210', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'keyboard', 'yamaha-montage8', 1, '{"keys":88}'::jsonb, 'naver-current:1268865:6300696:keyboard:yamaha-montage8', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Keyboard', 'Yamaha Montage 8', 'Yamaha Montage8', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'keyboard', 'yamaha-ck88', 1, '{"keys":88}'::jsonb, 'naver-current:1268865:6300696:keyboard:yamaha-ck88', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Keyboard', 'Yamaha CK 88', 'Yamaha CK88', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'keyboard', 'yamaha-ck61', 1, '{"keys":61}'::jsonb, 'naver-current:1268865:6300696:keyboard:yamaha-ck61', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Keyboard', 'Yamaha CK 61 2단', 'Yamaha CK61', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'acoustic-piano', 'yamaha-u3', 1, '{}'::jsonb, 'naver-current:1268865:6300696:piano:yamaha-u3', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Upright piano', 'Yamaha U-3', 'Yamaha U3', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'mixer', 'behringer-x32', 1, '{}'::jsonb, 'naver-current:1268865:6300696:mixer:behringer-x32', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Main Mixer', 'Behringer X32 Full Version', 'Behringer X32', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'mixer', 'mackie-onyx16', 1, '{}'::jsonb, 'naver-current:1268865:6300696:mixer:mackie-onyx16', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Mixer (Drum Recording)', 'Mackie ONYX16', 'Mackie ONYX16', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'speaker', 'yamaha-stagepas-1k', 2, '{}'::jsonb, 'naver-current:1268865:6300696:speaker:yamaha-stagepas-1k', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Main Speaker', 'Yamaha STAGEPAS1K 1조', 'Yamaha STAGEPAS 1K', 'HIGH'),
  ('studio-naver-1544433117', '분당 합주실', 'monitor-speaker', NULL, 4, '{"raw_model":"Behringer PK"}'::jsonb, 'naver-current:1268865:6300696:monitor:behringer-pk', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Monitor Speaker', 'Behringer PK 4조(드럼,메인건반,세컨건반,보컬)', '모니터 스피커', 'MEDIUM'),
  ('studio-naver-1544433117', '분당 합주실', 'microphone', NULL, 7, '{"wired":3,"wireless":4,"wired_models":["Shure SM58","Beta58","Beta57"]}'::jsonb, 'naver-current:1268865:6300696:microphone:seven', 'https://m.booking.naver.com/booking/10/bizes/1268865/items/6300696', '분당합주실 네이버 예약 상세', 'Mic', '유선-SHURE SM58, BETA58, BETA57 3개 / 무선마이크 4개', '마이크', 'HIGH'),

  -- 라우드 뮤직스페이스 A룸
  ('studio-naver-1011494028', '합주실 A룸', 'drum-kit', 'sonor-aq1', 1, '{"pieces":4}'::jsonb, 'naver-current:343858:3393674:drum:sonor-aq1', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393674', '라우드 뮤직스페이스 A룸 네이버 예약 상세', '드럼', 'Sonor AQ1 set 22 10 12 16', 'Sonor AQ1', 'HIGH'),
  ('studio-naver-1011494028', '합주실 A룸', 'cymbal-set', NULL, 1, '{"raw_model":"Loben swert Dark custom"}'::jsonb, 'naver-current:343858:3393674:cymbal:loben-dark-custom', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393674', '라우드 뮤직스페이스 A룸 네이버 예약 상세', '심벌', 'Loben swert Dark custom 14 16 18 20', '심벌 세트', 'MEDIUM'),
  ('studio-naver-1011494028', '합주실 A룸', 'guitar-amp', 'line-6-dt50-head', 1, '{"cabinet_raw":"4x12 300W"}'::jsonb, 'naver-current:343858:3393674:guitar:line6-dt50-head', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393674', '라우드 뮤직스페이스 A룸 네이버 예약 상세', '기타앰프', 'Line6 DT50Head & 4x12 300watt', 'Line 6 DT50 Head', 'HIGH'),
  ('studio-naver-1011494028', '합주실 A룸', 'guitar-amp', 'line-6-dt50-212-combo', 1, '{}'::jsonb, 'naver-current:343858:3393674:guitar:line6-dt50-212', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393674', '라우드 뮤직스페이스 A룸 네이버 예약 상세', '기타앰프', 'Line6 DT50 212 combo', 'Line 6 DT50 212 Combo', 'HIGH'),
  ('studio-naver-1011494028', '합주실 A룸', 'bass-amp', 'peavey-tour-450', 1, '{"cabinet_raw":"Hartke XL series 4.5"}'::jsonb, 'naver-current:343858:3393674:bass:peavey-tour-450', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393674', '라우드 뮤직스페이스 A룸 네이버 예약 상세', '베이스앰프', 'Peavey Tour 450 & Hartke Xl series 4.5', 'Peavey Tour 450', 'HIGH'),
  ('studio-naver-1011494028', '합주실 A룸', 'keyboard', 'yamaha-mx88', 1, '{"keys":88}'::jsonb, 'naver-current:343858:3393674:keyboard:yamaha-mx88', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393674', '라우드 뮤직스페이스 A룸 네이버 예약 상세', '건반', 'Yamaha MX88', 'Yamaha MX88', 'HIGH'),
  ('studio-naver-1011494028', '합주실 A룸', 'digital-piano', 'kawai-mp5', 1, '{"keys":88}'::jsonb, 'naver-current:343858:3393674:keyboard:kawai-mp5', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393674', '라우드 뮤직스페이스 A룸 네이버 예약 상세', '건반', 'Kawai MP5', 'Kawai MP5', 'HIGH'),
  ('studio-naver-1011494028', '합주실 A룸', 'microphone', 'shure-sm58sk', 1, '{"wired":1}'::jsonb, 'naver-current:343858:3393674:microphone:shure-sm58sk', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393674', '라우드 뮤직스페이스 A룸 네이버 예약 상세', '마이크', 'Shure SM58SK', 'Shure SM58SK', 'HIGH'),
  ('studio-naver-1011494028', '합주실 A룸', 'mixer', 'behringer-eurorack-mx2642a', 1, '{}'::jsonb, 'naver-current:343858:3393674:mixer:behringer-mx2642a', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393674', '라우드 뮤직스페이스 A룸 네이버 예약 상세', '음향', 'Behringer Eurorack MX2642A', 'Behringer Eurorack MX2642A', 'HIGH'),
  ('studio-naver-1011494028', '합주실 A룸', 'speaker', 'dynacord-d12', 2, '{"power_watts":1200}'::jsonb, 'naver-current:343858:3393674:speaker:dynacord-d12', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393674', '라우드 뮤직스페이스 A룸 네이버 예약 상세', '음향', 'Dynacord D12 1200W x2', 'Dynacord D12', 'HIGH'),

  -- 라우드 뮤직스페이스 B룸
  ('studio-naver-1011494028', '합주실 B룸', 'drum-kit', 'sonor-aq1', 1, '{"pieces":4}'::jsonb, 'naver-current:343858:3393883:drum:sonor-aq1', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393883', '라우드 뮤직스페이스 B룸 네이버 예약 상세', '드럼', 'Sonor AQ1 set 22 10 12 16', 'Sonor AQ1', 'HIGH'),
  ('studio-naver-1011494028', '합주실 B룸', 'cymbal-set', NULL, 1, '{"raw_model":"Loben swert Dark custom"}'::jsonb, 'naver-current:343858:3393883:cymbal:loben-dark-custom', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393883', '라우드 뮤직스페이스 B룸 네이버 예약 상세', '심벌', 'Loben swert Dark custom 14 16 18 20', '심벌 세트', 'MEDIUM'),
  ('studio-naver-1011494028', '합주실 B룸', 'guitar-amp', 'line-6-spider-iv-hd150', 1, '{"cabinet_raw":"4x12"}'::jsonb, 'naver-current:343858:3393883:guitar:line6-spider-iv-hd150', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393883', '라우드 뮤직스페이스 B룸 네이버 예약 상세', '기타앰프', 'Line6 Spider IV HD150 head & 12x4 120w', 'Line 6 Spider IV HD150', 'HIGH'),
  ('studio-naver-1011494028', '합주실 B룸', 'bass-amp', 'tech-21-vt-bass-combo-200', 1, '{"power_watts":200}'::jsonb, 'naver-current:343858:3393883:bass:tech21-vt-bass-combo', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393883', '라우드 뮤직스페이스 B룸 네이버 예약 상세', '베이스앰프', 'Tech21 VTbass combo 200w', 'Tech 21 VT Bass Combo 200', 'HIGH'),
  ('studio-naver-1011494028', '합주실 B룸', 'keyboard', 'yamaha-mx88', 1, '{"keys":88}'::jsonb, 'naver-current:343858:3393883:keyboard:yamaha-mx88', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393883', '라우드 뮤직스페이스 B룸 네이버 예약 상세', '건반', 'Yamaha MX88', 'Yamaha MX88', 'HIGH'),
  ('studio-naver-1011494028', '합주실 B룸', 'mixer', 'behringer-eurorack-ub1222fx-pro', 1, '{}'::jsonb, 'naver-current:343858:3393883:mixer:behringer-ub1222fx-pro', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393883', '라우드 뮤직스페이스 B룸 네이버 예약 상세', '음향', 'Behringer Eurorack UB1222FX-pro', 'Behringer Eurorack UB1222FX-Pro', 'HIGH'),
  ('studio-naver-1011494028', '합주실 B룸', 'speaker', 'dynacord-d12', 2, '{"power_watts":1200}'::jsonb, 'naver-current:343858:3393883:speaker:dynacord-d12', 'https://m.booking.naver.com/booking/10/bizes/343858/items/3393883', '라우드 뮤직스페이스 B룸 네이버 예약 상세', '음향', 'Dynacord D12 1200W x2', 'Dynacord D12', 'HIGH');

DELETE FROM room_equipment re
USING manual_20260830_verified_equipment seed
JOIN studios s ON s.slug = seed.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = seed.room_name
JOIN equipment_items ei ON ei.slug = seed.equipment_slug
LEFT JOIN equipment_models em ON em.slug = seed.model_slug
WHERE re.room_id = r.id
  AND re.equipment_id = ei.id
  AND ((seed.model_slug IS NULL AND re.equipment_model_id IS NULL) OR re.equipment_model_id = em.id)
  AND re.position_label IS NULL;

INSERT INTO room_equipment (
  room_id, equipment_id, equipment_model_id, quantity, note, source, position_label, is_optional, details
)
SELECT r.id, ei.id, em.id, SUM(seed.quantity)::smallint, NULL, 'MANUAL', NULL, false,
  CASE
    WHEN COUNT(*) = 1 THEN MIN(seed.details::text)::jsonb
    ELSE jsonb_build_object('items', jsonb_agg(seed.details ORDER BY seed.evidence_key))
  END
FROM manual_20260830_verified_equipment seed
JOIN studios s ON s.slug = seed.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = seed.room_name
JOIN equipment_items ei ON ei.slug = seed.equipment_slug
LEFT JOIN equipment_models em ON em.slug = seed.model_slug
GROUP BY r.id, ei.id, em.id;

INSERT INTO equipment_evidence (
  evidence_key, target_kind, studio_id, room_id, equipment_id, equipment_model_id, room_equipment_id,
  source_kind, source_url, source_title, raw_name, raw_text, parsed_name, position_label,
  is_optional, confidence, observed_at
)
SELECT seed.evidence_key, 'ROOM', NULL, r.id, ei.id, em.id, re.id,
  'NAVER_BOOKING', seed.source_url, seed.source_title, seed.raw_name, seed.raw_text,
  seed.parsed_name, NULL, false, seed.confidence, '2026-08-30T16:00:00+09:00'::timestamptz
FROM manual_20260830_verified_equipment seed
JOIN studios s ON s.slug = seed.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = seed.room_name
JOIN equipment_items ei ON ei.slug = seed.equipment_slug
LEFT JOIN equipment_models em ON em.slug = seed.model_slug
JOIN room_equipment re ON re.room_id = r.id
  AND re.equipment_id = ei.id
  AND ((seed.model_slug IS NULL AND re.equipment_model_id IS NULL) OR re.equipment_model_id = em.id)
  AND re.position_label IS NULL
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

DROP TABLE manual_20260830_verified_equipment;
