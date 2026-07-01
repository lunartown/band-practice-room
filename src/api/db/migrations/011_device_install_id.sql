-- 디바이스 식별을 FCM 토큰에서 "앱 설치 ID"로 분리한다.
-- 토큰은 회전(재발급)되는 값이라 자연키로 쓰면 회전 순간 구독이 옛 토큰 행에 묶여 전부 무효가 된다.
-- install_id: 앱이 생성해 보관하는 UUID. 토큰은 디바이스의 갱신 가능한 속성으로 강등한다.
--
-- 기존 행은 install_id 를 device_token 으로 백필한다(레거시 마커: install_id = device_token).
-- 새 클라이언트가 설치 ID + 같은 토큰으로 등록하면 레거시 행을 승계해 기존 구독을 보존한다
-- (승계 로직은 notifications.repository 참고).

-- 토큰이 다른 설치로 옮겨가면 옛 행에서 회수(NULL)해야 하므로 NOT NULL 을 푼다.
ALTER TABLE devices ALTER COLUMN device_token DROP NOT NULL;

ALTER TABLE devices ADD COLUMN IF NOT EXISTS install_id TEXT;
UPDATE devices SET install_id = device_token WHERE install_id IS NULL;
ALTER TABLE devices ALTER COLUMN install_id SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_devices_install_id ON devices (install_id);
