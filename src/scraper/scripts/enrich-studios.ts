/**
 * 네이버 예약 GraphQL API 에서 스튜디오 메타(대표 이미지, 리뷰 수, 별점)를 받아
 * studios 테이블을 갱신한다. (슬롯 스크래퍼와 별개의 1회성/주기 보강)
 *
 * - image_url_scraped: business.businessResources 첫 번째(커버) 이미지
 * - review_count:      reviewStats.totalCount
 * - review_keywords:   긍정 키워드 상위 N개 [{keyword, count}] (별점 대체 품질 신호)
 *
 * 별점(rating)은 네이버 예약 리뷰가 키워드식이라 신뢰 가능한 곳이 4곳뿐이라 쓰지 않는다(null).
 *
 * 실행: cd src/scraper && npx tsx scripts/enrich-studios.ts
 */
import { fetchBusinessImages, fetchReviewStats } from '../src/naver/client.js';
import { query, end } from '../src/db.js';

interface SourceRow {
  studio_id: string;
  studio_name: string;
  external_key: string | null;
  url: string | null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 갤러리에 담을 최대 장수. 예약 API business 이미지 상위 N장만 노출한다.
const MAX_GALLERY_IMAGES = 5;

function parseBusinessTypeId(url: string | null): number | null {
  const m = url?.match(/\/booking\/(\d+)\//);
  return m ? Number(m[1]) : null;
}

async function main() {
  const sources = await query<SourceRow>(`
    SELECT ss.studio_id, st.name AS studio_name, ss.external_key, ss.url
    FROM studio_sources ss
    INNER JOIN studios st ON st.id = ss.studio_id
    ORDER BY ss.id
  `);

  let updated = 0;
  let withImage = 0;
  let withKeywords = 0;
  let failed = 0;

  for (const src of sources.rows) {
    const businessId = src.external_key ?? src.url?.match(/\/bizes\/(\d+)/)?.[1];
    const businessTypeId = parseBusinessTypeId(src.url);
    if (!businessId || businessTypeId === null) {
      failed++;
      continue;
    }

    try {
      const [images, stats] = await Promise.all([
        fetchBusinessImages({ businessId, businessTypeId }),
        fetchReviewStats({ businessId, businessTypeId }),
      ]);

      const imageUrl = images[0] ?? null;
      const reviewCount = stats.totalCount;
      const keywords = stats.keywords;

      // COALESCE 로 "못 받은 값은 기존 값 유지". 네이버가 빈 응답을 줘도(imageUrl=null 등)
      // 멀쩡하던 데이터를 NULL 로 덮어쓰지 않는다. rating 은 시드(003)에서 수동 관리하므로
      // enrich 가 건드리지 않는다(예전엔 rating=NULL 로 매번 지웠음).
      await query(
        `UPDATE studios
         SET image_url_scraped = COALESCE($2, image_url_scraped),
             review_count      = COALESCE($3, review_count),
             review_keywords   = COALESCE($4::jsonb, review_keywords)
         WHERE id = $1`,
        [src.studio_id, imageUrl, reviewCount, keywords.length ? JSON.stringify(keywords) : null],
      );

      // 갤러리(별도 테이블): 상위 N장을 upsert 한다.
      // - (studio_id, image_url) 충돌 시 순서만 갱신하고 status 는 보존 → 운영자가
      //   HIDDEN 한 사진이 다음 수집에서 되살아나지 않는다.
      // - API 가 더는 안 주는 SCRAPED 사진은 정리하되 MANUAL 사진은 건드리지 않는다.
      // - 빈 응답(images=[]) 이면 네이버 차단일 수 있으므로 멀쩡한 갤러리를 지우지 않는다
      //   (단일 컬럼을 COALESCE 로 보존하는 것과 동일한 이유).
      const gallery = images.slice(0, MAX_GALLERY_IMAGES);
      if (gallery.length > 0) {
        for (let i = 0; i < gallery.length; i++) {
          await query(
            `INSERT INTO studio_images (studio_id, source, image_url, sort_order, status)
             VALUES ($1, 'SCRAPED', $2, $3, 'OK')
             ON CONFLICT (studio_id, image_url)
             DO UPDATE SET sort_order = EXCLUDED.sort_order, updated_at = NOW()`,
            [src.studio_id, gallery[i], i],
          );
        }
        await query(
          `DELETE FROM studio_images
           WHERE studio_id = $1 AND source = 'SCRAPED' AND image_url <> ALL($2::text[])`,
          [src.studio_id, gallery],
        );
      }

      updated++;
      if (imageUrl) withImage++;
      if (keywords.length) withKeywords++;
      const top = keywords
        .slice(0, 3)
        .map((k) => `${k.keyword}(${k.count})`)
        .join(', ');
      console.log(
        `[enrich] ${src.studio_name}: img=${gallery.length}장 reviews=${reviewCount ?? '-'} | ${top || '키워드 없음'}`,
      );
    } catch (e) {
      failed++;
      console.warn(`[enrich] ${src.studio_name}: ${(e as Error).message}`);
    }
    await sleep(250);
  }

  console.log(`\n완료: 갱신 ${updated} (이미지 ${withImage}, 키워드 ${withKeywords}), 실패 ${failed}`);
  await end();

  // 처리 대상이 충분한데 이미지를 하나도 못 받았다면 네이버 차단/API 변경 같은
  // 조직적 실패일 가능성이 크다. (이제 데이터를 덮어쓰진 않지만) 조용한 '성공'으로
  // 묻히지 않도록 비정상 종료시켜 워크플로우에서 빨갛게 보이게 한다.
  if (sources.rows.length >= 5 && withImage === 0) {
    console.error(
      '\n[enrich] 경고: 이미지를 하나도 받지 못했습니다. 네이버 접근이 차단됐을 수 있습니다(차단된 환경에서 실행?).',
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
