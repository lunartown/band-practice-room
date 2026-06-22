# 합주실 썸네일 (직접 커밋)

네이버 대표 이미지가 별로일 때, 우리가 고른 이미지를 여기에 두고 쓴다.
별도 이미지 호스팅 없이 Vercel 정적 서빙으로 끝난다.

## 쓰는 법

1. 이미지를 이 폴더에 넣는다. 파일명은 읽기 쉬운 영문 슬러그로.
   예) `brother-gangdong.jpg`

2. 시드(`src/api/db/seeds/003_studio_visuals.sql`)에서 해당 합주실에
   **루트 경로**로 연결한다(도메인 X, `/studios/...`로 시작):

   ```sql
   UPDATE studios SET image_url_manual = '/studios/brother-gangdong.jpg'
   WHERE slug = 'studio-강동/송파-브라더-강동';
   ```

   `image_url_manual` 은 스크래퍼가 채우는 `image_url_scraped` 보다 우선한다.

## 이미지 가이드

- **정사각(1:1)**, 합주실 분위기가 드러나는 사진. 아바타는 중앙 크롭(`object-fit: cover`)된다.
- **작게**: 표시 크기는 44px(레티나 ~132px)뿐이다. 네이버 CDN 이미지는 프론트가
  자동 리사이즈하지만(`lib/imageUrl.ts`), **여기 둔 로컬 파일은 리사이즈가 안 된다.**
  그러니 커밋 전에 **256px 안팎**으로 줄이고 압축할 것(파일 수 KB 목표).
- 포맷: `.jpg`/`.webp` 권장.

## 경로 동작

Vite 가 `public/` 을 빌드 루트로 복사하므로 `/studios/<파일명>` 으로 서빙된다.
이미지 `src` 는 페이지(프론트) 도메인 기준으로 해석되므로, API/DB 위치와 무관하다.
