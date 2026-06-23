import { spacecloudGet } from './api.js';
import type { SpaceCloudPricesResponse } from './types.js';

/**
 * 한 product 의 특정 (year, month) 한 달치 시간대별 가격/가용성을 받는다.
 * 스페이스클라우드 가용성 API 는 월 단위라, 기간이 두 달에 걸치면 월마다 한 번씩 호출한다.
 * 날짜는 KST 기준이며 응답 days[] 는 해당 월 전체(앞뒤 며칠 포함)를 담는다.
 */
export async function fetchMonthlyPrices(params: {
  productId: string;
  reservationTypeId: string;
  year: number;
  month: number; // 1~12
}): Promise<SpaceCloudPricesResponse> {
  const mm = String(params.month).padStart(2, '0');
  const path =
    `/products/${params.productId}/prices` +
    `?reservation_type_id=${params.reservationTypeId}&year=${params.year}&month=${mm}`;
  return spacecloudGet<SpaceCloudPricesResponse>(path);
}
