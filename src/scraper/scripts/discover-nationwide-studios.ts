/**
 * 네이버 통합검색의 지역 플레이스 결과를 이용해 전국 합주실 후보를 찾는다.
 *
 * 공개 검색 결과만 읽으며, 운영 DB는 변경하지 않는다. 결과는 사람이 검토할 수
 * 있도록 `_local/nationwide-studio-discovery.json`에 저장한다.
 *
 * 실행:
 *   cd src/scraper
 *   npx tsx scripts/discover-nationwide-studios.ts
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type Place = {
  id: string;
  normalizedName?: string;
  name?: string;
  category?: string;
  fullAddress?: string;
  commonAddress?: string;
  bookingUrl?: string | null;
  bookingBusinessId?: string | null;
  hasBooking?: boolean;
  imageUrl?: string | null;
  menus?: string[] | null;
  visitorReviewCount?: string | null;
  blogCafeReviewCount?: string | null;
  x?: string;
  y?: string;
};

type Candidate = {
  placeId: string;
  name: string;
  address: string;
  commonAddress: string;
  category: string;
  bookingUrl: string | null;
  bookingBusinessId: string | null;
  hasBooking: boolean;
  imageUrl: string | null;
  menus: string[];
  visitorReviewCount: number;
  blogCafeReviewCount: number;
  longitude: number | null;
  latitude: number | null;
  matchedQueries: string[];
};

const REPO_ROOT = resolve(import.meta.dirname, '../../..');
const OUTPUT_PATH = resolve(REPO_ROOT, '_local/nationwide-studio-discovery.json');
const SEARCH_DELAY_MS = 800;

// 광역시·특별시의 구와 전국 시·군을 포함한다. 큰 도시에서는 구 단위 검색으로
// 네이버 검색의 결과 개수 제한에 가려지는 업체를 줄인다.
const AREAS = [
  // 서울
  '서울 종로구', '서울 중구', '서울 용산구', '서울 성동구', '서울 광진구',
  '서울 동대문구', '서울 중랑구', '서울 성북구', '서울 강북구', '서울 도봉구',
  '서울 노원구', '서울 은평구', '서울 서대문구', '서울 마포구', '서울 양천구',
  '서울 강서구', '서울 구로구', '서울 금천구', '서울 영등포구', '서울 동작구',
  '서울 관악구', '서울 서초구', '서울 강남구', '서울 송파구', '서울 강동구',
  // 부산·대구·인천·광주·대전·울산·세종
  '부산 강서구', '부산 금정구', '부산 기장군', '부산 남구', '부산 동구',
  '부산 동래구', '부산 부산진구', '부산 북구', '부산 사상구', '부산 사하구',
  '부산 서구', '부산 수영구', '부산 연제구', '부산 영도구', '부산 중구', '부산 해운대구',
  '대구 군위군', '대구 남구', '대구 달서구', '대구 달성군', '대구 동구',
  '대구 북구', '대구 서구', '대구 수성구', '대구 중구',
  '인천 강화군', '인천 계양구', '인천 남동구', '인천 미추홀구', '인천 부평구',
  '인천 연수구', '인천 옹진군', '인천 제물포구', '인천 영종구', '인천 서해구', '인천 검단구',
  '광주 광산구', '광주 남구', '광주 동구', '광주 북구', '광주 서구',
  '대전 대덕구', '대전 동구', '대전 서구', '대전 유성구', '대전 중구',
  '울산 남구', '울산 동구', '울산 북구', '울산 울주군', '울산 중구', '세종시',
  // 경기
  '경기 가평군', '경기 고양시', '경기 과천시', '경기 광명시', '경기 광주시',
  '경기 구리시', '경기 군포시', '경기 김포시', '경기 남양주시', '경기 동두천시',
  '경기 부천시', '경기 성남시', '경기 수원시', '경기 시흥시', '경기 안산시',
  '경기 안성시', '경기 안양시', '경기 양주시', '경기 양평군', '경기 여주시',
  '경기 연천군', '경기 오산시', '경기 용인시', '경기 의왕시', '경기 의정부시',
  '경기 이천시', '경기 파주시', '경기 평택시', '경기 포천시', '경기 하남시', '경기 화성시',
  // 강원
  '강원 강릉시', '강원 고성군', '강원 동해시', '강원 삼척시', '강원 속초시',
  '강원 양구군', '강원 양양군', '강원 영월군', '강원 원주시', '강원 인제군',
  '강원 정선군', '강원 철원군', '강원 춘천시', '강원 태백시', '강원 평창군',
  '강원 홍천군', '강원 화천군', '강원 횡성군',
  // 충청
  '충북 괴산군', '충북 단양군', '충북 보은군', '충북 영동군', '충북 옥천군',
  '충북 음성군', '충북 제천시', '충북 증평군', '충북 진천군', '충북 청주시', '충북 충주시',
  '충남 계룡시', '충남 공주시', '충남 금산군', '충남 논산시', '충남 당진시',
  '충남 보령시', '충남 부여군', '충남 서산시', '충남 서천군', '충남 아산시',
  '충남 예산군', '충남 천안시', '충남 청양군', '충남 태안군', '충남 홍성군',
  // 전라
  '전북 고창군', '전북 군산시', '전북 김제시', '전북 남원시', '전북 무주군',
  '전북 부안군', '전북 순창군', '전북 완주군', '전북 익산시', '전북 임실군',
  '전북 장수군', '전북 전주시', '전북 정읍시', '전북 진안군',
  '전남 강진군', '전남 고흥군', '전남 곡성군', '전남 광양시', '전남 구례군',
  '전남 나주시', '전남 담양군', '전남 목포시', '전남 무안군', '전남 보성군',
  '전남 순천시', '전남 신안군', '전남 여수시', '전남 영광군', '전남 영암군',
  '전남 완도군', '전남 장성군', '전남 장흥군', '전남 진도군', '전남 함평군',
  '전남 해남군', '전남 화순군',
  // 경상
  '경북 경산시', '경북 경주시', '경북 고령군', '경북 구미시', '경북 김천시',
  '경북 문경시', '경북 봉화군', '경북 상주시', '경북 성주군', '경북 안동시',
  '경북 영덕군', '경북 영양군', '경북 영주시', '경북 영천시', '경북 예천군',
  '경북 울릉군', '경북 울진군', '경북 의성군', '경북 청도군', '경북 청송군',
  '경북 칠곡군', '경북 포항시',
  '경남 거제시', '경남 거창군', '경남 고성군', '경남 김해시', '경남 남해군',
  '경남 밀양시', '경남 사천시', '경남 산청군', '경남 양산시', '경남 의령군',
  '경남 진주시', '경남 창녕군', '경남 창원시', '경남 통영시', '경남 하동군',
  '경남 함안군', '경남 함양군', '경남 합천군',
  // 제주
  '제주 제주시', '제주 서귀포시',
];

const TERMS = ['합주실', '밴드 연습실'];

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function cleanName(value: string | undefined): string {
  return (value ?? '').replace(/<\/?mark>/g, '').trim();
}

function toNumber(value: string | null | undefined): number {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseApolloState(html: string): Record<string, unknown> {
  const marker = 'naver.search.ext.loc.salt.__APOLLO_STATE__ = ';
  const start = html.indexOf(marker);
  if (start < 0) return {};
  const jsonStart = start + marker.length;
  // 이 대입문 뒤 같은 <script> 안에 다른 코드가 계속되므로 </script>를
  // 종점으로 삼을 수 없다. JSON 대입을 끝내는 첫 `;\n`까지만 자른다.
  const end = html.indexOf(';\n', jsonStart);
  if (end < 0) return {};
  return JSON.parse(html.slice(jsonStart, end)) as Record<string, unknown>;
}

function placesFromState(state: Record<string, unknown>): Place[] {
  return Object.entries(state)
    .filter(([key]) => key.startsWith('PlaceListBusinessesItem:'))
    .map(([, value]) => value as Place);
}

function looksRelevant(place: Place): boolean {
  const text = [cleanName(place.normalizedName ?? place.name), ...(place.menus ?? [])].join(' ');
  return /합주|밴드|rehearsal/i.test(text);
}

async function fetchPlaces(query: string): Promise<Place[]> {
  const url = `https://search.naver.com/search.naver?query=${encodeURIComponent(query)}`;
  const response = await fetch(url, {
    headers: {
      'accept-language': 'ko-KR,ko;q=0.9',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/140 Safari/537.36',
    },
  });
  if (!response.ok) throw new Error(`네이버 검색 실패(${response.status}): ${query}`);
  return placesFromState(parseApolloState(await response.text()));
}

async function loadExisting(): Promise<Map<string, Candidate>> {
  try {
    const parsed = JSON.parse(await readFile(OUTPUT_PATH, 'utf8')) as { candidates?: Candidate[] };
    return new Map((parsed.candidates ?? []).map((candidate) => [candidate.placeId, candidate]));
  } catch {
    return new Map();
  }
}

async function main(): Promise<void> {
  await mkdir(resolve(REPO_ROOT, '_local'), { recursive: true });
  const candidates = await loadExisting();
  const limitArgIndex = process.argv.indexOf('--limit');
  const requestedLimit = limitArgIndex >= 0 ? Number(process.argv[limitArgIndex + 1]) : Number.POSITIVE_INFINITY;
  const queries = AREAS
    .flatMap((area) => TERMS.map((term) => `${area} ${term}`))
    .slice(0, Number.isFinite(requestedLimit) ? Math.max(0, requestedLimit) : undefined);
  let searched = 0;
  let failed = 0;

  for (const query of queries) {
    try {
      const places = await fetchPlaces(query);
      for (const place of places.filter(looksRelevant)) {
        const placeId = String(place.id);
        const current = candidates.get(placeId);
        candidates.set(placeId, {
          placeId,
          name: cleanName(place.normalizedName ?? place.name),
          address: place.fullAddress ?? '',
          commonAddress: place.commonAddress ?? '',
          category: place.category ?? '',
          bookingUrl: place.bookingUrl ?? null,
          bookingBusinessId: place.bookingBusinessId ?? null,
          hasBooking: place.hasBooking === true,
          imageUrl: place.imageUrl ?? null,
          menus: place.menus ?? [],
          visitorReviewCount: toNumber(place.visitorReviewCount),
          blogCafeReviewCount: toNumber(place.blogCafeReviewCount),
          longitude: place.x ? Number(place.x) : null,
          latitude: place.y ? Number(place.y) : null,
          matchedQueries: [...new Set([...(current?.matchedQueries ?? []), query])],
        });
      }
    } catch (error) {
      failed++;
      console.warn(`[discover] ${query}: ${error instanceof Error ? error.message : error}`);
    }
    searched++;
    if (searched % 20 === 0 || searched === queries.length) {
      console.log(`[discover] ${searched}/${queries.length} 검색, 후보 ${candidates.size}곳, 실패 ${failed}`);
      await writeFile(
        OUTPUT_PATH,
        `${JSON.stringify({ generatedAt: new Date().toISOString(), searched, failed, candidates: [...candidates.values()] }, null, 2)}\n`,
      );
    }
    await sleep(SEARCH_DELAY_MS);
  }

  console.log(`[discover] 완료: ${OUTPUT_PATH} / 후보 ${candidates.size}곳`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
