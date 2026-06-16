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

/**
 * 리뷰 키워드를 뱃지용 단어 배열로 변환한다.
 * - count 내림차순(서버가 이미 정렬해 줌)을 유지하며 축약어로 매핑
 * - 축약 결과가 겹치면(예: 스피커 성능/음향 → 음향) 중복 제거
 * - 매핑에 없는 라벨은 제외(노이즈 방지)
 */
export function toReviewBadges(keywords: ReviewKeyword[] | undefined, limit = 3): string[] {
  if (!keywords?.length) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const { keyword } of keywords) {
    const word = BADGE_WORD[keyword];
    if (!word || seen.has(word)) continue;
    seen.add(word);
    out.push(word);
    if (out.length >= limit) break;
  }
  return out;
}
