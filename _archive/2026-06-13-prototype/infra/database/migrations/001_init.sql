CREATE TABLE IF NOT EXISTS schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS practice_rooms (
  id text PRIMARY KEY,
  name text NOT NULL,
  area text,
  source_type text NOT NULL DEFAULT 'naver',
  source_url text NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS rooms (
  id text PRIMARY KEY,
  practice_room_id text NOT NULL REFERENCES practice_rooms(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  capacity integer,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (practice_room_id, name)
);

CREATE TABLE IF NOT EXISTS availability_slots (
  id bigserial PRIMARY KEY,
  room_id text NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  status text NOT NULL CHECK (status IN ('available', 'unavailable', 'unknown')),
  price integer,
  scraped_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (room_id, date, start_time, end_time)
);

CREATE INDEX IF NOT EXISTS idx_availability_slots_date
  ON availability_slots(date);

CREATE INDEX IF NOT EXISTS idx_availability_slots_room_date
  ON availability_slots(room_id, date);

CREATE TABLE IF NOT EXISTS scrape_runs (
  id bigserial PRIMARY KEY,
  practice_room_id text NOT NULL REFERENCES practice_rooms(id) ON DELETE CASCADE,
  target_date date NOT NULL,
  status text NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  error_message text
);

