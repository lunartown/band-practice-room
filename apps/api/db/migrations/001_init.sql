CREATE TABLE IF NOT EXISTS areas (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  "order" SMALLINT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS studios (
  id BIGSERIAL PRIMARY KEY,
  slug VARCHAR(128) UNIQUE,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  primary_area_id BIGINT REFERENCES areas(id),
  address VARCHAR(256),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS studio_areas (
  id BIGSERIAL PRIMARY KEY,
  studio_id BIGINT NOT NULL REFERENCES studios(id),
  area_id BIGINT NOT NULL REFERENCES areas(id),
  UNIQUE (studio_id, area_id)
);

CREATE TABLE IF NOT EXISTS sources (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  url VARCHAR(512) NOT NULL,
  auth_kind VARCHAR(32) CHECK (auth_kind IN ('NONE', 'FORM_LOGIN', 'COOKIE', 'MANUAL_SESSION')),
  credential_key VARCHAR(256),
  is_active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS studio_sources (
  id BIGSERIAL PRIMARY KEY,
  studio_id BIGINT NOT NULL REFERENCES studios(id),
  source_id BIGINT NOT NULL REFERENCES sources(id),
  external_key VARCHAR(256),
  url VARCHAR(512),
  UNIQUE (studio_id, source_id)
);

CREATE TABLE IF NOT EXISTS rooms (
  id BIGSERIAL PRIMARY KEY,
  studio_id BIGINT NOT NULL REFERENCES studios(id),
  name VARCHAR(128) NOT NULL,
  price_per_hour INTEGER,
  price_source VARCHAR(32) CHECK (price_source IN ('SCRAPED', 'MANUAL', 'UNKNOWN')),
  capacity_min SMALLINT,
  capacity_max SMALLINT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  CHECK (capacity_min IS NULL OR capacity_max IS NULL OR capacity_max >= capacity_min)
);

CREATE TABLE IF NOT EXISTS room_sources (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT NOT NULL REFERENCES rooms(id),
  source_id BIGINT NOT NULL REFERENCES sources(id),
  external_key VARCHAR(256),
  url VARCHAR(512),
  UNIQUE (room_id, source_id)
);

CREATE TABLE IF NOT EXISTS slots (
  id BIGSERIAL PRIMARY KEY,
  room_id BIGINT NOT NULL REFERENCES rooms(id),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('AVAILABLE', 'UNAVAILABLE', 'UNKNOWN')),
  price INTEGER,
  price_source VARCHAR(32) NOT NULL CHECK (price_source IN ('SCRAPED', 'MANUAL', 'UNKNOWN')),
  scraped_at TIMESTAMPTZ NOT NULL,
  CHECK (end_time > start_time),
  UNIQUE (room_id, date, start_time)
);

CREATE INDEX IF NOT EXISTS idx_slots_date_status ON slots (date, status);
CREATE INDEX IF NOT EXISTS idx_slots_room_date ON slots (room_id, date);
CREATE INDEX IF NOT EXISTS idx_studios_primary_area ON studios (primary_area_id);
CREATE INDEX IF NOT EXISTS idx_studio_areas_area ON studio_areas (area_id, studio_id);
CREATE INDEX IF NOT EXISTS idx_rooms_studio_active ON rooms (studio_id, is_active);
