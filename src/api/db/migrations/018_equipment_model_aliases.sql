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

-- 한글로 실제 검색되는 제조사만 등록한다. DW·PDP·SWR·EBS·JBL·NUX처럼
-- 국내에서도 알파벳 그대로 쓰는 약어 브랜드는 모델명 별칭으로 충분해 제외한다.
WITH brand_alias(brand, alias) AS (
  VALUES
    ('Yamaha', '야마하'),
    ('Marshall', '마샬'),
    ('Marshall', '마셜'),
    ('Roland', '롤랜드'),
    ('Roland', '롤란드'),
    ('Korg', '코르그'),
    ('Korg', '코그'),
    ('Fender', '펜더'),
    ('Ampeg', '암펙'),
    ('Ampeg', '앰펙'),
    ('Aguilar', '아귈라'),
    ('Aguilar', '아길라'),
    ('Behringer', '베링거'),
    ('Mackie', '맥키'),
    ('Nord', '노드'),
    ('Pearl', '펄'),
    ('Gretsch', '그레치'),
    ('Gretsch', '그렛치'),
    ('Tama', '타마'),
    ('Zildjian', '질지언'),
    ('Zildjian', '질디언'),
    ('Shure', '슈어'),
    ('Orange', '오렌지'),
    ('Kurzweil', '커즈와일'),
    ('Kurzweil', '커즈웨일'),
    ('Hartke', '하케'),
    ('Laney', '레이니'),
    ('Markbass', '마크베이스'),
    ('Ashdown', '애쉬다운'),
    ('Ashdown', '애시다운'),
    ('Blackstar', '블랙스타'),
    ('Sonor', '소노'),
    ('Dixon', '딕슨'),
    ('Mapex', '메이펙스'),
    ('Mesa/Boogie', '메사부기'),
    ('Mesa/Boogie', '메사 부기'),
    ('Vox', '복스'),
    ('Canopus', '캐노푸스'),
    ('Peace', '피스'),
    ('Premier', '프리미어'),
    ('Sabian', '사비안'),
    ('Soundcraft', '사운드크래프트'),
    ('Alesis', '알레시스'),
    ('Amedia', '아메디아'),
    ('Bosphorus', '보스포러스'),
    ('Bugera', '부게라'),
    ('Darkglass', '다크글라스'),
    ('DrumCraft', '드럼크래프트'),
    ('Epifani', '에피파니'),
    ('Gallien-Krueger', '갈리엔크루거'),
    ('Gallien-Krueger', '지케이'),
    ('GRBass', '지알베이스'),
    ('Hughes & Kettner', '휴즈앤케트너'),
    ('Istanbul Agop', '이스탄불 아곱'),
    ('Istanbul Mehmet', '이스탄불 메흐메트'),
    ('Line 6', '라인식스'),
    ('Ludwig', '루드윅'),
    ('Peavey', '피베이'),
    ('Trace Elliot', '트레이스 엘리엇'),
    ('Young Chang', '영창')
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
