CREATE TABLE IF NOT EXISTS equipment_categories (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  "order" SMALLINT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS equipment_items (
  id BIGSERIAL PRIMARY KEY,
  category_id BIGINT NOT NULL REFERENCES equipment_categories(id),
  slug VARCHAR(96) NOT NULL UNIQUE,
  name VARCHAR(96) NOT NULL,
  normalized_name VARCHAR(96) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS equipment_aliases (
  id BIGSERIAL PRIMARY KEY,
  equipment_id BIGINT NOT NULL REFERENCES equipment_items(id) ON DELETE CASCADE,
  alias VARCHAR(96) NOT NULL,
  UNIQUE (equipment_id, alias)
);

CREATE TABLE IF NOT EXISTS room_equipment (
  room_id BIGINT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  equipment_id BIGINT NOT NULL REFERENCES equipment_items(id),
  quantity SMALLINT,
  note TEXT,
  source VARCHAR(32) NOT NULL CHECK (source IN ('MANUAL', 'SCRAPED', 'UNKNOWN')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, equipment_id),
  CHECK (quantity IS NULL OR quantity > 0)
);

CREATE TABLE IF NOT EXISTS studio_equipment (
  studio_id BIGINT NOT NULL REFERENCES studios(id) ON DELETE CASCADE,
  equipment_id BIGINT NOT NULL REFERENCES equipment_items(id),
  quantity SMALLINT,
  note TEXT,
  source VARCHAR(32) NOT NULL CHECK (source IN ('MANUAL', 'SCRAPED', 'UNKNOWN')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (studio_id, equipment_id),
  CHECK (quantity IS NULL OR quantity > 0)
);

CREATE INDEX IF NOT EXISTS idx_equipment_items_category
  ON equipment_items (category_id, is_active, name);

CREATE INDEX IF NOT EXISTS idx_equipment_aliases_alias
  ON equipment_aliases (lower(alias));

CREATE INDEX IF NOT EXISTS idx_room_equipment_equipment_room
  ON room_equipment (equipment_id, room_id);

CREATE INDEX IF NOT EXISTS idx_studio_equipment_equipment_studio
  ON studio_equipment (equipment_id, studio_id);
