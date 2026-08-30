/**
 * 검증된 네이버 검색 결과에서 합주 예약 상품만 골라 카탈로그 반영안을 만든다.
 * 기본 실행은 검토용 JSON만 만들며, `--apply`를 붙여야 studio-catalog.json을 갱신한다.
 *
 * 실행:
 *   cd src/scraper
 *   npx tsx scripts/build-nationwide-catalog.ts
 *   npx tsx scripts/build-nationwide-catalog.ts --apply
 */
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

type VerifiedItem = {
  bizItemId: string;
  name: string;
  bookingTimeUnitCode: string;
  scheduleUnits: number;
  saleUnits: number;
  minPrice: number | null;
  durationMinutes: number | null;
};

type VerifiedCandidate = {
  placeId: string;
  name: string;
  address: string;
  commonAddress: string;
  category: string;
  bookingUrl: string | null;
  bookingBusinessId: string | null;
  imageUrl: string | null;
  menus: string[];
  items: VerifiedItem[];
  error: string | null;
};

type CatalogRoom = Record<string, unknown> & {
  name: string;
  naverBizItemId?: string;
};

type CatalogStudio = Record<string, unknown> & {
  id: string;
  name: string;
  region: string;
  address: string;
  description?: string;
  roomDetails: CatalogRoom[];
  naverUrl?: string;
  isActive?: boolean;
};

type Catalog = {
  ok: boolean;
  count: number;
  regions: string[];
  areas: string[];
  studios: CatalogStudio[];
};

type Selection = VerifiedCandidate & {
  selectedItems: VerifiedItem[];
  rejectedItems: Array<VerifiedItem & { reason: string }>;
  existingStudioId: string | null;
  region: string;
};

const REPO_ROOT = resolve(import.meta.dirname, '../../..');
const VERIFIED_PATH = resolve(REPO_ROOT, '_local/nationwide-studio-verified.json');
const CATALOG_PATH = resolve(REPO_ROOT, '_local/studio-catalog.json');
const REVIEW_PATH = resolve(REPO_ROOT, '_local/nationwide-studio-selection.json');

const NATIONWIDE_REGIONS = [
  '경기',
  '인천',
  '부산',
  '대구',
  '광주·전남',
  '대전',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '경북',
  '경남',
  '제주',
];

const HARD_REJECT_PATTERN =
  /개인|1인|일인|레슨|상담|정액|회원|멤버\s*혜택|월계약|월임대|촬영|레코딩|녹음|믹싱|마스터링|초과|추가\s*인원|음료|주차|수강생|체험|정기권|관리자|당일\s*잔여|당일\s*예약.*문의|원데이|클래스|^\W*AM\s/i;
const ANCILLARY_PATTERN =
  /악기|기타|베이스|일렉|신디사이저|건반|색소폰|클래식|드럼|스틱|보컬|피아노/i;
const BAND_PATTERN = /합주|밴드|rehearsal/i;
const ROOM_PATTERN = /room|룸|방|studio|스튜디오|stage|스테이지|hall|홀|연습실|대관|예약/i;
const PROMO_PATTERN = /조조|심야|새벽|평일\s*낮|특가|할인|프로모션|학생|청소년|이벤트/i;
const PROMO_REPLACE_PATTERN = /조조|심야|새벽|평일\s*낮|특가|할인|프로모션|학생|청소년|이벤트/gi;

// 메뉴 설명만으로 상품과 합주 용도를 연결할 수 있는 예외는 상품 ID를 명시해 검토 가능하게 둔다.
const MANUAL_ITEM_OVERRIDES: Record<string, string[]> = {
  '687024': ['7315489'], // 노아스아크 워십룸/홀: 메뉴에 공연·합주 대관으로 표기
  '1133178': ['5839189'], // R&R studio: 단일 대관 상품, 메뉴에 합주실 대여로 표기
  '1511002': ['7163584'], // 바킹사운드: 일반 시간제 상품
  '1062791': ['5592935', '5606830', '5606836'], // 호랑이 합주실: 숫자로 구분한 세 개 룸
};

const MANUAL_STUDIO_OVERRIDES: Record<string, string> = {
  '1374245': 'studio-사당/이수-톤', // 같은 예약 사업장이 중복 등록되어 기존 활성 스튜디오를 유지
};

function naverBusinessId(url: string | undefined | null): string | null {
  return url?.match(/\/bizes\/(\d+)/)?.[1] ?? null;
}

function hasBandSignal(value: string): boolean {
  return BAND_PATTERN.test(value);
}

function itemKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/(.+)[\[({][^\])}]*[\])}]/g, '$1 ')
    .replace(PROMO_REPLACE_PATTERN, ' ')
    .replace(/합주실?|밴드|rehearsal|예약|대관|렌탈|렌트|대여|시간제|페이결제|현장결제/gi, ' ')
    .replace(/\b\d+\s*시간\b/g, ' ')
    .replace(/[^0-9a-z가-힣]+/g, '') || 'default';
}

