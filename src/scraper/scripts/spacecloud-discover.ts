/**
 * 스페이스클라우드 space id 만으로 그 합주실의 product / reservation_type 를 자동 수집한다.
 * (손으로 productId 를 찾아 넣을 필요 없이, 토큰만 있으면 한 번에 채워준다)
 *
 * 사용:
 *   cd src/scraper
 *   # mapping JSON 의 spaceId 가 있는 모든 합주실을 한 번에 탐색 + 자동기입:
 *   SPACECLOUD_API_TOKEN='<JWT>' npx tsx scripts/spacecloud-discover.ts --write
 *
 *   # 특정 space 하나만 (mapping 에 없거나 새 space id 확인용):
 *   SPACECLOUD_API_TOKEN='<JWT>' npx tsx scripts/spacecloud-discover.ts --space 3452
 *
 * --write 없이 돌리면 화면 출력만 한다.
 * 자동 탐색이 실패하면(엔드포인트가 다르면) 각 후보 URL 의 HTTP 상태를 찍어주니,
 * 브라우저 네트워크 탭에서 상품목록을 부르는 실제 요청 URL 을 알려주면 거기에 맞춘다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spacecloudGet } from '../../scrape-core/spacecloud/api.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const mappingPath = resolve(__dirname, 'spacecloud-mapping.json');

type DiscoveredRT = { id: string; name: string };
type DiscoveredProduct = { productId: string; name: string; reservationTypes: DiscoveredRT[] };

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}

// space id 로 시도해볼 후보 엔드포인트들(앞에서부터 200 나오는 것 사용).
function candidates(spaceId: string): string[] {
  return [
    `/spaces/${spaceId}`,
    `/space/${spaceId}`,
    `/spaces/${spaceId}/products`,
    `/spaces/${spaceId}/reservation_products`,
    `/products?space_id=${spaceId}`,
  ];
}

const str = (v: unknown): string => (v == null ? '' : String(v));

// 스키마를 모르더라도, reservation_types(또는 reservationTypes) 배열을 가진 객체를
// product 로 보고 재귀적으로 긁는다.
function scanProducts(node: unknown, out: DiscoveredProduct[]): void {
  if (Array.isArray(node)) {
    for (const v of node) scanProducts(v, out);
    return;
  }
  if (node && typeof node === 'object') {
    const obj = node as Record<string, unknown>;
    const rts = (obj.reservation_types ?? obj.reservationTypes) as unknown;
    const pid = obj.id ?? obj.product_id ?? obj.productId;
    if (Array.isArray(rts) && pid != null) {
      out.push({
        productId: str(pid),
        name: str(obj.name ?? obj.title ?? obj.product_name),
        reservationTypes: rts
          .map((rt) => {
            const r = (rt ?? {}) as Record<string, unknown>;
            return { id: str(r.id ?? r.reservation_type_id), name: str(r.name ?? r.title) };
          })
          .filter((rt) => rt.id),
      });
    }
    for (const v of Object.values(obj)) scanProducts(v, out);
  }
}

// 시간제(hourly) 예약유형을 우선 고른다(가격 API 가 시간제 기준).
function pickReservationType(rts: DiscoveredRT[]): DiscoveredRT | undefined {
  return (
    rts.find((rt) => /시간|hour|hourly|대관/i.test(rt.name)) ?? rts[0]
  );
}

async function discoverSpace(spaceId: string): Promise<DiscoveredProduct[] | null> {
  for (const path of candidates(spaceId)) {
    try {
      const data = await spacecloudGet<unknown>(path);
      const products: DiscoveredProduct[] = [];
      scanProducts(data, products);
      // 중복 productId 제거
      const seen = new Set<string>();
      const uniq = products.filter((p) => (seen.has(p.productId) ? false : seen.add(p.productId)));
      if (uniq.length > 0) {
        console.log(`  ✓ ${path} → product ${uniq.length}개 발견`);
        return uniq;
      }
      console.log(`  · ${path} → 200 이지만 product 패턴 없음`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.log(`  · ${path} → ${msg}`);
    }
  }
  return null;
}

function printProducts(products: DiscoveredProduct[]): void {
  for (const p of products) {
    const chosen = pickReservationType(p.reservationTypes);
    const others = p.reservationTypes.filter((rt) => rt.id !== chosen?.id);
    console.log(
      `    - "${p.name}" product=${p.productId} reservationType=${chosen?.id ?? '?'}` +
        (chosen?.name ? `(${chosen.name})` : '') +
        (others.length ? ` [다른유형: ${others.map((o) => `${o.id}${o.name ? `:${o.name}` : ''}`).join(', ')}]` : ''),
    );
  }
}

// ── 실행 ───────────────────────────────────────────────────────────────
const single = arg('--space');
const singleProduct = arg('--product');
const doWrite = process.argv.includes('--write');

if (!process.env.SPACECLOUD_API_TOKEN) {
  console.warn('[discover] 경고: SPACECLOUD_API_TOKEN 미설정 — 인증이 필요하면 실패한다.');
}

// 알려진 productId 로 스키마/스캐너를 검증(예: --product 116331). /products/{id} 는 유효한 엔드포인트.
if (singleProduct) {
  console.log(`[discover] product ${singleProduct} (/products/${singleProduct})`);
  try {
    const data = await spacecloudGet<unknown>(`/products/${singleProduct}`);
    const out: DiscoveredProduct[] = [];
    scanProducts(data, out);
    if (out.length) printProducts(out);
    else {
      console.log('  · 200 이지만 reservation_types 패턴을 못 찾음. 응답 최상위 키:');
      console.log('   ', Object.keys((data ?? {}) as object).join(', '));
    }
  } catch (error) {
    console.log(`  ✗ ${error instanceof Error ? error.message : String(error)}`);
  }
  process.exit(0);
}

if (single) {
  console.log(`[discover] space ${single}`);
  const products = await discoverSpace(single);
  if (products) printProducts(products);
  else console.log('  ✗ 어떤 후보 엔드포인트로도 product 를 못 찾음(위 상태 참고).');
  process.exit(0);
}

// mapping 의 spaceId 있는 합주실 일괄 탐색
type Room = { name: string; productId?: string; reservationTypeId?: string };
type Studio = { spaceId?: string; url?: string; rooms: Room[] };
type Mapping = { studios: Record<string, Studio> };

const mapping = JSON.parse(readFileSync(mappingPath, 'utf-8')) as Mapping;
let filledStudios = 0;
let filledRooms = 0;

for (const [slug, studio] of Object.entries(mapping.studios)) {
  if (!studio.spaceId) {
    console.log(`[discover] ${slug} → spaceId 없음(스킵). 합주실 스페이스클라우드 페이지 URL의 /space/{id} 확인 필요`);
    continue;
  }
  console.log(`[discover] ${slug} (space ${studio.spaceId})`);
  const products = await discoverSpace(studio.spaceId);
  if (!products) {
    console.log('  ✗ product 못 찾음');
    continue;
  }
  printProducts(products);

  if (doWrite) {
    studio.rooms = products.map((p) => {
      const rt = pickReservationType(p.reservationTypes);
      return { name: p.name || `product-${p.productId}`, productId: p.productId, reservationTypeId: rt?.id ?? '' };
    });
    filledStudios += 1;
    filledRooms += studio.rooms.length;
  }
}

if (doWrite) {
  writeFileSync(mappingPath, `${JSON.stringify(mapping, null, 2)}\n`, 'utf-8');
  console.log(`\n[discover] mapping 기입 완료: 합주실 ${filledStudios}곳 / 방 ${filledRooms}개`);
  console.log('[discover] 다음: npx tsx scripts/apply-spacecloud-mapping.ts --validate 로 시드 생성/검증');
} else {
  console.log('\n[discover] (미리보기) --write 를 붙이면 mapping JSON 에 자동 기입한다.');
}
