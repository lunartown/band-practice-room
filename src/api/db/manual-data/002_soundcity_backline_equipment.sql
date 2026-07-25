WITH model_seed(equipment_slug, slug, brand, model, variant, display_name, normalized_name, specs) AS (
  VALUES
    ('mixer', 'behringer-x2442usb', 'Behringer', 'X2442USB', NULL, 'Behringer X2442USB', 'behringer x2442usb', '{}'::jsonb),
    ('drum-kit', 'tama-starclassic-birch', 'Tama', 'Starclassic Birch', NULL, 'Tama Starclassic Birch', 'tama starclassic birch', '{}'::jsonb),
    ('bass-amp', 'ampeg-svt-4pro', 'Ampeg', 'SVT-4PRO', NULL, 'Ampeg SVT-4PRO', 'ampeg svt-4pro', '{}'::jsonb),
    ('guitar-amp', 'marshall-dsl100h', 'Marshall', 'DSL100H', NULL, 'Marshall DSL100H', 'marshall dsl100h', '{}'::jsonb),
    ('drum-kit', 'dw-collectors-series', 'DW', 'Collector''s Series', NULL, 'DW Collector''s Series', 'dw collectors series', '{}'::jsonb),
    ('guitar-amp', 'marshall-jcm2000', 'Marshall', 'JCM2000', NULL, 'Marshall JCM2000', 'marshall jcm2000', '{}'::jsonb),
    ('guitar-amp', 'mesa-boogie-dual-rectifier-100w-head', 'Mesa/Boogie', 'Dual Rectifier 100W Head', NULL, 'Mesa/Boogie Dual Rectifier 100W Head', 'mesa boogie dual rectifier 100w head', '{}'::jsonb),
    ('speaker', 'yamaha-c115v', 'Yamaha', 'C115V', NULL, 'Yamaha C115V', 'yamaha c115v', '{}'::jsonb),
    ('mixer', 'yamaha-emx5014c', 'Yamaha', 'EMX5014C', NULL, 'Yamaha EMX5014C', 'yamaha emx5014c', '{}'::jsonb),
    ('microphone', 'd-com-dmk-951-nc', 'D-Com', 'DMK 951 NC', NULL, 'D-Com DMK 951 NC', 'd com dmk 951 nc', '{}'::jsonb),
    ('drum-kit', 'tama-bubinga', 'Tama', 'Bubinga', NULL, 'Tama Bubinga', 'tama bubinga', '{}'::jsonb),
    ('guitar-amp', 'marshall-ma100h', 'Marshall', 'MA100H', NULL, 'Marshall MA100H', 'marshall ma100h', '{}'::jsonb),
    ('drum-kit', 'pearl-vision', 'Pearl', 'Vision', NULL, 'Pearl Vision', 'pearl vision', '{}'::jsonb),
    ('guitar-amp', 'marshall-origin-50', 'Marshall', 'Origin 50', NULL, 'Marshall Origin 50', 'marshall origin 50', '{}'::jsonb),
    ('speaker', 'jbl-eon-515-xt', 'JBL', 'EON 515 XT', NULL, 'JBL EON 515 XT', 'jbl eon 515 xt', '{}'::jsonb),
    ('guitar-amp', 'marshall-mg100fx', 'Marshall', 'MG100FX', NULL, 'Marshall MG100FX', 'marshall mg100fx', '{}'::jsonb),
    ('guitar-amp', 'marshall-valvestate-stage-2000', 'Marshall', 'Valvestate Stage 2000', NULL, 'Marshall Valvestate Stage 2000', 'marshall valvestate stage 2000', '{}'::jsonb),
    ('mixer', 'profx12', 'Mackie', 'ProFX12', NULL, 'Mackie ProFX12', 'mackie profx12', '{}'::jsonb),
    ('bass-amp', 'fender-rumble-200', 'Fender', 'Rumble 200', NULL, 'Fender Rumble 200', 'fender rumble 200', '{}'::jsonb),
    ('guitar-amp', 'marshall-valvestate-2000', 'Marshall', 'Valvestate 2000', NULL, 'Marshall Valvestate 2000', 'marshall valvestate 2000', '{}'::jsonb)
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

CREATE TEMP TABLE manual_soundcity_backline_placement (
  studio_slug TEXT NOT NULL,
  room_name TEXT NOT NULL,
  equipment_slug TEXT NOT NULL,
  model_slug TEXT,
  quantity SMALLINT NOT NULL,
  position_label TEXT,
  is_optional BOOLEAN NOT NULL,
  details JSONB NOT NULL,
  evidence_key TEXT NOT NULL,
  source_url TEXT NOT NULL,
  source_title TEXT NOT NULL,
  raw_text TEXT NOT NULL,
  parsed_name TEXT NOT NULL,
  confidence TEXT NOT NULL
);

INSERT INTO manual_soundcity_backline_placement (
  studio_slug,
  room_name,
  equipment_slug,
  model_slug,
  quantity,
  position_label,
  is_optional,
  details,
  evidence_key,
  source_url,
  source_title,
  raw_text,
  parsed_name,
  confidence
)
VALUES
  ('studio-합정/홍대-사운드시티', 'Live Room', 'speaker', NULL, 1, NULL, false, '{"brand":"Soundking","bluetooth":true}'::jsonb, 'naver:1033058:5933800:speaker:soundking', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '스피커: 사운드킹 (블루투스 연결 가능)', 'Soundking speaker', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Live Room', 'mixer', 'behringer-x2442usb', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5933800:mixer:behringer-x2442usb', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '믹서: 베링거 X2442USB', 'Behringer X2442USB', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Live Room', 'drum-kit', 'tama-starclassic-birch', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5933800:drum-kit:tama-starclassic-birch', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '드럼: 타마 스타클래식 버찌', 'Tama Starclassic Birch', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Live Room', 'bass-amp', 'ampeg-svt-4pro', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5933800:bass-amp:ampeg-svt-4pro', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '베이스엠프: 암팩 svt 4 pro', 'Ampeg SVT-4PRO', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Live Room', 'guitar-amp', 'marshall-dsl100h', 2, NULL, false, '{}'::jsonb, 'naver:1033058:5933800:guitar-amp:marshall-dsl100h', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '마샬 DSL 100H x 2', 'Marshall DSL100H', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Live Room', 'microphone', NULL, 4, NULL, false, '{"type":"wireless"}'::jsonb, 'naver:1033058:5933800:microphone:wireless-4', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5933800', '사운드시티 Live Room 네이버 예약 상세', '무선 마이크 4개', 'Wireless microphone', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room A', 'drum-kit', 'dw-collectors-series', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486389:drum-kit:dw-collectors-series', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '드럼: DW 콜렉터', 'DW Collector''s Series', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room A', 'bass-amp', 'ampeg-svt-4pro', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486389:bass-amp:ampeg-svt-4pro', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '베이스 엠프: 암팩 SVT-4PRO', 'Ampeg SVT-4PRO', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room A', 'guitar-amp', 'marshall-jcm2000', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486389:guitar-amp:marshall-jcm2000', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '마샬 JCM 2000', 'Marshall JCM2000', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room A', 'guitar-amp', 'mesa-boogie-dual-rectifier-100w-head', 1, NULL, false, '{"watts":100,"head":true}'::jsonb, 'naver:1033058:5486389:guitar-amp:mesa-dual-rectifier-100w-head', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '메사부기 듀얼렉티어 100W Head', 'Mesa/Boogie Dual Rectifier 100W Head', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room A', 'speaker', 'yamaha-c115v', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486389:speaker:yamaha-c115v', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '스피커: 야마하 C115V', 'Yamaha C115V', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room A', 'mixer', 'yamaha-emx5014c', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486389:mixer:yamaha-emx5014c', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '믹서: 야마하 EMX 5014C', 'Yamaha EMX5014C', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room A', 'microphone', 'd-com-dmk-951-nc', 4, NULL, false, '{"type":"wireless"}'::jsonb, 'naver:1033058:5486389:microphone:d-com-dmk-951-nc', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486389', '사운드시티 Room A 네이버 예약 상세', '무선 마이크: D COM DMK 951 NC 4개', 'D-Com DMK 951 NC', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room B', 'drum-kit', 'tama-bubinga', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486506:drum-kit:tama-bubinga', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '드럼: TAMA 부빙가', 'Tama Bubinga', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room B', 'bass-amp', 'ampeg-svt-4pro', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486506:bass-amp:ampeg-svt-4pro', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '베이스엠프: 암팩 SVT-4PRO', 'Ampeg SVT-4PRO', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room B', 'guitar-amp', 'marshall-jcm2000', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486506:guitar-amp:marshall-jcm2000', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '마샬 JCM 2000', 'Marshall JCM2000', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room B', 'guitar-amp', 'marshall-ma100h', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486506:guitar-amp:marshall-ma100h', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '마샬 MA 100H', 'Marshall MA100H', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room B', 'speaker', 'yamaha-c115v', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486506:speaker:yamaha-c115v', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '스피커: 야마하 C115V', 'Yamaha C115V', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room B', 'mixer', 'yamaha-emx5014c', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486506:mixer:yamaha-emx5014c', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '믹서: 야마하 EMX 5014C', 'Yamaha EMX5014C', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room B', 'microphone', 'd-com-dmk-951-nc', 4, NULL, false, '{"type":"wireless"}'::jsonb, 'naver:1033058:5486506:microphone:d-com-dmk-951-nc', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486506', '사운드시티 Room B 네이버 예약 상세', '무선 마이크: D COM DMK 951NC 4개', 'D-Com DMK 951 NC', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room C', 'drum-kit', 'pearl-vision', 1, NULL, false, '{"pieces":5}'::jsonb, 'naver:1033058:5486549:drum-kit:pearl-vision', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '드럼: 펄 비젼 5기통', 'Pearl Vision', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room C', 'bass-amp', 'ampeg-svt-4pro', 1, NULL, false, '{"head":true,"cabinet":true}'::jsonb, 'naver:1033058:5486549:bass-amp:ampeg-svt-4pro', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '베이스엠프: 암팩 4pro 해드&케비넷', 'Ampeg SVT-4PRO', 'MEDIUM'),
  ('studio-합정/홍대-사운드시티', 'Room C', 'guitar-amp', 'marshall-jcm2000', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486549:guitar-amp:marshall-jcm2000', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '마샬 JCM 2000', 'Marshall JCM2000', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room C', 'guitar-amp', 'marshall-origin-50', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486549:guitar-amp:marshall-origin-50', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '마샬 오리진 50', 'Marshall Origin 50', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room C', 'speaker', NULL, 1, NULL, false, '{"brand":"JBL"}'::jsonb, 'naver:1033058:5486549:speaker:jbl', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '스피커: JBL', 'JBL speaker', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room C', 'mixer', 'yamaha-emx5014c', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486549:mixer:yamaha-emx5014c', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '믹서: 야마하 EMX 5014C', 'Yamaha EMX5014C', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room C', 'microphone', 'd-com-dmk-951-nc', 4, NULL, false, '{"type":"wireless"}'::jsonb, 'naver:1033058:5486549:microphone:d-com-dmk-951-nc', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486549', '사운드시티 Room C 네이버 예약 상세', '무선 마이크: D COM DMK 951 NC 4개', 'D-Com DMK 951 NC', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room D', 'drum-kit', NULL, 1, NULL, false, '{"brand":"Yamaha","model_text":"Stage Custom"}'::jsonb, 'naver:1033058:5486609:drum-kit:yamaha-stage-custom', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '드럼: 야마하 스테이지 커스텀', 'Yamaha Stage Custom', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room D', 'bass-amp', NULL, 1, NULL, false, '{"brand":"Trace Elliot"}'::jsonb, 'naver:1033058:5486609:bass-amp:trace-elliot', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '베이스 엠프: 트레이스 엘리엇', 'Trace Elliot bass amp', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room D', 'guitar-amp', 'marshall-mg100fx', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486609:guitar-amp:marshall-mg100fx', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '마샬 MG100FX', 'Marshall MG100FX', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room D', 'guitar-amp', 'marshall-valvestate-stage-2000', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486609:guitar-amp:marshall-valvestate-stage-2000', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '마샬 벨브스테이트 stage2000', 'Marshall Valvestate Stage 2000', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room D', 'speaker', 'jbl-eon-515-xt', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486609:speaker:jbl-eon-515-xt', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '스피커: JBL EON 515 XT', 'JBL EON 515 XT', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room D', 'mixer', 'profx12', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486609:mixer:profx12', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '믹서: PRO FX12', 'Mackie ProFX12', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room D', 'microphone', 'd-com-dmk-951-nc', 4, NULL, false, '{"type":"wireless"}'::jsonb, 'naver:1033058:5486609:microphone:d-com-dmk-951-nc', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486609', '사운드시티 Room D 네이버 예약 상세', '무선 마이크: D COM DMK 951 NC 4개', 'D-Com DMK 951 NC', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room E', 'drum-kit', NULL, 1, NULL, false, '{"brand":"Yamaha","model_text":"Stage Custom"}'::jsonb, 'naver:1033058:5486623:drum-kit:yamaha-stage-custom', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '드럼: 야마하 스테이지 커스텀', 'Yamaha Stage Custom', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room E', 'bass-amp', 'fender-rumble-200', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486623:bass-amp:fender-rumble-200', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '베이스 엠프: 펜더 럼블 200', 'Fender Rumble 200', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room E', 'guitar-amp', 'marshall-valvestate-2000', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486623:guitar-amp:marshall-valvestate-2000', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '마샬 벨브스테이트 2000', 'Marshall Valvestate 2000', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room E', 'guitar-amp', 'marshall-mg100fx', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486623:guitar-amp:marshall-mg100fx', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '마샬 MG100fx', 'Marshall MG100FX', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room E', 'speaker', NULL, 1, NULL, false, '{"brand":"Behringer"}'::jsonb, 'naver:1033058:5486623:speaker:behringer', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '스피커: 베링거', 'Behringer speaker', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room E', 'mixer', 'profx12', 1, NULL, false, '{}'::jsonb, 'naver:1033058:5486623:mixer:profx12', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '믹서: PRO FX12', 'Mackie ProFX12', 'HIGH'),
  ('studio-합정/홍대-사운드시티', 'Room E', 'microphone', 'd-com-dmk-951-nc', 4, NULL, false, '{"type":"wireless"}'::jsonb, 'naver:1033058:5486623:microphone:d-com-dmk-951-nc', 'https://m.booking.naver.com/booking/10/bizes/1033058/items/5486623', '사운드시티 Room E 네이버 예약 상세', '무선 마이크: D COM DMK 951 NC 4개', 'D-Com DMK 951 NC', 'HIGH');

DELETE FROM room_equipment re
USING manual_soundcity_backline_placement placement
JOIN studios s ON s.slug = placement.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = placement.room_name
JOIN equipment_items ei ON ei.slug = placement.equipment_slug
LEFT JOIN equipment_models em ON em.slug = placement.model_slug
WHERE re.room_id = r.id
  AND re.equipment_id = ei.id
  AND (
    (placement.model_slug IS NULL AND re.equipment_model_id IS NULL)
    OR re.equipment_model_id = em.id
  )
  AND re.position_label IS NOT DISTINCT FROM placement.position_label;

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
  SUM(placement.quantity)::smallint,
  NULL,
  'MANUAL',
  NULL,
  placement.is_optional,
  placement.details
FROM manual_soundcity_backline_placement placement
JOIN studios s ON s.slug = placement.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = placement.room_name
JOIN equipment_items ei ON ei.slug = placement.equipment_slug
LEFT JOIN equipment_models em ON em.slug = placement.model_slug
GROUP BY r.id, ei.id, em.id, placement.is_optional, placement.details;

DELETE FROM equipment_evidence
WHERE evidence_key LIKE 'naver:1033058:%:guitar-amp-i:%'
   OR evidence_key LIKE 'naver:1033058:%:guitar-amp-ii:%'
   OR evidence_key LIKE 'naver:1033058:%:guitar-amp-iii:%';

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
  placement.evidence_key,
  'ROOM',
  NULL,
  r.id,
  ei.id,
  em.id,
  re.id,
  'NAVER_BOOKING',
  placement.source_url,
  placement.source_title,
  '방 설명',
  placement.raw_text,
  placement.parsed_name,
  placement.position_label,
  placement.is_optional,
  placement.confidence,
  '2026-07-22T11:20:00+09:00'::timestamptz
FROM manual_soundcity_backline_placement placement
JOIN studios s ON s.slug = placement.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = placement.room_name
JOIN equipment_items ei ON ei.slug = placement.equipment_slug
LEFT JOIN equipment_models em ON em.slug = placement.model_slug
JOIN room_equipment re
  ON re.room_id = r.id
  AND re.equipment_id = ei.id
  AND (
    (placement.model_slug IS NULL AND re.equipment_model_id IS NULL)
    OR re.equipment_model_id = em.id
  )
  AND re.position_label IS NOT DISTINCT FROM placement.position_label
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

DROP TABLE manual_soundcity_backline_placement;
