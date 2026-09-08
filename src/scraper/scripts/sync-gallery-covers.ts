import { mkdir, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

interface Studio {
  id: number;
  name: string;
  images?: string[];
}

interface StudiosResponse {
  studios: Studio[];
}

interface GalleryCover {
  studioId: number;
  studioName: string;
  sourceUrl: string;
  localUrl: string;
  bytes: number;
}

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..');
const OUTPUT_DIR = resolve(REPO, 'src/web/public/studio-gallery');
const MANIFEST_FILE = resolve(REPO, 'src/web/src/generated/galleryCovers.ts');
const DEFAULT_API_URL = 'https://hapjusil-api.onrender.com/api/v1/studios';
const LEGACY_GALLERY_HOST = 'ldb-phinf.pstatic.net';
const CONCURRENCY = 8;

function isLegacyGalleryUrl(url: string): boolean {
  try {
    return new URL(url).hostname === LEGACY_GALLERY_HOST;
  } catch {
    return false;
  }
}

async function buildCover(studio: Studio, sourceUrl: string): Promise<GalleryCover> {
  const response = await fetch(sourceUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HapjusilGalleryCover/1.0)' },
  });
  if (!response.ok) throw new Error(`${studio.name}: 이미지 HTTP ${response.status}`);

  const fileName = `studio-${studio.id}.webp`;
  const outputPath = resolve(OUTPUT_DIR, fileName);
  const input = Buffer.from(await response.arrayBuffer());
  let info;
  try {
    info = await sharp(input, { failOn: 'none' })
      .rotate()
      .resize({ width: 720, height: 720, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 76, effort: 4 })
      .toFile(outputPath);
  } catch (error) {
    throw new Error(`${studio.name}: ${error instanceof Error ? error.message : error}`);
  }

  return {
    studioId: studio.id,
    studioName: studio.name,
    sourceUrl,
    localUrl: `/studio-gallery/${fileName}`,
    bytes: info.size,
  };
}

async function runInBatches<T, R>(
  items: T[],
  worker: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results: PromiseSettledResult<R>[] = [];
  for (let offset = 0; offset < items.length; offset += CONCURRENCY) {
    const batch = items.slice(offset, offset + CONCURRENCY);
    results.push(...await Promise.allSettled(batch.map(worker)));
    console.log(`처리 ${Math.min(offset + CONCURRENCY, items.length)}/${items.length}`);
  }
  return results;
}

function manifestSource(covers: GalleryCover[]): string {
  const entries = covers
    .sort((a, b) => a.studioId - b.studioId)
    .map((cover) => `  ${cover.studioId}: { sourceUrl: ${JSON.stringify(cover.sourceUrl)}, localUrl: ${JSON.stringify(cover.localUrl)} },`)
    .join('\n');

  return `// 이 파일은 src/scraper/scripts/sync-gallery-covers.ts가 생성한다. 직접 편집하지 않는다.\n\ninterface GalleryCover {\n  sourceUrl: string;\n  localUrl: string;\n}\n\nconst GALLERY_COVERS: Record<number, GalleryCover> = {\n${entries}\n};\n\nexport function localGalleryCoverUrl(studioId: number, sourceUrl: string): string | null {\n  const cover = GALLERY_COVERS[studioId];\n  return cover?.sourceUrl === sourceUrl ? cover.localUrl : null;\n}\n`;
}

async function main() {
  const apiUrl = process.argv[2] || DEFAULT_API_URL;
  const response = await fetch(apiUrl);
  if (!response.ok) throw new Error(`합주실 API HTTP ${response.status}`);
  const { studios } = await response.json() as StudiosResponse;
  const targets = studios.flatMap((studio) => {
    const sourceUrl = studio.images?.[0];
    return sourceUrl && isLegacyGalleryUrl(sourceUrl) ? [{ studio, sourceUrl }] : [];
  });

  await mkdir(OUTPUT_DIR, { recursive: true });
  await mkdir(dirname(MANIFEST_FILE), { recursive: true });
  const existing = await readdir(OUTPUT_DIR);
  await Promise.all(existing.filter((name) => name.endsWith('.webp')).map((name) => rm(resolve(OUTPUT_DIR, name))));

  const results = await runInBatches(targets, ({ studio, sourceUrl }) => buildCover(studio, sourceUrl));
  const covers = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
  const failures = results.flatMap((result) => result.status === 'rejected' ? [String(result.reason)] : []);
  await writeFile(MANIFEST_FILE, manifestSource(covers));

  const totalBytes = covers.reduce((sum, cover) => sum + cover.bytes, 0);
  console.log(`완료: ${covers.length}/${targets.length}장, ${Math.round(totalBytes / 1024 / 1024 * 10) / 10}MB`);
  failures.forEach((failure) => console.warn(`실패: ${failure}`));
  if (failures.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
