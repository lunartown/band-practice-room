-- 제조사 표기(영문/한글)와 모델 검색어를 별도 정규화한다.
CREATE TABLE IF NOT EXISTS equipment_model_aliases (
  id BIGSERIAL PRIMARY KEY,
  equipment_model_id BIGINT NOT NULL REFERENCES equipment_models(id) ON DELETE CASCADE,
  alias VARCHAR(192) NOT NULL,
  normalized_alias VARCHAR(192) NOT NULL,
  UNIQUE (equipment_model_id, normalized_alias)
);

CREATE INDEX IF NOT EXISTS idx_equipment_model_aliases_normalized
  ON equipment_model_aliases (lower(normalized_alias));

-- 기존 모델의 normalized_name도 검색용 공백/대소문자 규칙을 통일한다.
UPDATE equipment_models
SET normalized_name = lower(
  trim(regexp_replace(replace(normalized_name, '-', ' '), '\s+', ' ', 'g'))
)
WHERE normalized_name IS NOT NULL;

WITH brand_alias(brand, alias) AS (
  VALUES
    ('Yamaha', '야마하'),
    ('Marshall', '마샬'),
    ('Marshall', '마셜'),
    ('Roland', '롤랜드'),
    ('Korg', '코르그'),
    ('Korg', '코그'),
    ('Fender', '펜더'),
    ('Ampeg', '암펙'),
    ('Aguilar', '아귈라'),
    ('Behringer', '베링거'),
    ('Mackie', '맥키'),
    ('Nord', '노드'),
    ('Pearl', '펄'),
    ('Gretsch', '그레치'),
    ('Tama', '타마'),
    ('Zildjian', '질지언'),
    ('Shure', '슈어')
)
INSERT INTO equipment_model_aliases (equipment_model_id, alias, normalized_alias)
SELECT em.id, ba.alias, lower(trim(regexp_replace(ba.alias, '\s+', ' ', 'g')))
FROM equipment_models em
JOIN brand_alias ba ON ba.brand = em.brand
WHERE em.is_active = true
ON CONFLICT (equipment_model_id, normalized_alias) DO NOTHING;

-- 모델명 자체도 동일한 검색 경로로 취급해 영문/기호 표기를 일관되게 검색한다.
INSERT INTO equipment_model_aliases (equipment_model_id, alias, normalized_alias)
SELECT id, model, lower(trim(regexp_replace(replace(model, '-', ' '), '\s+', ' ', 'g')))
FROM equipment_models
WHERE is_active = true AND model IS NOT NULL AND trim(model) <> ''
ON CONFLICT (equipment_model_id, normalized_alias) DO NOTHING;
