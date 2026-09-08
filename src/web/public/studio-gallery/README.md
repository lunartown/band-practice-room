# 갤러리 첫 사진 WebP

카드에 표시하는 실제 첫 갤러리 사진을 모바일 크기에 맞게 변환한 정적 파일이다.
합주실 로고나 대표 썸네일을 대신 쓰지 않는다.

네이버 `ldb-phinf.pstatic.net`은 `type=w480` 리사이즈를 지원하지 않아 원본이
수 MB까지 커진다. 아래 명령은 운영 API의 각 합주실 첫 갤러리 사진을 720px 이하
WebP로 변환하고 `src/web/src/generated/galleryCovers.ts` 매핑을 갱신한다.

```bash
cd src/scraper
npm run gallery:covers
```

매핑은 합주실 ID뿐 아니라 원본 URL도 비교한다. 운영 API의 첫 사진이 바뀌면 예전
파일을 잘못 표시하지 않고 원격 사진으로 안전하게 되돌아간다.
