CREATE TABLE IF NOT EXISTS scrape_jobs (
  id BIGSERIAL PRIMARY KEY,
  studio_source_id BIGINT NOT NULL REFERENCES studio_sources(id),
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('PENDING', 'RUNNING', 'SUCCESS', 'FAILED')) DEFAULT 'PENDING',
  priority SMALLINT NOT NULL DEFAULT 0,
  run_after TIMESTAMPTZ,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scrape_runs (
  id BIGSERIAL PRIMARY KEY,
  job_id BIGINT NOT NULL REFERENCES scrape_jobs(id),
  studio_id BIGINT NOT NULL REFERENCES studios(id),
  source_id BIGINT NOT NULL REFERENCES sources(id),
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,
  status VARCHAR(16) NOT NULL CHECK (status IN ('SUCCESS', 'FAILED', 'PARTIAL')),
  started_at TIMESTAMPTZ NOT NULL,
  finished_at TIMESTAMPTZ,
  rooms_found INTEGER,
  slots_found INTEGER,
  error_kind VARCHAR(32) CHECK (error_kind IN ('TIMEOUT', 'AUTH_FAILED', 'PARSE_FAILED', 'UNKNOWN')),
  error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_scrape_jobs_status_run_after ON scrape_jobs (status, run_after);
CREATE INDEX IF NOT EXISTS idx_scrape_runs_job ON scrape_runs (job_id);
