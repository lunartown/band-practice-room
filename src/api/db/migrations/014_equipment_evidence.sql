CREATE TABLE IF NOT EXISTS equipment_evidence (
  id BIGSERIAL PRIMARY KEY,
  evidence_key VARCHAR(160) NOT NULL UNIQUE,
  target_kind VARCHAR(16) NOT NULL CHECK (target_kind IN ('STUDIO', 'ROOM')),
  studio_id BIGINT REFERENCES studios(id) ON DELETE CASCADE,
  room_id BIGINT REFERENCES rooms(id) ON DELETE CASCADE,
  equipment_id BIGINT REFERENCES equipment_items(id),
  source_kind VARCHAR(32) NOT NULL CHECK (
    source_kind IN (
      'NAVER_BOOKING',
      'NAVER_PLACE',
      'SPACE_CLOUD',
      'OFFICIAL_SITE',
      'SOCIAL',
      'BLOG',
      'UNKNOWN'
    )
  ),
  source_url VARCHAR(1024) NOT NULL,
  source_title VARCHAR(256),
  raw_name VARCHAR(160),
  raw_text TEXT NOT NULL,
  confidence VARCHAR(16) NOT NULL CHECK (
    confidence IN ('HIGH', 'MEDIUM', 'LOW', 'NEEDS_REVIEW')
  ),
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (target_kind = 'STUDIO' AND studio_id IS NOT NULL AND room_id IS NULL)
    OR
    (target_kind = 'ROOM' AND studio_id IS NULL AND room_id IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_equipment_evidence_studio
  ON equipment_evidence (studio_id, equipment_id)
  WHERE studio_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_evidence_room
  ON equipment_evidence (room_id, equipment_id)
  WHERE room_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_evidence_review
  ON equipment_evidence (confidence, source_kind)
  WHERE confidence IN ('LOW', 'NEEDS_REVIEW') OR equipment_id IS NULL;
