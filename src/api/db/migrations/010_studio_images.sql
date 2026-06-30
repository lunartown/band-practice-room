-- 합주실별 내부 사진 갤러리(여러 장).
-- 기존 studios.image_url_manual/scraped 는 "대표 1장(커버)"로 남기고,
-- 갤러리(4~5장)는 출처·순서·노출상태를 행 단위로 관리할 수 있게 별도 테이블로 분리한다.
--
-- source : 'SCRAPED'(네이버 예약 API business 이미지) / 'MANUAL'(운영자 직접 입력)
-- status : 'OK'(노출) / 'HIDDEN'(개별 숨김). 운영자가 부적합한 장만 빼는 opt-out 용도.
-- sort_order : 갤러리 표시 순서(작을수록 앞). 예약 API order 를 그대로 받는다.
--
-- 재수집(enrich)은 (studio_id, image_url) 충돌 시 순서만 갱신하고 status 는 보존한다
-- → 운영자가 HIDDEN 한 사진이 다음 수집에서 다시 살아나지 않는다.

CREATE TABLE IF NOT EXISTS studio_images (
  id          BIGSERIAL PRIMARY KEY,
  studio_id   BIGINT NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  source      VARCHAR(16) NOT NULL DEFAULT 'SCRAPED',
  image_url   VARCHAR(512) NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  status      VARCHAR(16) NOT NULL DEFAULT 'OK',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT studio_images_source_check CHECK (source IN ('SCRAPED', 'MANUAL')),
  CONSTRAINT studio_images_status_check CHECK (status IN ('OK', 'HIDDEN')),
  CONSTRAINT studio_images_studio_url_uniq UNIQUE (studio_id, image_url)
);

-- 합주실별 노출 갤러리 조회용(studio_id 로 묶고 노출/순서로 정렬).
CREATE INDEX IF NOT EXISTS idx_studio_images_studio
  ON studio_images (studio_id, status, sort_order);
