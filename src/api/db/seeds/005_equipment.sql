INSERT INTO equipment_categories (id, slug, name, "order", is_active)
VALUES
  (1, 'drums', '드럼', 1, true),
  (2, 'amps', '앰프', 2, true),
  (3, 'keys', '건반', 3, true),
  (4, 'pa', 'PA/음향', 4, true),
  (5, 'recording', '녹음', 5, true),
  (6, 'accessories', '부가 장비', 6, true)
ON CONFLICT (id) DO UPDATE SET
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  "order" = EXCLUDED."order",
  is_active = EXCLUDED.is_active;

INSERT INTO equipment_items (id, category_id, slug, name, normalized_name, is_active)
VALUES
  (1, 1, 'drum-kit', '드럼 세트', 'drum kit', true),
  (2, 1, 'cymbal-set', '심벌 세트', 'cymbal set', true),
  (3, 1, 'double-pedal', '더블 페달', 'double pedal', true),
  (4, 2, 'guitar-amp', '기타 앰프', 'guitar amp', true),
  (5, 2, 'bass-amp', '베이스 앰프', 'bass amp', true),
  (6, 3, 'keyboard', '키보드', 'keyboard', true),
  (7, 3, 'digital-piano', '디지털 피아노', 'digital piano', true),
  (8, 3, 'acoustic-piano', '어쿠스틱 피아노', 'acoustic piano', true),
  (9, 4, 'microphone', '마이크', 'microphone', true),
  (10, 4, 'mixer', '믹서', 'mixer', true),
  (11, 4, 'speaker', '스피커', 'speaker', true),
  (12, 4, 'monitor-speaker', '모니터 스피커', 'monitor speaker', true),
  (13, 5, 'audio-interface', '오디오 인터페이스', 'audio interface', true),
  (14, 5, 'recording-booth', '녹음 부스', 'recording booth', true),
  (15, 6, 'music-stand', '보면대', 'music stand', true),
  (16, 6, 'guitar-stand', '기타 스탠드', 'guitar stand', true)
ON CONFLICT (id) DO UPDATE SET
  category_id = EXCLUDED.category_id,
  slug = EXCLUDED.slug,
  name = EXCLUDED.name,
  normalized_name = EXCLUDED.normalized_name,
  is_active = EXCLUDED.is_active;

WITH alias_seed(slug, alias) AS (
  VALUES
    ('drum-kit', '드럼'),
    ('drum-kit', '드럼셋'),
    ('drum-kit', '드럼세트'),
    ('cymbal-set', '심벌'),
    ('cymbal-set', '심벌셋'),
    ('cymbal-set', '심벌세트'),
    ('double-pedal', '더블페달'),
    ('guitar-amp', '기타앰프'),
    ('guitar-amp', '기타 앰프'),
    ('guitar-amp', '일렉 앰프'),
    ('guitar-amp', 'guitar amp'),
    ('bass-amp', '베이스앰프'),
    ('bass-amp', '베이스 앰프'),
    ('bass-amp', 'bass amp'),
    ('keyboard', '건반'),
    ('keyboard', '키보드'),
    ('digital-piano', '디피'),
    ('digital-piano', '디지털피아노'),
    ('acoustic-piano', '피아노'),
    ('acoustic-piano', '어쿠스틱피아노'),
    ('microphone', '마이크'),
    ('microphone', 'mic'),
    ('microphone', '마이크로폰'),
    ('mixer', '믹서'),
    ('mixer', '믹싱 콘솔'),
    ('speaker', '스피커'),
    ('speaker', 'pa 스피커'),
    ('monitor-speaker', '모니터'),
    ('monitor-speaker', '모니터스피커'),
    ('audio-interface', '오인페'),
    ('audio-interface', '오디오인터페이스'),
    ('recording-booth', '녹음부스'),
    ('music-stand', '악보대'),
    ('music-stand', '보면대'),
    ('guitar-stand', '기타스탠드')
)
INSERT INTO equipment_aliases (equipment_id, alias)
SELECT ei.id, alias_seed.alias
FROM alias_seed
JOIN equipment_items ei ON ei.slug = alias_seed.slug
ON CONFLICT (equipment_id, alias) DO NOTHING;

SELECT setval(pg_get_serial_sequence('equipment_categories', 'id'), COALESCE((SELECT MAX(id) FROM equipment_categories), 1));
SELECT setval(pg_get_serial_sequence('equipment_items', 'id'), COALESCE((SELECT MAX(id) FROM equipment_items), 1));
SELECT setval(pg_get_serial_sequence('equipment_aliases', 'id'), COALESCE((SELECT MAX(id) FROM equipment_aliases), 1));
