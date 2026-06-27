// 네이버 지도 장소 검색 래퍼.
// 예약 GraphQL(api.ts)과 별개로, "합주실 {지역}" 키워드로 지도에 등재된
// 장소(plADE) 목록을 받아온다. 스키마가 자주 바뀌므로 여러 후보 엔드포인트를
// 시도하고(spacecloud-discover 와 동일한 전략), 응답을 재귀로 스캔해
// name + 주소를 가진 객체를 장소로 간주한다.
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const DEFAULT_TIMEOUT_MS = 20_000;

export class NaverSearchError extends Error {}

export type NaverPlace = {
  /** 네이버 플레이스 id (지도 상세 URL 의 식별자). */
  placeId: string;
  name: string;
  /** 도로명 주소(있으면 우선). */
  roadAddress: string;
  /** 지번/공통 주소(폴백). */
  address: string;
  /** 카테고리 문자열(예: "합주실", "음악연습실"). */
  category: string;
  /** 응답 어딘가에 booking.naver.com/booking/{type}/bizes/{id} 가 있으면 그 id. 카탈로그 매칭의 강한 신호. */
  bookingBusinessId: string;
};

const str = (v: unknown): string => (v == null ? '' : String(v));

// 후보 엔드포인트(앞에서부터 JSON·장소가 나오는 것을 사용).
function candidates(query: string, page: number): string[] {
  const q = encodeURIComponent(query);
  return [
    `https://map.naver.com/p/api/search/allSearch?query=${q}&type=all&searchCoord=&boundary=&page=${page}`,
    `https://map.naver.com/p/api/search/instant-search?query=${q}&coords=&types=place`,
    `https://map.naver.com/v5/api/search?caller=pcweb&query=${q}&type=all&page=${page}&displayCount=50`,
  ];
}

async function getJson(url: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<unknown> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        Accept: 'application/json',
        'User-Agent': MOBILE_USER_AGENT,
        Referer: 'https://map.naver.com/',
      },
      signal: controller.signal,
    });
    if (!res.ok) throw new NaverSearchError(`HTTP ${res.status}`);
    const text = await res.text();
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new NaverSearchError('JSON 아님(HTML 응답일 수 있음)');
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NaverSearchError('timeout');
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

// 응답 어딘가에서 booking.naver.com/booking/{type}/bizes/{id} 패턴의 id 를 찾는다.
const BOOKING_RE = /booking\.naver\.com\/booking\/\d+\/bizes\/(\d+)/;
function findBookingBusinessId(obj: Record<string, unknown>): string {
  // 흔한 위치 먼저
  const direct =
    obj.bookingBusinessId ??
    obj.bookingId ??
    (obj.booking as Record<string, unknown> | undefined)?.businessId;
  if (direct != null && str(direct)) return str(direct);
  // 문자열 필드 전체에서 URL 패턴 탐색
  for (const v of Object.values(obj)) {
    if (typeof v === 'string') {
      const m = v.match(BOOKING_RE);
      if (m) return m[1];
    }
  }
  return '';
}

// name + (roadAddress|address) 를 가진 객체를 장소로 보고 재귀 수집한다.
function scanPlaces(node: unknown, out: NaverPlace[], seen: Set<string>): void {
  if (Array.isArray(node)) {
    for (const v of node) scanPlaces(v, out, seen);
    return;
  }
  if (!node || typeof node !== 'object') return;
  const obj = node as Record<string, unknown>;

  const name = str(obj.name ?? obj.title);
  const roadAddress = str(obj.roadAddress ?? obj.roadaddress ?? obj.road_address);
  const address = str(obj.address ?? obj.commonAddress ?? obj.jibunAddress ?? obj.abbrAddress);

  if (name && (roadAddress || address)) {
    const placeId = str(obj.id ?? obj.placeId ?? obj.sid ?? obj.searchId);
    const categoryRaw = obj.category ?? obj.categoryName ?? obj.bizCategory;
    const category = Array.isArray(categoryRaw)
      ? categoryRaw.map((c) => str(c)).filter(Boolean).join('/')
      : str(categoryRaw);
    const key = `${name}|${roadAddress || address}`;
    if (!seen.has(key)) {
      seen.add(key);
      out.push({
        placeId,
        name,
        roadAddress,
        address,
        category,
        bookingBusinessId: findBookingBusinessId(obj),
      });
    }
  }

  for (const v of Object.values(obj)) scanPlaces(v, out, seen);
}

/**
 * 한 키워드(예: "홍대 합주실")로 지도 장소를 검색한다.
 * 여러 후보 엔드포인트를 순서대로 시도하고, 첫 성공 응답을 재귀 스캔해 장소 목록을 만든다.
 * onDebug 로 각 후보 URL 의 상태를 흘려보낼 수 있다(엔드포인트가 막히면 어디서 막혔는지 확인용).
 */
export async function searchPlaces(
  query: string,
  opts: { page?: number; onDebug?: (msg: string) => void } = {},
): Promise<NaverPlace[]> {
  const page = opts.page ?? 1;
  const errors: string[] = [];
  for (const url of candidates(query, page)) {
    try {
      const data = await getJson(url);
      const places: NaverPlace[] = [];
      scanPlaces(data, places, new Set());
      if (places.length > 0) {
        opts.onDebug?.(`  ✓ ${url} → 장소 ${places.length}개`);
        return places;
      }
      opts.onDebug?.(`  · ${url} → 200 이지만 장소 패턴 없음`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`${url} → ${msg}`);
      opts.onDebug?.(`  · ${url} → ${msg}`);
    }
  }
  if (errors.length === candidates(query, page).length) {
    throw new NaverSearchError(`모든 후보 엔드포인트 실패:\n  ${errors.join('\n  ')}`);
  }
  return [];
}
