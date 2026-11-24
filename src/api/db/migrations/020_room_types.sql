-- 방 종류(밴드 합주실, 개인 연습실, 피아노·클래식 연습실 등)와 방-종류 관계.
-- 종류 행이 없는 방은 "미확인"으로 본다. 겸용 방은 여러 종류를 갖고, 대표 종류는 방당 하나다.
CREATE TABLE IF NOT EXISTS room_types (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  "order" SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS room_type_assignments (
  room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  room_type_id BIGINT NOT NULL REFERENCES room_types(id),
  is_primary BOOLEAN NOT NULL DEFAULT false,
  source VARCHAR(32) NOT NULL CHECK (source IN ('MANUAL', 'SCRAPED', 'UNKNOWN')),
  note TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, room_type_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_type_assignments_primary
  ON room_type_assignments (room_id)
  WHERE is_primary;

CREATE INDEX IF NOT EXISTS idx_room_type_assignments_type_room
  ON room_type_assignments (room_type_id, room_id);

INSERT INTO room_types (slug, name, "order")
VALUES
  ('band', '밴드 합주실', 10),
  ('personal', '개인 연습실', 20),
  ('drum', '드럼 연습실', 30),
  ('piano-classical', '피아노·클래식 연습실', 40),
  ('ensemble', '앙상블·실내악실', 50),
  ('recording', '녹음실', 60),
  ('hall', '홀·공연장 대관', 70)
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    "order" = EXCLUDED."order";
