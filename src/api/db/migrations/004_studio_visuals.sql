-- 합주실 비주얼용 매뉴얼 필드.
-- 스크래퍼가 없어도 시드(003_studio_visuals.sql)로 수동 입력할 수 있고,
-- 추후 스크래퍼가 생기면 동일 컬럼을 덮어쓰면 된다. (rooms.price_source='MANUAL' 패턴과 동일)

ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS image_url VARCHAR(512),
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  ADD COLUMN IF NOT EXISTS review_count INTEGER CHECK (review_count IS NULL OR review_count >= 0);
