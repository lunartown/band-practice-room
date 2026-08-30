/**
 * 신규 합주실의 네이버 플레이스/예약 이미지를 썸네일 수동 검수용으로 내려받는다.
 * 운영 DB와 소스 파일은 변경하지 않고 `_local/thumbnail-candidates`만 생성한다.
 *
 * 실행:
 *   cd src/scraper
 *   DATABASE_URL=... npx tsx scripts/collect-thumbnail-candidates.ts
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';
import { fetchBusinessImages } from '../../scrape-core/naver/client.js';
import { end, query } from '../src/db.js';

type SourceRow = {
  slug: string;
  studio_name: string;
  business_id: string;
  url: string;
};

type DiscoveryCandidate = {
  bookingBusinessId: string | null;
  imageUrl: string | null;
};

const REPO_ROOT = resolve(import.meta.dirname, '../../..');
const DISCOVERY_PATH = resolve(REPO_ROOT, '_local/nationwide-studio-discovery.json');
const OUTPUT_DIR = resolve(REPO_ROOT, '_local/thumbnail-candidates');
const MANIFEST_PATH = resolve(OUTPUT_DIR, 'manifest.json');
const MAX_IMAGES = 8;
const SLUGS_PATH = process.env.THUMBNAIL_SLUGS_PATH;

function businessTypeId(url: string): number {
  const match = url.match(/\/booking\/(\d+)\//);
  if (!match) throw new Error(`예약 유형을 찾을 수 없습니다: ${url}`);
  return Number(match[1]);
}

function unique(values: Array<string | null | undefined>): string[] {
  return [...new Set(values.filter((value): value is string => !!value))];
}

async function download(url: string, path: string): Promise<{ width: number | null; height: number | null }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const input = Buffer.from(await response.arrayBuffer());
  const metadata = await sharp(input).metadata();
  await sharp(input)
    .rotate()
    .resize(640, 640, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toFile(path);
  return { width: metadata.width ?? null, height: metadata.height ?? null };
}

async function main() {
  const selectedSlugs = SLUGS_PATH
    ? new Set(
        (await readFile(SLUGS_PATH, 'utf8'))
          .split('\n')
          .map((slug) => slug.trim())
          .filter(Boolean),
      )
    : null;
  const discovery = JSON.parse(await readFile(DISCOVERY_PATH, 'utf8')) as {
    candidates: DiscoveryCandidate[];
  };
  const placeImages = new Map(
    discovery.candidates
      .filter((candidate) => candidate.bookingBusinessId && candidate.imageUrl)
      .map((candidate) => [candidate.bookingBusinessId as string, candidate.imageUrl as string]),
  );
  const sources = await query<SourceRow>(`
    SELECT s.slug, s.name AS studio_name, ss.external_key AS business_id, ss.url
    FROM studios s
    JOIN studio_sources ss ON ss.studio_id = s.id AND ss.source_id = 1
    WHERE s.is_active = true
      AND s.slug LIKE 'studio-naver-%'
      AND ss.external_key IS NOT NULL
      AND ss.url IS NOT NULL
    ORDER BY s.name, s.id
  `);
  const selectedSources = selectedSlugs
    ? sources.rows.filter((source) => selectedSlugs.has(source.slug))
    : sources.rows;
  await mkdir(OUTPUT_DIR, { recursive: true });

  const studios = [];
  let failed = 0;
  for (let studioIndex = 0; studioIndex < selectedSources.length; studioIndex++) {
    const source = selectedSources[studioIndex];
    const directory = resolve(OUTPUT_DIR, source.business_id);
    await mkdir(directory, { recursive: true });
    const images = unique([
      placeImages.get(source.business_id),
      ...(await fetchBusinessImages({
        businessId: source.business_id,
        businessTypeId: businessTypeId(source.url),
      })),
    ]).slice(0, MAX_IMAGES);
    const candidates = [];
    for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
      const fileName = `${String(imageIndex + 1).padStart(2, '0')}.jpg`;
      const localPath = resolve(directory, fileName);
      try {
        const dimensions = await download(images[imageIndex], localPath);
        candidates.push({
          number: imageIndex + 1,
          localPath,
          sourceUrl: images[imageIndex],
          ...dimensions,
        });
      } catch (error) {
        failed++;
        candidates.push({
          number: imageIndex + 1,
          localPath: null,
          sourceUrl: images[imageIndex],
          width: null,
          height: null,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    studios.push({ ...source, candidates });
    console.log(
      `[thumbnail] ${studioIndex + 1}/${selectedSources.length} ${source.studio_name}: ${candidates.filter((candidate) => candidate.localPath).length}장`,
    );
    await new Promise((resolveSleep) => setTimeout(resolveSleep, 120));
  }

  await writeFile(
    MANIFEST_PATH,
    `${JSON.stringify({ generatedAt: new Date().toISOString(), failed, studios }, null, 2)}\n`,
  );
  await end();
  console.log(`[thumbnail] 완료: ${studios.length}곳, 실패 ${failed}장, ${MANIFEST_PATH}`);
}

main().catch(async (error) => {
  console.error(error);
  await end();
  process.exit(1);
});