function roomToken(name: string): string | null {
  const match = name.toLowerCase().match(/(?:^|\s|\[)([a-z]|\d+)\s*(?:room|룸|번방)/i);
  return match?.[1] ?? null;
}

function selectItems(candidate: VerifiedCandidate): Selection['selectedItems'] {
  const scheduled = candidate.items.filter((item) => item.scheduleUnits > 0);
  const businessText = [candidate.name, ...candidate.menus].join(' ');
  const strongBusiness = hasBandSignal(businessText);
  const strongName = hasBandSignal(candidate.name);
  const overrideIds = new Set(MANUAL_ITEM_OVERRIDES[candidate.bookingBusinessId ?? ''] ?? []);
  const valid = scheduled.filter((item) => !HARD_REJECT_PATTERN.test(item.name));
  const hasDirectNonPromo = valid.some(
    (item) => hasBandSignal(item.name) && !PROMO_PATTERN.test(item.name),
  );
  const plausible = valid.filter((item) => {
    if (overrideIds.has(item.bizItemId)) return true;
    if (ANCILLARY_PATTERN.test(item.name) && !hasBandSignal(item.name)) return false;
    if (hasDirectNonPromo && !hasBandSignal(item.name)) return false;
    if (hasBandSignal(item.name)) return true;
    if (!strongName) return false;
    return ROOM_PATTERN.test(item.name) || (strongBusiness && scheduled.length === 1);
  });

  const nonPromoTokens = new Set(
    plausible
      .filter((item) => !PROMO_PATTERN.test(item.name))
      .map((item) => roomToken(item.name))
      .filter((token): token is string => !!token),
  );
  const withoutDuplicatePromos = plausible.filter((item) => {
    if (!PROMO_PATTERN.test(item.name)) return true;
    const token = roomToken(item.name);
    return !plausible.some((other) => !PROMO_PATTERN.test(other.name)) || (!!token && !nonPromoTokens.has(token));
  });

  const grouped = new Map<string, VerifiedItem[]>();
  for (const item of withoutDuplicatePromos) {
    const key = itemKey(item.name);
    grouped.set(key, [...(grouped.get(key) ?? []), item]);
  }

  return [...grouped.values()].map((items) =>
    [...items].sort((a, b) => {
      const promo = Number(PROMO_PATTERN.test(a.name)) - Number(PROMO_PATTERN.test(b.name));
      if (promo !== 0) return promo;
      if (b.saleUnits !== a.saleUnits) return b.saleUnits - a.saleUnits;
      if (b.scheduleUnits !== a.scheduleUnits) return b.scheduleUnits - a.scheduleUnits;
      return a.name.localeCompare(b.name, 'ko');
    })[0],
  );
}

function seoulRegion(address: string): string {
  const district = address.match(/서울(?:특별시)?\s+([^\s]+구)/)?.[1] ?? '';
  if (district === '마포구') return /망원/.test(address) ? '망원' : '합정/홍대';
  if (district === '서대문구') return '신촌';
  if (['양천구', '강서구', '구로구', '금천구', '영등포구'].includes(district)) {
    return '신도림/영등포구청';
  }
  if (district === '동작구') return /사당|이수/.test(address) ? '사당/이수' : '상도,중앙대';
  if (district === '관악구') return '서울대입구';
  if (district === '서초구') return '방배';
  if (district === '강남구') return '강남';
  if (['송파구', '강동구'].includes(district)) return '강동/송파';
  if (['종로구', '성북구', '동대문구'].includes(district)) return '혜화/성신여대';
  return '기타 서울';
}

function regionFor(address: string, existingRegion?: string): string {
  if (existingRegion) return existingRegion;
  if (/^서울/.test(address)) return seoulRegion(address);
  if (/^(경기|경기도)/.test(address)) return '경기';
  if (/^인천/.test(address)) return '인천';
  if (/^부산/.test(address)) return '부산';
  if (/^대구/.test(address)) return '대구';
  if (/^(전남광주통합특별시|광주|전남|전라남도)/.test(address)) return '광주·전남';
  if (/^대전/.test(address)) return '대전';
  if (/^울산/.test(address)) return '울산';
  if (/^세종/.test(address)) return '세종';
  if (/^(강원|강원도|강원특별자치도)/.test(address)) return '강원';
  if (/^(충북|충청북도)/.test(address)) return '충북';
  if (/^(충남|충청남도)/.test(address)) return '충남';
  if (/^(전북|전라북도|전북특별자치도)/.test(address)) return '전북';
  if (/^(경북|경상북도)/.test(address)) return '경북';
  if (/^(경남|경상남도)/.test(address)) return '경남';
  if (/^(제주|제주특별자치도)/.test(address)) return '제주';
  throw new Error(`지역을 분류할 수 없습니다: ${address}`);
}

function priceLabel(price: number | null): string {
  return price ? `${price.toLocaleString('ko-KR')}원` : '가격 문의';
}

function newStudio(selection: Selection): CatalogStudio {
  const prices = selection.selectedItems.map((item) => item.minPrice).filter((price): price is number => !!price);
  const minPrice = prices.length ? Math.min(...prices) : null;
  const maxPrice = prices.length ? Math.max(...prices) : null;
  return {
    id: `studio-naver-${selection.placeId}`,
    name: selection.name,
    slug: '',
    region: selection.region,
    address: selection.address,
    addressDetail: '',
    priceRange:
      minPrice && maxPrice
        ? minPrice === maxPrice
          ? priceLabel(minPrice)
          : `${priceLabel(minPrice)}~${priceLabel(maxPrice)}`
        : '가격 문의',
    imageUrl: selection.imageUrl ?? '',
    amenities: [],
    rooms: selection.selectedItems.length,
    openHours: '',
    description: `${selection.name} 합주실 정보`,
    roomDetails: selection.selectedItems.map((item) => ({
      id: `naver-${item.bizItemId}`,
      name: item.name,
      matchKey: itemKey(item.name),
      price: priceLabel(item.minPrice),
      hourlyPrice: item.minPrice,
      capacityMin: null,
      capacityMax: null,
      minBookingHours: item.durationMinutes ? item.durationMinutes / 60 : 1,
      naverBizItemId: item.bizItemId,
    })),
    publicStatus: 'published',
    publishedAt: new Date().toISOString(),
    naverUrl: selection.bookingUrl ?? undefined,
    isActive: true,
  };
}

async function main(): Promise<void> {
  const verified = JSON.parse(await readFile(VERIFIED_PATH, 'utf8')) as {
    generatedAt: string;
    candidates: VerifiedCandidate[];
  };
  const catalog = JSON.parse(await readFile(CATALOG_PATH, 'utf8')) as Catalog;
  const existingByBusinessId = new Map<string, CatalogStudio>();
  for (const studio of catalog.studios) {
    const businessId = naverBusinessId(studio.naverUrl);
    if (!businessId) continue;
    const preferredStudioId = MANUAL_STUDIO_OVERRIDES[businessId];
    if (!existingByBusinessId.has(businessId) || studio.id === preferredStudioId) {
      existingByBusinessId.set(businessId, studio);
    }
  }

  const selections: Selection[] = verified.candidates
    .filter((candidate) => !candidate.error)
    .map((candidate) => {
      const selectedItems = selectItems(candidate);
      const selectedIds = new Set(selectedItems.map((item) => item.bizItemId));
      const existing = existingByBusinessId.get(candidate.bookingBusinessId ?? '');
      return {
        ...candidate,
        selectedItems,
        rejectedItems: candidate.items
          .filter((item) => !selectedIds.has(item.bizItemId))
          .map((item) => ({
            ...item,
            reason: item.scheduleUnits === 0 ? '예약 시간표 없음' : '합주 예약 상품으로 식별되지 않음',
          })),
        existingStudioId: existing?.id ?? null,
        region: regionFor(candidate.address, existing?.region),
      };
    });
  const accepted = selections.filter((selection) => selection.selectedItems.length > 0);
  const rejected = selections.filter((selection) => selection.selectedItems.length === 0);

  await writeFile(
    REVIEW_PATH,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        verifiedAt: verified.generatedAt,
        acceptedCount: accepted.length,
        rejectedCount: rejected.length,
        accepted,
        rejected,
      },
      null,
      2,
    )}\n`,
  );

  console.log(`[catalog] 반영 대상 ${accepted.length}곳 (기존 ${accepted.filter((item) => item.existingStudioId).length}, 신규 ${accepted.filter((item) => !item.existingStudioId).length})`);
  console.log(`[catalog] 제외 ${rejected.length}곳, 검토 파일 ${REVIEW_PATH}`);

  if (!process.argv.includes('--apply')) return;

  catalog.studios = catalog.studios.filter((studio) => {
    const businessId = naverBusinessId(studio.naverUrl);
    const preferredStudioId = businessId ? MANUAL_STUDIO_OVERRIDES[businessId] : undefined;
    return !preferredStudioId || studio.id === preferredStudioId;
  });

  for (const selection of accepted) {
    const existing = existingByBusinessId.get(selection.bookingBusinessId ?? '');
    if (existing) {
      existing.name = selection.name;
      existing.address = selection.address;
      existing.naverUrl = selection.bookingUrl ?? existing.naverUrl;
      existing.isActive = true;
      continue;
    }
    catalog.studios.push(newStudio(selection));
  }
  catalog.studios.sort((a, b) => a.region.localeCompare(b.region, 'ko') || a.name.localeCompare(b.name, 'ko'));
  catalog.count = catalog.studios.length;
  catalog.regions = ['전체', ...catalog.regions.filter((region) => region !== '전체'), ...NATIONWIDE_REGIONS];
  catalog.areas = [...catalog.regions];
  await writeFile(CATALOG_PATH, `${JSON.stringify(catalog, null, 2)}\n`);
  console.log(`[catalog] ${CATALOG_PATH}에 ${catalog.count}곳 반영 완료`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
