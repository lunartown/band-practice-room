/**
 * spacecloud-mapping.json 의 채워진 항목을 읽어 004_spacecloud_sources.sql 시드를 생성한다.
 * (productId/reservationTypeId 가 모두 채워진 방만 배선한다)
 *
 * 사용:
 *   cd src/scraper
 *   npx tsx scripts/apply-spacecloud-mapping.ts            # 시드 생성만
 *   SPACECLOUD_API_TOKEN='<JWT>' npx tsx scripts/apply-spacecloud-mapping.ts --validate
 *                                                          # 생성 + 각 product 라이브 검증
 *
 * --validate 는 네트워크가 열린 환경에서만 동작한다(이 레포 원격 환경은 아웃바운드 차단).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { fetchMonthlyPrices } from '../../scrape-core/spacecloud/client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mappingPath = resolve(__dirname, 'spacecloud-mapping.json');
const seedPath = resolve(__dirname, '../../api/db/seeds/004_spacecloud_sources.sql');

type Room = { name: string; productId?: string; reservationTypeId?: string };
type Studio = { spaceId?: string; url?: string; rooms: Room[] };
type Mapping = { studios: Record<string, Studio> };

const sq = (v: string) => `'${v.replace(/'/g, "''")}'`;
const filled = (r: Room) => Boolean(r.productId && r.reservationTypeId);

const mapping = JSON.parse(readFileSync(mappingPath, 'utf-8')) as Mapping;

const header = `-- 스페이스클라우드 예약 합주실 배선 (source_id=2).
-- ⚠️ 이 파일은 scripts/apply-spacecloud-mapping.ts 로 생성된다. 직접 수정하지 말고
--    spacecloud-mapping.json 을 고친 뒤 스크립트를 다시 실행할 것.
-- room_sources.external_key 형식: 'productId:reservationTypeId'
`;

const sqlBlocks: string[] = [];
let wiredStudios = 0;
let wiredRooms = 0;
const skipped: string[] = [];
const validateTargets: Array<{ slug: string; room: string; productId: string; rtId: string }> = [];

for (const [slug, studio] of Object.entries(mapping.studios)) {
  const rooms = (studio.rooms ?? []).filter(filled);
  const unfilled = (studio.rooms ?? []).filter((r) => !filled(r));
  for (const r of unfilled) skipped.push(`${slug} / ${r.name} (productId/reservationTypeId 비어있음)`);
  if ((studio.rooms ?? []).length === 0) skipped.push(`${slug} (방 없음 — 002 에 room 먼저 추가 필요)`);
  if (rooms.length === 0) continue;

  wiredStudios += 1;
  const extKey = studio.spaceId ? sq(studio.spaceId) : 'NULL';
  const url = studio.url ? sq(studio.url) : 'NULL';

  const lines: string[] = [];
  lines.push(`-- ${slug}`);
  lines.push(`INSERT INTO studio_sources (studio_id, source_id, external_key, url)`);
  lines.push(`SELECT id, 2, ${extKey}, ${url} FROM studios WHERE slug = ${sq(slug)}`);
  lines.push(`ON CONFLICT (studio_id, source_id) DO UPDATE SET`);
  lines.push(`  external_key = EXCLUDED.external_key, url = EXCLUDED.url;`);

  for (const r of rooms) {
    wiredRooms += 1;
    const key = `${r.productId}:${r.reservationTypeId}`;
    validateTargets.push({ slug, room: r.name, productId: r.productId!, rtId: r.reservationTypeId! });
    lines.push(`INSERT INTO room_sources (room_id, source_id, external_key, url)`);
    lines.push(
      `SELECT r.id, 2, ${sq(key)}, ${url} FROM rooms r JOIN studios s ON r.studio_id = s.id`,
    );
    lines.push(`WHERE s.slug = ${sq(slug)} AND r.name = ${sq(r.name)}`);
    lines.push(`ON CONFLICT (room_id, source_id) DO UPDATE SET`);
    lines.push(`  external_key = EXCLUDED.external_key, url = EXCLUDED.url;`);
  }
  sqlBlocks.push(lines.join('\n'));
}

const body =
  sqlBlocks.length > 0
    ? sqlBlocks.join('\n\n')
    : '-- (아직 채워진 매핑이 없음. spacecloud-mapping.json 의 productId/reservationTypeId 를 채운 뒤 재실행)';

writeFileSync(seedPath, `${header}\n${body}\n`, 'utf-8');

console.log(`[apply] 생성: ${seedPath}`);
console.log(`[apply] 배선된 합주실 ${wiredStudios}곳 / 방 ${wiredRooms}개`);
if (skipped.length) {
  console.log(`[apply] 건너뜀 ${skipped.length}건:`);
  for (const s of skipped) console.log(`  - ${s}`);
}

if (process.argv.includes('--validate')) {
  if (validateTargets.length === 0) {
    console.log('[validate] 검증할 항목 없음');
  } else {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    console.log(`[validate] ${year}-${String(month).padStart(2, '0')} 기준 라이브 확인...`);
    for (const t of validateTargets) {
      try {
        const res = await fetchMonthlyPrices({
          productId: t.productId,
          reservationTypeId: t.rtId,
          year,
          month,
        });
        const days = (res.days ?? []).filter((d) => d.times && d.times.length > 0).length;
        console.log(`  ✓ ${t.slug} / ${t.room} (${t.productId}:${t.rtId}) → times 있는 날 ${days}일`);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.error(`  ✗ ${t.slug} / ${t.room} (${t.productId}:${t.rtId}) → ${msg}`);
      }
    }
  }
}
