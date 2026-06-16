-- 합주실 비주얼용 필드.
-- 썸네일은 출처를 분리한다: image_url_manual(수동 입력) / image_url_scraped(스크래퍼).
-- 응답에서는 매뉴얼 우선으로 COALESCE(manual, scraped) 하여 하나로 합친다.
-- 평점/리뷰수는 시드(003_studio_visuals.sql)로 수동 입력하며,
-- 추후 스크래퍼가 image_url_scraped 등을 채울 수 있다. (rooms.price_source='MANUAL' 패턴과 동일)

ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS image_url_manual  VARCHAR(512),
  ADD COLUMN IF NOT EXISTS image_url_scraped VARCHAR(512),
  ADD COLUMN IF NOT EXISTS rating NUMERIC(2, 1) CHECK (rating IS NULL OR (rating >= 0 AND rating <= 5)),
  ADD COLUMN IF NOT EXISTS review_count INTEGER CHECK (review_count IS NULL OR review_count >= 0);

-- 이전 단일 image_url 컬럼이 있었다면 매뉴얼/스크랩 분리로 대체되었으므로 정리
ALTER TABLE studios DROP COLUMN IF EXISTS image_url;
