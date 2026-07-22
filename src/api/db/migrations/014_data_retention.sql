-- 매시간 실행되는 멱등 마이그레이션을 이용해 운영 데이터 보존 기간을 제한한다.
-- 현재/미래 예약 슬롯과 미처리 알림 이벤트는 삭제하지 않는다.

DELETE FROM slot_available_events
WHERE processed_at IS NOT NULL
  AND processed_at < NOW() - INTERVAL '7 days';

DELETE FROM notification_deliveries
WHERE slot_date < CURRENT_DATE - 7;

DELETE FROM scrape_runs
WHERE finished_at < NOW() - INTERVAL '14 days';

DELETE FROM slots
WHERE date < CURRENT_DATE;
