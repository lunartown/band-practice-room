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

type ScheduleResponse = {
  schedule: { bizItemSchedule: { hourly: NaverHourlyUnit[] | null } | null } | null;
};

/**
 * 한 방(bizItem)의 [from, to] 기간 시간별 스케줄을 받는다.
 * 날짜 범위를 한 번에 요청할 수 있어 방당 1콜이면 충분하다.
 * 날짜는 KST 기준 'YYYY-MM-DD'.
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
        endDateTime: `${params.dateTo}T23:59:59`,
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

const BUSINESS_DETAIL_QUERY = `query business($input: BusinessParams) {
  business(input: $input) { businessId businessDisplayName name desc businessAmenityJson }
}`;

const BIZ_ITEM_DETAIL_QUERY = `query bizItem($input: BizItemParams) {
  bizItem(input: $input) {
    bizItemId
    name
    desc
    extraDescJson
    bookingPrecautionJson { title desc }
  }
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

export type NaverBusinessDetail = {
  businessId: string;
  businessDisplayName: string | null;
  name: string | null;
  desc: string | null;
  businessAmenityJson: unknown;
};

/** 비즈니스 소개 텍스트. 장비가 공용 안내로 쓰인 경우 여기서 추출한다. */
export async function fetchBusinessDetail(params: {
  businessId: string;
  businessTypeId: number;
}): Promise<NaverBusinessDetail | null> {
  const data = await naverGraphql<{ business: NaverBusinessDetail | null }>({
    operationName: 'business',
    query: BUSINESS_DETAIL_QUERY,
    referer: bookingReferer(params.businessTypeId, params.businessId),
    variables: {
      input: {
        businessId: params.businessId,
        lang: 'ko',
        projections: 'BUSINESS_DETAIL,RESOURCE',
      },
    },
  });
  return data.business;
}

export type NaverBizItemDetail = {
  bizItemId: string;
  name: string;
  desc: string | null;
  extraDescJson:
    | Array<{
        title?: string | null;
        context?: string | null;
        images?: unknown[];
      }>
    | null;
  bookingPrecautionJson: Array<{ title: string | null; desc: string | null }> | null;
};

/** 방 상세 텍스트. desc/extraDescJson 에 악기 SET·장비 리스트가 들어온다. */
export async function fetchBizItemDetail(params: {
  businessId: string;
  businessTypeId: number;
  bizItemId: string;
}): Promise<NaverBizItemDetail | null> {
  const data = await naverGraphql<{ bizItem: NaverBizItemDetail | null }>({
    operationName: 'bizItem',
    query: BIZ_ITEM_DETAIL_QUERY,
    referer: `${bookingReferer(params.businessTypeId, params.businessId)}/items/${params.bizItemId}`,
    variables: {
      input: {
        businessId: params.businessId,
        bizItemId: params.bizItemId,
        lang: 'ko',
        projections: 'RESOURCE,MIN_MAX_PRICE,BIZ_ITEM_DETAIL',
      },
    },
  });
  return data.bizItem;
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
