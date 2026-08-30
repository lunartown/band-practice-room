import { bookingReferer, naverGraphql } from './api.js';
import type { NaverHourlyUnit } from './types.js';

// businessTypeId 를 빼면 hourly 가 null 로 와서 빈 결과가 된다(중요).
const HOURLY_SCHEDULE_QUERY = `query hourlySchedule($scheduleParams: ScheduleParams) {
  schedule(input: $scheduleParams) {
    bizItemSchedule {
      hourly {
        unitStartDateTime
        isUnitBusinessDay
        isUnitSaleDay
        unitStock
        unitBookingCount
        duration
        prices { price isDefault }
      }
    }
  }
}`;

const BIZ_ITEMS_QUERY = `query bizItems($input: BizItemsParams) {
  bizItems(input: $input) { id name bookingTimeUnitCode }
}`;

const BIZ_ITEM_QUERY = `query bizItem($input: BizItemParams) {
  bizItem(input: $input) { id name desc }
}`;

type ScheduleResponse = {
  schedule: { bizItemSchedule: { hourly: NaverHourlyUnit[] | null } | null } | null;
};

// 'YYYY-MM-DD' 에 하루를 더한다(UTC 기준 계산이라 서머타임 영향 없음).
function nextDate(date: string): string {
  const d = new Date(`${date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/**
 * 한 방(bizItem)의 [from, to] 기간 시간별 스케줄을 받는다.
 * 날짜 범위를 한 번에 요청할 수 있어 방당 1콜이면 충분하다.
 * 날짜는 KST 기준 'YYYY-MM-DD'.
 *
 * endDateTime 은 dateTo 하루 뒤로 보낸다(중요). 네이버는 요청한 마지막 날을
 * 응답에 포함하지 않아, dateTo 를 그대로 주면 항상 하루가 빈다. 실측상 span 을
 * 6/7/29/30/45/60 으로 바꿔도 예외 없이 '요청일 - 1일'까지만 돌아온다.
 * 넉넉히 요청하는 대신 범위 밖 날짜는 매퍼가 잘라낸다.
 */
export async function fetchHourlySchedule(params: {
  businessId: string;
  businessTypeId: number;
  bizItemId: string;
  dateFrom: string;
  dateTo: string;
}): Promise<NaverHourlyUnit[]> {
  const data = await naverGraphql<ScheduleResponse>({
    operationName: 'hourlySchedule',
    query: HOURLY_SCHEDULE_QUERY,
    referer: bookingReferer(params.businessTypeId, params.businessId),
    variables: {
      scheduleParams: {
        businessId: params.businessId,
        businessTypeId: params.businessTypeId,
        bizItemId: params.bizItemId,
        startDateTime: `${params.dateFrom}T00:00:00`,
        endDateTime: `${nextDate(params.dateTo)}T23:59:59`,
      },
    },
  });
  return data.schedule?.bizItemSchedule?.hourly ?? [];
}

const REVIEW_STATS_QUERY = `query reviewStats($input: ReviewStatsParams) {
  reviewStats(input: $input) {
    totalCount
    avgRating
    ratingUserCount
    analysis { votedKeyword { details { count keyword { label } } } }
  }
}`;

const BUSINESS_IMAGES_QUERY = `query business($input: BusinessParams) {
  business(input: $input) { businessResources { order resourceUrl } }
}`;

export type ReviewKeyword = { keyword: string; count: number };

export type NaverReviewStats = {
  totalCount: number | null;
  avgRating: number | null;
  ratingUserCount: number | null;
  keywords: ReviewKeyword[]; // 긍정 키워드, count 내림차순 상위 N개
};

type RawReviewStats = {
  totalCount: number | null;
  avgRating: number | null;
  ratingUserCount: number | null;
  analysis: {
    votedKeyword: {
      details: Array<{ count: number; keyword: { label: { ko: string } | null } | null }> | null;
    } | null;
  } | null;
};

const KEYWORD_LIMIT = 5;

/** 비즈니스 리뷰 통계 + 긍정 키워드. 네이버 예약 리뷰는 키워드식이라 avgRating 은 대부분 0. */
export async function fetchReviewStats(params: {
  businessId: string;
  businessTypeId: number;
}): Promise<NaverReviewStats> {
  const data = await naverGraphql<{ reviewStats: RawReviewStats | null }>({
    operationName: 'reviewStats',
    query: REVIEW_STATS_QUERY,
    referer: bookingReferer(params.businessTypeId, params.businessId),
    variables: { input: { businessId: params.businessId } },
  });

  const stats = data.reviewStats;
  if (!stats) return { totalCount: null, avgRating: null, ratingUserCount: null, keywords: [] };

  const keywords: ReviewKeyword[] = (stats.analysis?.votedKeyword?.details ?? [])
    .map((d) => ({ keyword: d.keyword?.label?.ko ?? '', count: d.count }))
    .filter((k) => k.keyword)
    .sort((a, b) => b.count - a.count)
    .slice(0, KEYWORD_LIMIT);

  return {
    totalCount: stats.totalCount,
    avgRating: stats.avgRating,
    ratingUserCount: stats.ratingUserCount,
    keywords,
  };
}

/** 비즈니스 대표 이미지들(표시 순서대로). 첫 번째가 커버. */
export async function fetchBusinessImages(params: {
  businessId: string;
  businessTypeId: number;
}): Promise<string[]> {
  const data = await naverGraphql<{
    business: { businessResources: Array<{ order: number; resourceUrl: string }> | null } | null;
  }>({
    operationName: 'business',
    query: BUSINESS_IMAGES_QUERY,
    referer: bookingReferer(params.businessTypeId, params.businessId),
    variables: { input: { businessId: params.businessId, lang: 'ko', projections: 'RESOURCE' } },
  });
  return (data.business?.businessResources ?? []).map((r) => r.resourceUrl).filter(Boolean);
}

export type NaverBizItem = { bizItemId: string; name: string; bookingTimeUnitCode: string };

export type NaverBizItemDetail = { bizItemId: string; name: string; description: string };

/** 공개 예약 상품의 현재 이름과 설명. 장비 근거 감사처럼 상품 본문이 필요할 때 쓴다. */
export async function fetchBizItemDetail(params: {
  businessId: string;
  businessTypeId: number;
  bizItemId: string;
}): Promise<NaverBizItemDetail> {
  const data = await naverGraphql<{
    bizItem: { id: string; name: string; desc: string | null } | null;
  }>({
    operationName: 'bizItem',
    query: BIZ_ITEM_QUERY,
    referer: bookingReferer(params.businessTypeId, params.businessId),
    variables: {
      input: {
        businessId: params.businessId,
        bizItemId: params.bizItemId,
        lang: 'ko',
        projections: 'RESOURCE,MIN_MAX_PRICE,BIZ_ITEM_DETAIL',
      },
    },
  });
  if (!data.bizItem) throw new Error(`네이버 예약 상품 없음 (${params.bizItemId})`);
  return {
    bizItemId: String(data.bizItem.id).split('_')[0],
    name: data.bizItem.name,
    description: data.bizItem.desc ?? '',
  };
}

/** 비즈니스의 방(bizItem) 목록. 매핑 부트스트랩/점검용. */
export async function fetchBizItems(params: {
  businessId: string;
  businessTypeId: number;
}): Promise<NaverBizItem[]> {
  const data = await naverGraphql<{
    bizItems: Array<{ id: string; name: string; bookingTimeUnitCode: string }>;
  }>({
    operationName: 'bizItems',
    query: BIZ_ITEMS_QUERY,
    referer: bookingReferer(params.businessTypeId, params.businessId),
    variables: { input: { businessId: params.businessId } },
  });
  // id 는 "5587861_{...}" 형태(Apollo 캐시 복합키)라 숫자 접두부만 실제 id.
  return (data.bizItems ?? []).map((it) => ({
    bizItemId: String(it.id).split('_')[0],
    name: it.name,
    bookingTimeUnitCode: it.bookingTimeUnitCode,
  }));
}
