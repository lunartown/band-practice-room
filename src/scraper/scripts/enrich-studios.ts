/**
 * 네이버 예약 GraphQL API 에서 스튜디오 메타(대표 이미지, 리뷰 수, 별점)를 받아
 * studios 테이블을 갱신한다. (슬롯 스크래퍼와 별개의 1회성/주기 보강)
 *
 * - image_url_scraped: business.businessResources 첫 번째(커버) 이미지
 * - review_count:      reviewStats.totalCount
 * - rating:            reviewStats.avgRating (단, ratingUserCount>0 일 때만. 네이버 예약
 *                      리뷰는 대부분 키워드식이라 별점이 0/없음)
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
  let withRating = 0;
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
      // 별점은 실제로 평가한 사람이 있을 때만 의미가 있다.
      const rating =
        stats.ratingUserCount && stats.ratingUserCount > 0 ? stats.avgRating : null;

      await query(
        `UPDATE studios
         SET image_url_scraped = $2, review_count = $3, rating = $4
         WHERE id = $1`,
        [src.studio_id, imageUrl, reviewCount, rating],
      );

      updated++;
      if (imageUrl) withImage++;
      if (rating !== null) withRating++;
      console.log(
        `[enrich] ${src.studio_name}: img=${imageUrl ? 'O' : 'X'} reviews=${reviewCount ?? '-'} rating=${rating ?? '-'}`,
      );
    } catch (e) {
      failed++;
      console.warn(`[enrich] ${src.studio_name}: ${(e as Error).message}`);
    }
    await sleep(250);
  }

  console.log(`\n완료: 갱신 ${updated} (이미지 ${withImage}, 별점 ${withRating}), 실패 ${failed}`);
  await end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
