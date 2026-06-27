-- 빈자리 알림(푸시) 기반 스키마.
-- 로그인 없는 서비스라 "디바이스 토큰" 단위로 익명 구독을 받는다.
-- 변동 감지는 slots 트리거가 '비가용/미상 → 가용' 전이를 slot_available_events 에 적재하고,
-- 별도 dispatcher 가 구독과 매칭해 FCM 으로 발송한다.

-- 1) 디바이스: FCM 등록 토큰(웹 포함) 1개 = 1행.
CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  device_token TEXT NOT NULL UNIQUE,
  platform VARCHAR(16) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  app_version VARCHAR(32),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) 구독 규칙: 디바이스가 "이 합주실(또는 이 지역)에 이런 시간대 빈자리가 나면 알려줘".
--    studio_id / area_id 중 최소 하나는 있어야 한다(둘 다면 교집합이 아니라 둘 다 조건).
--    time_from/time_to 는 슬롯 시작시각 필터(NULL=제한 없음). weekdays 는 0=일~6=토(NULL/빈배열=모든 요일).
CREATE TABLE IF NOT EXISTS notification_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  studio_id BIGINT REFERENCES studios(id),
  area_id BIGINT REFERENCES areas(id),
  time_from TIME,
  time_to TIME,
  min_duration SMALLINT NOT NULL DEFAULT 1 CHECK (min_duration BETWEEN 1 AND 4),
  weekdays SMALLINT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (studio_id IS NOT NULL OR area_id IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_device
  ON notification_subscriptions (device_id);
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_studio
  ON notification_subscriptions (studio_id) WHERE studio_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_notification_subscriptions_area
  ON notification_subscriptions (area_id) WHERE area_id IS NOT NULL;

-- 3) 발송 로그 + 중복 발송 차단.
--    (subscription, room, date, start_time) 가 유일 → 같은 슬롯을 같은 구독에 두 번 안 쏜다.
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id BIGSERIAL PRIMARY KEY,
  subscription_id BIGINT NOT NULL REFERENCES notification_subscriptions(id) ON DELETE CASCADE,
  device_id BIGINT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
  room_id BIGINT NOT NULL REFERENCES rooms(id),
  slot_date DATE NOT NULL,
  slot_start_time TIME NOT NULL,
  status VARCHAR(16) NOT NULL DEFAULT 'SENT' CHECK (status IN ('SENT', 'FAILED', 'SKIPPED')),
  error TEXT,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (subscription_id, room_id, slot_date, slot_start_time)
);

CREATE INDEX IF NOT EXISTS idx_notification_deliveries_sent_at
  ON notification_deliveries (sent_at DESC);

-- 4) 변동 이벤트 큐: slots 가 가용 상태로 "새로" 바뀐 사건을 기록한다.
--    dispatcher 가 processed_at 으로 소비 여부를 표시한다.
CREATE TABLE IF NOT EXISTS slot_available_events (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT NOT NULL REFERENCES rooms(id),
  slot_date DATE NOT NULL,
  slot_start_time TIME NOT NULL,
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_slot_available_events_unprocessed
  ON slot_available_events (detected_at) WHERE processed_at IS NULL;

-- 5) 트리거: slots 에 INSERT 되거나 status 가 갱신될 때,
--    '가용이 아니던 것 → 가용'(또는 신규 가용 INSERT) 전이만 이벤트로 남긴다.
--    스크래퍼/관리자/시드 등 누가 쓰든 한곳에서 잡으려고 DB 트리거로 둔다.
CREATE OR REPLACE FUNCTION record_slot_available_event() RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'AVAILABLE'
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'AVAILABLE') THEN
    INSERT INTO slot_available_events (room_id, slot_date, slot_start_time)
    VALUES (NEW.room_id, NEW.date, NEW.start_time);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_slot_available ON slots;
CREATE TRIGGER trg_slot_available
  AFTER INSERT OR UPDATE OF status ON slots
  FOR EACH ROW EXECUTE FUNCTION record_slot_available_event();
