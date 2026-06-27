/**
 * 네이버 지도에 "합주실"로 검색되는데 우리 카탈로그(시드)에 없는 합주실을 찾아 리스트업한다.
 *
 * 동작:
 *   1) src/api/db/seeds/002_studios.sql 을 파싱해 현재 카탈로그(이름·주소·네이버 booking id)를 읽는다.
 *   2) 지역별 키워드("{지역} 합주실")로 네이버 지도 장소를 검색한다.
 *   3) 합주실로 보이는 장소만 추린 뒤, 카탈로그와 대조해 "네이버엔 있는데 카탈로그엔 없는" 후보를 출력한다.
 *
 * 매칭(이미 카탈로그에 있다고 보는 조건):
 *   - 네이버 장소에서 뽑은 booking businessId 가 카탈로그 external_key 와 같음(가장 강한 신호), 또는
 *   - 정규화한 이름이 같거나 한쪽이 다른 쪽을 포함, 또는
 *   - 도로명 주소의 건물번지까지 같음
 *
 * 사용:
 *   cd src/scraper
 *   npx tsx scripts/naver-discover-studios.ts            # 사람이 읽는 표 형태
 *   npx tsx scripts/naver-discover-studios.ts --json     # JSON 으로 출력(파이프/저장용)
 *   npx tsx scripts/naver-discover-studios.ts --debug    # 후보 엔드포인트 상태까지 출력
 *   npx tsx scripts/naver-discover-studios.ts --area 강남 # 특정 지역만
 *
 * 주의: 네이버 도메인이 막힌 환경(로컬 일부/CI 정책)에서는 검색이 실패한다.
 *       스크래퍼가 네이버에 닿는 GitHub Actions(discover-studios 워크플로)에서 돌리는 걸 권장.
 */
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { searchPlaces, type NaverPlace } from '../src/naver/search.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const seedPath = resolve(__dirname, '../../api/db/seeds/002_studios.sql');

const ROOM_DELAY_MS = 400; // 지역 간 호출 간격(가벼운 레이트리밋)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 지역별 검색 키워드. 카탈로그 areas 와 맞춘다.
const AREA_QUERIES: Record<string, string[]> = {
  '합정/홍대': ['홍대 합주실', '합정 합주실'],
  신촌: ['신촌 합주실'],
  '사당/이수': ['사당 합주실', '이수 합주실'],
  '신도림/영등포구청': ['신도림 합주실', '영등포 합주실'],
  망원: ['망원 합주실'],
  '상도/중앙대': ['상도 합주실', '중앙대 합주실'],
  서울대입구: ['서울대입구 합주실', '낙성대 합주실'],
  방배: ['방배 합주실'],
  '혜화/성신여대': ['혜화 합주실', '대학로 합주실', '성신여대 합주실'],
  강남: ['강남 합주실', '역삼 합주실', '논현 합주실'],
  '강동/송파': ['송파 합주실', '강동 합주실', '잠실 합주실'],
  '기타 서울': ['노원 합주실', '건대 합주실', '왕십리 합주실'],
};

// 합주실로 보이는지(검색은 카페·학원 등도 섞여 나오므로 가볍게 거른다).
const STUDIO_HINT = /합주|연습실|스튜디오|studio|뮤직|music|사운드|sound|밴드|band/i;

export type CatalogStudio = { name: string; address: string; bookingId: string };

