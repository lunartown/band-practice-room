/**
 * 스페이스클라우드 space API 에서 대표 이미지를 받아 studios.image_url_scraped 를 갱신한다.
 * (네이버용 enrich-studios.ts 와 짝 — 스페이스클라우드 전용 합주실은 네이버 소스가 없어
 *  enrich-studios.ts 가 건너뛰므로 이미지가 비어 이니셜 아바타로 폴백됐다.)
 *
 * - source_id=2(스페이스클라우드) studio_sources 의 external_key = spaceId.
 * - GET /spaces/{spaceId} 의 info.image_url(대표) → 없으면 images[0].image_url.
 * - 별점/리뷰수는 space API 가 신뢰성 있게 주지 않아 건드리지 않는다(rating 은 003 수동관리).
 *
 * 실행: cd src/scraper && npx tsx scripts/enrich-spacecloud.ts
 */
import { spacecloudGet } from '../src/spacecloud/api.js';
import { query, end } from '../src/db.js';

interface SourceRow {
  studio_id: string;
  studio_name: string;
  external_key: string | null;
}

interface SpaceResponse {
  info?: { image_url?: string | null };
  images?: Array<{ image_url?: string | null }>;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const sources = await query<SourceRow>(`
    SELECT ss.studio_id, st.name AS studio_name, ss.external_key
    FROM studio_sources ss
    INNER JOIN studios st ON st.id = ss.studio_id
    WHERE ss.source_id = 2
    ORDER BY ss.id
  `);

  let updated = 0;
  let withImage = 0;
  let failed = 0;

  for (const src of sources.rows) {
    const spaceId = src.external_key?.trim();
    if (!spaceId) {
      failed++;
      continue;
    }

    try {
      const space = await spacecloudGet<SpaceResponse>(`/spaces/${spaceId}`);
      const imageUrl = space.info?.image_url || space.images?.[0]?.image_url || null;

      // COALESCE: 못 받은 값은 기존 값 유지(빈 응답이 멀쩡한 이미지를 NULL 로 덮지 않게).
      await query(
        `UPDATE studios
         SET image_url_scraped = COALESCE($2, image_url_scraped)
         WHERE id = $1`,
        [src.studio_id, imageUrl],
      );

      updated++;
      if (imageUrl) withImage++;
      console.log(`[enrich:sc] ${src.studio_name} (space ${spaceId}): img=${imageUrl ? 'O' : 'X'}`);
    } catch (e) {
      failed++;
      console.warn(`[enrich:sc] ${src.studio_name} (space ${spaceId}): ${(e as Error).message}`);
    }
    await sleep(250);
  }

  console.log(`\n완료: 갱신 ${updated} (이미지 ${withImage}), 실패 ${failed}`);
  await end();

  // 대상이 충분한데 한 장도 못 받았으면 API 변경/차단 같은 조직적 실패 → 빨갛게 보이게.
  if (sources.rows.length >= 5 && withImage === 0) {
    console.error(
      '\n[enrich:sc] 경고: 이미지를 하나도 받지 못했습니다. 스페이스클라우드 API 변경/차단 가능성(차단된 환경에서 실행?).',
    );
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
