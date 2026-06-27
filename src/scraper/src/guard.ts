/**
 * 조용한 실패(silent failure) 판정.
 *
 * 네이버/스페이스클라우드 API 가 에러 없이 빈 스케줄을 돌려주는 경우가 있다
 * (businessTypeId 누락, 매핑 변경, 일시적 빈 응답 등). 합주실은 영업일이면
 * 예약 가능/불가에 관계없이 시간 단위(unit)가 항상 잡히므로, 직전에 슬롯이
 * 있었는데 이번에 0건이면 실제 상태가 아니라 수집 실패로 본다.
 *
 * 빈 결과를 그대로 성공 처리하면 upsert 가 아무 행도 갱신하지 않아,
 * 이전에 'AVAILABLE' 이던 슬롯이 예약된 뒤에도 계속 '가능'으로 노출된다.
 * → 사용자 신뢰를 직접 깨므로, 성공 대신 실패로 보내 재시도/알림 경로를 탄다.
 *
 * @param currentSlots  이번 수집에서 얻은 슬롯 수(available + unavailable 합)
 * @param previousSlots 직전 성공 수집의 슬롯 수(이력이 없으면 null)
 */
export function isSuspiciousEmptyResult(
  currentSlots: number,
  previousSlots: number | null,
): boolean {
  if (currentSlots > 0) return false;
  // 직전 성공 이력이 없으면(처음부터 0) 매핑/설정 문제라 별도 판단. 여기선 막지 않는다.
  if (previousSlots === null || previousSlots <= 0) return false;
  return true;
}
