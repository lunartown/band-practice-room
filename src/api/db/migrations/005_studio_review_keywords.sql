-- 네이버 키워드 리뷰(긍정 키워드 + 투표 수) 상위 N개를 저장한다.
-- 네이버 예약 리뷰는 별점이 아니라 키워드식이라, 별점보다 이쪽이 품질 신호로 유효하다.
-- 형식: [{"keyword": "시설이 깔끔해요", "count": 69}, ...]  (count 내림차순)
ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS review_keywords JSONB;
