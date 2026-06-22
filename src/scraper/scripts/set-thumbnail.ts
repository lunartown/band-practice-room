/**
 * 합주실 썸네일을 "혼자서" 한 방에 추가/교체하는 도구.
 *
 * 하는 일(순서대로):
 *   1) 이미지(로컬 파일 또는 URL)를 정사각으로 중앙 크롭 + 리사이즈 + webp 압축
 *   2) src/web/public/studios/<name>.webp 로 저장 (Vercel 정적 서빙)
 *   3) 시드 003_studio_visuals.sql 의 "관리 블록"에 UPDATE 한 줄을 upsert (재시드 영속)
 *   4) DATABASE_URL 이 있으면 DB 에도 즉시 반영 (없으면 다음 재시드 때 적용)
 *
 * 사용:
 *   cd src/scraper
 *   npm run thumbnail -- --slug '<studio slug>' --image <파일|URL> [--name <영문파일명>] [--size 256]
 *
 * 예:
 *   npm run thumbnail -- --slug 'studio-강동/송파-브라더-강동' \
 *     --image ~/Downloads/brother.jpg --name brother-gangdong
 *
 * slug 는 002_studios.sql 의 studios.slug 값. (헷갈리면: 이름 일부로 grep)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { query, end } from '../src/db.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '../../..'); // src/scraper/scripts → repo root
const STUDIOS_DIR = resolve(REPO, 'src/web/public/studios');
const SEED_FILE = resolve(REPO, 'src/api/db/seeds/003_studio_visuals.sql');

const BEGIN = '-- === BEGIN managed thumbnails (set-thumbnail) ===';
const END = '-- === END managed thumbnails ===';

function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) out[a.slice(2)] = argv[++i] ?? '';
  }
  return out;
}

/** slug → 기본 파일명(영문 없으면 slug 의 '/' 만 '-' 로 치환). */
function defaultName(slug: string): string {
  return slug.replaceAll('/', '-');
}

async function loadImage(src: string): Promise<Buffer> {
  if (/^https?:\/\//.test(src)) {
    const res = await fetch(src);
    if (!res.ok) throw new Error(`이미지 다운로드 실패: HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
  }
  return readFile(resolve(process.cwd(), src));
}

/** 시드의 관리 블록에서 slug→경로 맵을 읽고, upsert 후 블록을 다시 쓴다. */
function upsertSeed(content: string, slug: string, webPath: string): string {
  const entries = new Map<string, string>();
  const bi = content.indexOf(BEGIN);
  const ei = content.indexOf(END);
  let head = content;
  let tail = '';

  if (bi !== -1 && ei !== -1) {
    head = content.slice(0, bi).replace(/\s+$/, '');
    tail = content.slice(ei + END.length).replace(/^\s+/, '');
    const block = content.slice(bi, ei);
    const lineRe = /image_url_manual = '(.+?)' WHERE slug = '(.+?)';/g;
    let m: RegExpExecArray | null;
    while ((m = lineRe.exec(block))) entries.set(m[2], m[1]);
  } else {
    head = content.replace(/\s+$/, '');
  }

  entries.set(slug, webPath);

  const lines = [...entries.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([s, p]) => `UPDATE studios SET image_url_manual = '${p}' WHERE slug = '${s}';`);

  const block = [
    BEGIN,
    '-- 이 블록은 `npm run thumbnail` 가 자동 관리한다. 직접 편집하지 말 것.',
    ...lines,
    END,
  ].join('\n');

  return `${head}\n\n${block}\n${tail ? `\n${tail}\n` : ''}`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const slug = args.slug?.trim();
  const image = args.image?.trim();
  if (!slug || !image) {
    console.error(
      "사용법: npm run thumbnail -- --slug '<studio slug>' --image <파일|URL> [--name <영문파일명>] [--size 256]",
    );
    process.exit(1);
  }
  const size = Number(args.size) || 256;
  const name = (args.name?.trim() || defaultName(slug)).replace(/\.(webp|jpe?g|png)$/i, '');
  const fileName = `${name}.webp`;
  const webPath = `/studios/${fileName}`;

  // 1) + 2) 리사이즈 후 저장
  const input = await loadImage(image);
  await mkdir(STUDIOS_DIR, { recursive: true });
  const info = await sharp(input)
    .resize(size, size, { fit: 'cover', position: 'attention' })
    .webp({ quality: 80 })
    .toFile(resolve(STUDIOS_DIR, fileName));
  console.log(`[1/3] 이미지 저장: src/web/public/studios/${fileName} (${size}², ${Math.round(info.size / 1024)}KB)`);

  // 3) 시드 영속화
  const seed = await readFile(SEED_FILE, 'utf8');
  await writeFile(SEED_FILE, upsertSeed(seed, slug, webPath));
  console.log(`[2/3] 시드 갱신: 003_studio_visuals.sql → ${slug}`);

  // 4) DB 즉시 반영(있을 때만)
  if (process.env.DATABASE_URL) {
    const res = await query(`UPDATE studios SET image_url_manual = $2 WHERE slug = $1`, [
      slug,
      webPath,
    ]);
    await end();
    if (res.rowCount === 0) {
      console.warn(`[3/3] ⚠️  DB 에 slug='${slug}' 인 합주실이 없음. slug 를 확인하세요(시드는 갱신됨).`);
    } else {
      console.log(`[3/3] DB 즉시 반영 완료.`);
    }
  } else {
    console.log('[3/3] DATABASE_URL 없음 → DB 즉시반영 생략. 재시드(npm run db:seed) 때 적용됨.');
  }

  console.log('\n완료. 변경된 이미지·시드를 커밋하세요.');
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
