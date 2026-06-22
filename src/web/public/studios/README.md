# 합주실 썸네일 (직접 커밋)

네이버 대표 이미지가 별로일 때, 우리가 고른 이미지를 여기에 두고 쓴다.
별도 이미지 호스팅 없이 Vercel 정적 서빙으로 끝난다.

## 추천: 도구 한 방 (`npm run thumbnail`)

리사이즈·저장·시드 갱신·DB 반영을 자동으로 해준다. 손으로 줄이거나 SQL 고칠 필요 없음.

```bash
cd src/scraper
npm run thumbnail -- --slug '<studio slug>' --image <파일경로|URL> [--name <영문파일명>]
```

예:

```bash
npm run thumbnail -- --slug 'studio-강동/송파-브라더-강동' \
  --image ~/Downloads/brother.jpg --name brother-gangdong
```

이 도구가 하는 일:

1. 이미지를 **256² 정사각 중앙 크롭 + webp 압축** → `src/web/public/studios/<name>.webp`
2. 시드 `003_studio_visuals.sql` 의 관리 블록에 `UPDATE ... image_url_manual` upsert (재시드해도 유지)
3. `DATABASE_URL` 이 있으면 DB 에도 즉시 반영 (없으면 다음 재시드 때 적용)

마지막에 **변경된 이미지·시드를 커밋**하면 끝. slug 를 모르면 `002_studios.sql` 에서 이름으로 찾는다.

## (참고) 손으로 할 때

이미지를 이 폴더에 직접 두고, 시드에서 루트 경로로 연결해도 된다:

```sql
UPDATE studios SET image_url_manual = '/studios/brother-gangdong.webp'
WHERE slug = 'studio-강동/송파-브라더-강동';
```

`image_url_manual` 은 스크래퍼가 채우는 `image_url_scraped` 보다 우선한다.
손으로 둘 때는 **256px 안팎 정사각**으로 미리 줄일 것 — 로컬 파일은 프론트 자동
리사이즈(`lib/imageUrl.ts`, 네이버 CDN 전용)가 적용되지 않는다.

## 경로 동작

Vite 가 `public/` 을 빌드 루트로 복사하므로 `/studios/<파일명>` 으로 서빙된다.
이미지 `src` 는 페이지(프론트) 도메인 기준으로 해석되므로 API/DB 위치와 무관하다.
