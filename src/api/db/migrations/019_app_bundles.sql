-- 자체 호스팅 OTA(라이브 업데이트) 번들 목록.
-- 앱의 Capgo 업데이터 플러그인이 /api/v1/app-updates 로 "지금 받을 번들"을 묻고,
-- 서버는 (app_id, native_version) 이 같은 활성 번들 중 id 가 가장 큰 행을 돌려준다.
-- 롤백은 문제 번들의 is_active 를 false 로 끄면 직전 활성 번들이 다시 최신이 된다.
-- 최신 판정은 버전 문자열이 아니라 id 순서로 한다(문자열로는 1.0.10 < 1.0.9).
CREATE TABLE IF NOT EXISTS app_bundles (
  id BIGSERIAL PRIMARY KEY,
  app_id VARCHAR(128) NOT NULL,
  native_version VARCHAR(32) NOT NULL,
  version VARCHAR(64) NOT NULL,
  url TEXT NOT NULL,
  checksum CHAR(64) NOT NULL,
  git_sha VARCHAR(40),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (app_id, version)
);

CREATE INDEX IF NOT EXISTS idx_app_bundles_latest_active
  ON app_bundles (app_id, native_version, id DESC)
  WHERE is_active;
