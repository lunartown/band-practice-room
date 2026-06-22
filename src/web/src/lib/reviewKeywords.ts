import type { ReviewKeyword } from '../api/types';

// 네이버 키워드 리뷰의 긴 문장 라벨("시설이 깔끔해요")을 뱃지용 단어("청결")로 축약한다.
const BADGE_WORD: Record<string, string> = {
  '시설이 깔끔해요': '청결',
  '가성비가 좋아요': '가성비',
  '가격이 합리적이에요': '가성비',
  '비싼 만큼 가치있어요': '가치',
  친절해요: '친절',
  '인테리어가 멋져요': '인테리어',
  '스피커 성능이 좋아요': '음향',
  '음향이 좋아요': '음향',
  '울림이 적당해요': '울림',
  '방음이 잘돼요': '방음',
  '매장이 넓어요': '넓은공간',
  '룸이 잘 되어있어요': '룸상태',
  '장비 관리 상태가 좋아요': '장비',
  '조명이 좋아요': '조명',
  '화장실이 깨끗해요': '화장실',
  아늑해요: '아늑함',
  '사진이 잘 나와요': '포토',
  '주차하기 편해요': '주차',
  '요금제가 잘 되어있어요': '요금제',
  '휴게시설이 잘 되어있어요': '휴게시설',
  '단체모임 하기 좋아요': '단체',
  '좌석이 편해요': '좌석',
  '분위기 관리가 철저해요': '분위기',
  '관객과 소통을 잘해요': '소통',
  '집중하기 좋아요': '집중',
};

// 뱃지 노출 문턱(빡세게): 아래 두 조건을 "모두" 만족한 키워드만 노출한다.
// - MIN_COUNT: 그 키워드를 고른 최소 인원수(절대치)
// - MIN_RATIO: 전체 리뷰 수(reviewCount) 대비 최소 비율
// "개나소나" 붙는 걸 막기 위한 값. 더 느슨/빡세게 하려면 여기만 고치면 된다.
export const BADGE_MIN_COUNT = 15;
export const BADGE_MIN_RATIO = 0.3;

/**
 * 리뷰 키워드를 뱃지용 단어 배열로 변환한다.
 * - count 내림차순(서버가 이미 정렬해 줌)을 유지하며 축약어로 매핑
 * - 축약 결과가 겹치면(예: 스피커 성능/음향 → 음향) 중복 제거
 * - 매핑에 없는 라벨은 제외(노이즈 방지)
 * - 인원수/비율 문턱을 못 넘는 키워드는 제외(대표성 없는 뱃지 차단)
 *
 * @param reviewCount 전체 리뷰 수. 없거나 0이면 비율 판정이 불가능하므로 뱃지를 노출하지 않는다.
 */
export function toReviewBadges(
  keywords: ReviewKeyword[] | undefined,
  reviewCount: number | null | undefined,
  limit = 3,
): string[] {
  if (!keywords?.length) return [];
  // 전체 리뷰 수를 모르면 "전체의 몇 %"를 판정할 수 없어 노출하지 않는다.
  if (!reviewCount || reviewCount <= 0) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const { keyword, count } of keywords) {
    if (count < BADGE_MIN_COUNT) continue;
    if (count / reviewCount < BADGE_MIN_RATIO) continue;
    const word = BADGE_WORD[keyword];
    if (!word || seen.has(word)) continue;
    seen.add(word);
    out.push(word);
    if (out.length >= limit) break;
  }
  return out;
}
