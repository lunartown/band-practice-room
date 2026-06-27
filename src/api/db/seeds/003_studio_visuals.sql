-- 합주실 비주얼 매뉴얼 입력 (이미지 / 평점 / 리뷰수)
--
-- 002_studios.sql 은 자동 생성이라 매번 TRUNCATE 로 덮어쓰여진다.
-- 매뉴얼 값은 이 파일에서 slug 기준 UPDATE 로 따로 관리하므로 재생성과 충돌하지 않는다.
-- 002 이후에 실행할 것.
--
-- 새 합주실을 추가할 때 아래 블록을 복사해 slug / 값만 바꾸면 된다.
-- 썸네일은 image_url_manual(수동) 에만 넣는다. image_url_scraped 는 스크래퍼가 채운다.
-- 둘 다 비어 있으면(NULL) 프론트가 이름 이니셜 아바타로 폴백한다. (응답은 manual 우선)
--
-- image_url_manual 에 넣을 수 있는 값 두 가지:
--   1) 외부 URL          : 'https://.../foo.jpg' (네이버 CDN 등)
--   2) 직접 커밋한 이미지 : '/studios/foo.webp'
--      → 파일을 src/web/public/studios/ 에 두고 루트 경로로 참조.
--
-- 직접 커밋 이미지는 손으로 넣지 말고 도구를 쓰는 게 편하다(리사이즈+이 파일 갱신 자동):
--   cd src/scraper && npm run thumbnail -- --slug '<slug>' --image <파일|URL> [--name <영문>]
-- 도구가 아래 "managed thumbnails" 블록을 자동 관리한다. 규칙: src/web/public/studios/README.md

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

-- 직접 커밋한 이미지를 쓰는 예 (src/web/public/studios/brother-gangdong.jpg):
-- UPDATE studios SET image_url_manual = '/studios/brother-gangdong.jpg'
-- WHERE slug = 'studio-강동/송파-브라더-강동';

-- === BEGIN managed thumbnails (set-thumbnail) ===
-- 이 블록은 `npm run thumbnail` 가 자동 관리한다. 직접 편집하지 말 것.
UPDATE studios SET image_url_manual = '/studios/ground.webp' WHERE slug = 'studio-신촌-그라운드-신촌';
UPDATE studios SET image_url_manual = '/studios/ground.webp' WHERE slug = 'studio-신촌-신촌-그라운드';
UPDATE studios SET image_url_manual = '/studios/ground.webp' WHERE slug = 'studio-합정/홍대-그라운드-본점';
UPDATE studios SET image_url_manual = '/studios/ground.webp' WHERE slug = 'studio-합정/홍대-그라운드-합정1호점';
UPDATE studios SET image_url_manual = '/studios/ground.webp' WHERE slug = 'studio-합정/홍대-그라운드합주실-홍대1호점';
UPDATE studios SET image_url_manual = '/studios/soundcity.webp' WHERE slug = 'studio-사당/이수-사운드시티합주실-방배점';
UPDATE studios SET image_url_manual = '/studios/abbey-road.webp' WHERE slug = 'studio-합정/홍대-에비로드';
UPDATE studios SET image_url_manual = '/studios/orange.webp' WHERE slug = 'studio-합정/홍대-오렌지';
UPDATE studios SET image_url_manual = '/studios/wavelab.webp' WHERE slug = 'studio-합정/홍대-웨이브랩';
UPDATE studios SET image_url_manual = '/studios/wavelab.webp' WHERE slug = 'studio-합정/홍대-웨이브랩2호점';
UPDATE studios SET image_url_manual = '/studios/imak.webp' WHERE slug = 'studio-합정/홍대-이막';
UPDATE studios SET image_url_manual = '/studios/soundcity.webp' WHERE slug = 'studio-합정/홍대-사운드시티';
UPDATE studios SET image_url_manual = '/studios/soundcity.webp' WHERE slug = 'studio-합정/홍대-사운드시티-홍대점';
UPDATE studios SET image_url_manual = '/studios/jam.webp' WHERE slug = 'studio-합정/홍대-잼-합주실';
UPDATE studios SET image_url_manual = '/studios/tiger.webp' WHERE slug = 'studio-합정/홍대-호랑이';
UPDATE studios SET image_url_manual = '/studios/hail-music.webp' WHERE slug = 'studio-합정/홍대-헤일-뮤직-스튜디오';
-- === END managed thumbnails ===
