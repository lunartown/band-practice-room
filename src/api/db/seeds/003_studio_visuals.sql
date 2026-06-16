-- 합주실 비주얼 매뉴얼 입력 (이미지 / 평점 / 리뷰수)
--
-- 002_studios.sql 은 자동 생성이라 매번 TRUNCATE 로 덮어쓰여진다.
-- 매뉴얼 값은 이 파일에서 slug 기준 UPDATE 로 따로 관리하므로 재생성과 충돌하지 않는다.
-- 002 이후에 실행할 것.
--
-- 새 합주실을 추가할 때 아래 블록을 복사해 slug / 값만 바꾸면 된다.
-- 썸네일은 image_url_manual(수동) 에만 넣는다. image_url_scraped 는 스크래퍼가 채운다.
-- 둘 다 비어 있으면(NULL) 프론트가 이름 이니셜 아바타로 폴백한다. (응답은 manual 우선)

UPDATE studios SET
  image_url_manual = NULL,        -- 예: 'https://.../st-music.jpg'
  rating           = 4.6,
  review_count     = 128
WHERE slug = 'studio-합정/홍대-st-music';

-- UPDATE studios SET
--   image_url_manual = 'https://.../example.jpg',
--   rating           = 4.3,
--   review_count     = 57
-- WHERE slug = 'studio-...';