// 이름 정규화: NFKC, 소문자, 공백 제거, 흔한 군더더기·지점 접미 제거.
export function normName(raw: string): string {
  return raw
    .normalize('NFKC')
    .toLowerCase()
    .replace(/합주실|음악연습실|연습실|스튜디오|studio/gi, '')
    .replace(/본점|[0-9]+호점|[가-힣]+점$|지점/g, '')
    .replace(/[\s()[\]{}.,'"`~!@#%^&*\-_/]+/g, '')
    .trim();
}

// 도로명 주소에서 "도로명 + 건물번지"까지만 남겨 비교 키로 쓴다(층/호 차이 무시).
export function addrKey(raw: string): string {
  if (!raw) return '';
  const m = raw
    .normalize('NFKC')
    .replace(/서울특별시|서울시|서울/g, '')
    .match(/([가-힣A-Za-z0-9]+(?:로|길))\s*(\d+(?:-\d+)?)/);
  return m ? `${m[1]}${m[2]}` : '';
}

export function parseCatalog(): CatalogStudio[] {
  const sql = readFileSync(seedPath, 'utf-8');
  const blocks = sql.split(/(?=INSERT INTO studios \(slug, name)/);
  const out: CatalogStudio[] = [];
  for (const b of blocks) {
    const m = b.match(
      /INSERT INTO studios \(slug, name, description, primary_area_id, address, is_active\) VALUES \('[^']*', '((?:[^']|'')*)', (?:'(?:[^']|'')*'|NULL), \d+, '((?:[^']|'')*)'/,
    );
    if (!m) continue;
    const name = m[1].replace(/''/g, "'");
    const address = m[2].replace(/''/g, "'");
    const src = b.match(
      /INSERT INTO studio_sources \(studio_id, source_id, external_key, url\) SELECT id, \d+, '([^']*)'/,
    );
    out.push({ name, address, bookingId: src ? src[1] : '' });
  }
  return out;
}

export type CatalogIndex = {
  bookingIds: Set<string>;
  normNames: Set<string>;
  addrKeys: Set<string>;
  studios: CatalogStudio[];
};

export function indexCatalog(studios: CatalogStudio[]): CatalogIndex {
  const bookingIds = new Set<string>();
  const normNames = new Set<string>();
  const addrKeys = new Set<string>();
  for (const s of studios) {
    if (s.bookingId) bookingIds.add(s.bookingId);
    const n = normName(s.name);
    if (n) normNames.add(n);
    const a = addrKey(s.address);
    if (a) addrKeys.add(a);
  }
  return { bookingIds, normNames, addrKeys, studios };
}

// 네이버 장소가 이미 카탈로그에 있는지 판정 + 매칭 근거.
export function matchReason(place: NaverPlace, idx: CatalogIndex): string | null {
  if (place.bookingBusinessId && idx.bookingIds.has(place.bookingBusinessId)) {
    return `booking id ${place.bookingBusinessId}`;
  }
  const pn = normName(place.name);
  if (pn) {
    if (idx.normNames.has(pn)) return `이름 일치(${place.name})`;
    for (const cn of idx.normNames) {
      // 한쪽이 다른 쪽을 포함(짧은 쪽이 3글자 이상일 때만 — 같은 브랜드의 새 지점을
      // 통째로 "기존"으로 묻지 않도록 과매칭 방지).
      const shorter = Math.min(pn.length, cn.length);
      if (shorter >= 3 && (pn.includes(cn) || cn.includes(pn))) {
        return `이름 부분일치(${place.name})`;
      }
    }
  }
  const pa = addrKey(place.roadAddress || place.address);
  if (pa && idx.addrKeys.has(pa)) return `주소 일치(${pa})`;
  return null;
}

async function main() {
  const argv = process.argv.slice(2);
  const asJson = argv.includes('--json');
  const debug = argv.includes('--debug');
  const areaArg = (() => {
    const i = argv.indexOf('--area');
    return i >= 0 ? argv[i + 1] : undefined;
  })();

  const catalog = parseCatalog();
  const idx = indexCatalog(catalog);
  if (!asJson) {
    console.log(`[discover] 카탈로그 ${catalog.length}곳 로드(네이버 booking id 보유 ${idx.bookingIds.size}곳)`);
  }

  const areas = Object.entries(AREA_QUERIES).filter(([area]) => !areaArg || area.includes(areaArg));
  const newByArea: Record<string, NaverPlace[]> = {};
  const seenGlobal = new Set<string>(); // 지역 간 중복 후보 제거
  let totalPlaces = 0;
  let totalMatched = 0;

  for (const [area, queries] of areas) {
    const found: NaverPlace[] = [];
    for (const q of queries) {
      if (!asJson) console.log(`[discover] ${area} ← "${q}"`);
      try {
        const places = await searchPlaces(q, {
          onDebug: debug ? (m) => console.log(m) : undefined,
        });
        found.push(...places);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        console.warn(`  ✗ "${q}" 검색 실패: ${msg}`);
      }
      await sleep(ROOM_DELAY_MS);
    }

    const news: NaverPlace[] = [];
    for (const place of found) {
      if (!STUDIO_HINT.test(`${place.name} ${place.category}`)) continue;
      totalPlaces += 1;
      const reason = matchReason(place, idx);
      if (reason) {
        totalMatched += 1;
        if (debug && !asJson) console.log(`    = 기존: ${place.name} (${reason})`);
        continue;
      }
      const key = normName(place.name) || place.name;
      if (seenGlobal.has(key)) continue;
      seenGlobal.add(key);
      news.push(place);
    }
    if (news.length) newByArea[area] = news;
  }

  const totalNew = Object.values(newByArea).reduce((n, arr) => n + arr.length, 0);

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          catalogCount: catalog.length,
          scannedPlaces: totalPlaces,
          alreadyInCatalog: totalMatched,
          newCandidateCount: totalNew,
          newByArea,
        },
        null,
        2,
      ),
    );
    return;
  }

  console.log('\n========================================');
  console.log(`네이버 검색 합주실 ${totalPlaces}곳 중 카탈로그 보유 ${totalMatched}곳, 신규 후보 ${totalNew}곳`);
  console.log('========================================');
  if (totalNew === 0) {
    console.log('신규 후보 없음(또는 네이버 검색이 막혀 결과를 못 받음 — --debug 로 확인).');
    return;
  }
  for (const [area, news] of Object.entries(newByArea)) {
    console.log(`\n## ${area} (${news.length})`);
    for (const p of news) {
      const addr = p.roadAddress || p.address || '주소미상';
      const booking = p.bookingBusinessId ? ` [booking ${p.bookingBusinessId}]` : '';
      const cat = p.category ? ` <${p.category}>` : '';
      console.log(`  - ${p.name}${cat} — ${addr}${booking}`);
    }
  }
  console.log('\n* 후보는 카탈로그 미보유라는 뜻이며, 실제 등록 전 네이버 예약 여부/방·요금을 확인할 것.');
}

// 직접 실행할 때만 main 을 돌린다(테스트에서 import 해도 네트워크를 타지 않도록).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.stack ?? error.message : String(error));
    process.exit(1);
  });
}
