-- 내부 운영 콘솔용 상태/감사 필드.
-- 기존 공개 API 스키마는 유지하고, 수집 원천과 이미지 품질만 운영자가 직접 관리한다.

ALTER TABLE studio_sources
  ADD COLUMN IF NOT EXISTS mapping_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS mapping_note TEXT,
  ADD COLUMN IF NOT EXISTS last_lookup_error TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manual_updated_at TIMESTAMPTZ;

ALTER TABLE room_sources
  ADD COLUMN IF NOT EXISTS mapping_status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS mapping_note TEXT,
  ADD COLUMN IF NOT EXISTS last_lookup_error TEXT,
  ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS manual_updated_at TIMESTAMPTZ;

ALTER TABLE studios
  ADD COLUMN IF NOT EXISTS image_status VARCHAR(32) NOT NULL DEFAULT 'OK',
  ADD COLUMN IF NOT EXISTS image_note TEXT,
  ADD COLUMN IF NOT EXISTS image_reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS image_updated_at TIMESTAMPTZ;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'studio_sources_mapping_status_check'
  ) THEN
    ALTER TABLE studio_sources
      ADD CONSTRAINT studio_sources_mapping_status_check
      CHECK (mapping_status IN ('ACTIVE', 'NEEDS_MAPPING', 'DISABLED', 'NOT_FOUND'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'room_sources_mapping_status_check'
  ) THEN
    ALTER TABLE room_sources
      ADD CONSTRAINT room_sources_mapping_status_check
      CHECK (mapping_status IN ('ACTIVE', 'NEEDS_MAPPING', 'DISABLED', 'NOT_FOUND'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'studios_image_status_check'
  ) THEN
    ALTER TABLE studios
      ADD CONSTRAINT studios_image_status_check
      CHECK (image_status IN ('OK', 'MISSING', 'BAD', 'NEEDS_REVIEW', 'MANUAL_OVERRIDE', 'HIDDEN'));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGSERIAL PRIMARY KEY,
  actor VARCHAR(128) NOT NULL,
  action VARCHAR(64) NOT NULL,
  target_type VARCHAR(64) NOT NULL,
  target_id BIGINT NOT NULL,
  before_value JSONB,
  after_value JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_studio_sources_mapping_status
  ON studio_sources (mapping_status);
CREATE INDEX IF NOT EXISTS idx_room_sources_mapping_status
  ON room_sources (mapping_status);
CREATE INDEX IF NOT EXISTS idx_studios_image_status
  ON studios (image_status);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at
  ON admin_audit_logs (created_at DESC);
