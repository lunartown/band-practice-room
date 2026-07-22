CREATE TABLE IF NOT EXISTS equipment_models (
  id BIGSERIAL PRIMARY KEY,
  equipment_id BIGINT NOT NULL REFERENCES equipment_items(id) ON DELETE CASCADE,
  slug VARCHAR(160) NOT NULL UNIQUE,
  brand VARCHAR(96),
  model VARCHAR(128) NOT NULL,
  variant VARCHAR(128),
  display_name VARCHAR(192) NOT NULL,
  normalized_name VARCHAR(192) NOT NULL,
  specs JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE room_equipment ADD COLUMN IF NOT EXISTS id BIGINT;
ALTER TABLE studio_equipment ADD COLUMN IF NOT EXISTS id BIGINT;

CREATE SEQUENCE IF NOT EXISTS room_equipment_id_seq;
CREATE SEQUENCE IF NOT EXISTS studio_equipment_id_seq;

ALTER SEQUENCE room_equipment_id_seq OWNED BY room_equipment.id;
ALTER SEQUENCE studio_equipment_id_seq OWNED BY studio_equipment.id;

ALTER TABLE room_equipment
  ALTER COLUMN id SET DEFAULT nextval('room_equipment_id_seq');

ALTER TABLE studio_equipment
  ALTER COLUMN id SET DEFAULT nextval('studio_equipment_id_seq');

UPDATE room_equipment
SET id = nextval('room_equipment_id_seq')
WHERE id IS NULL;

UPDATE studio_equipment
SET id = nextval('studio_equipment_id_seq')
WHERE id IS NULL;

SELECT setval(
  'room_equipment_id_seq',
  COALESCE((SELECT MAX(id) FROM room_equipment), 1),
  (SELECT COUNT(*) > 0 FROM room_equipment)
);

SELECT setval(
  'studio_equipment_id_seq',
  COALESCE((SELECT MAX(id) FROM studio_equipment), 1),
  (SELECT COUNT(*) > 0 FROM studio_equipment)
);

ALTER TABLE room_equipment
  ALTER COLUMN id SET NOT NULL;

ALTER TABLE studio_equipment
  ALTER COLUMN id SET NOT NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'room_equipment_pkey'
      AND conrelid = 'room_equipment'::regclass
      AND pg_get_constraintdef(oid) <> 'PRIMARY KEY (id)'
  ) THEN
    ALTER TABLE room_equipment DROP CONSTRAINT room_equipment_pkey;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'room_equipment_pkey'
      AND conrelid = 'room_equipment'::regclass
  ) THEN
    ALTER TABLE room_equipment ADD CONSTRAINT room_equipment_pkey PRIMARY KEY (id);
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'studio_equipment_pkey'
      AND conrelid = 'studio_equipment'::regclass
      AND pg_get_constraintdef(oid) <> 'PRIMARY KEY (id)'
  ) THEN
    ALTER TABLE studio_equipment DROP CONSTRAINT studio_equipment_pkey;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'studio_equipment_pkey'
      AND conrelid = 'studio_equipment'::regclass
  ) THEN
    ALTER TABLE studio_equipment ADD CONSTRAINT studio_equipment_pkey PRIMARY KEY (id);
  END IF;
END $$;

ALTER TABLE room_equipment
  ADD COLUMN IF NOT EXISTS equipment_model_id BIGINT REFERENCES equipment_models(id),
  ADD COLUMN IF NOT EXISTS position_label VARCHAR(64),
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE studio_equipment
  ADD COLUMN IF NOT EXISTS equipment_model_id BIGINT REFERENCES equipment_models(id),
  ADD COLUMN IF NOT EXISTS position_label VARCHAR(64),
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE equipment_evidence
  ADD COLUMN IF NOT EXISTS equipment_model_id BIGINT REFERENCES equipment_models(id),
  ADD COLUMN IF NOT EXISTS room_equipment_id BIGINT REFERENCES room_equipment(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS studio_equipment_id BIGINT REFERENCES studio_equipment(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS parsed_name VARCHAR(192),
  ADD COLUMN IF NOT EXISTS position_label VARCHAR(64),
  ADD COLUMN IF NOT EXISTS is_optional BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_equipment_models_equipment
  ON equipment_models (equipment_id, is_active, display_name);

CREATE INDEX IF NOT EXISTS idx_equipment_models_normalized
  ON equipment_models (lower(normalized_name));

CREATE UNIQUE INDEX IF NOT EXISTS idx_room_equipment_unique_assignment
  ON room_equipment (
    room_id,
    equipment_id,
    COALESCE(equipment_model_id, 0),
    COALESCE(position_label, '')
  );

CREATE UNIQUE INDEX IF NOT EXISTS idx_studio_equipment_unique_assignment
  ON studio_equipment (
    studio_id,
    equipment_id,
    COALESCE(equipment_model_id, 0),
    COALESCE(position_label, '')
  );

CREATE INDEX IF NOT EXISTS idx_room_equipment_model
  ON room_equipment (equipment_model_id)
  WHERE equipment_model_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_studio_equipment_model
  ON studio_equipment (equipment_model_id)
  WHERE equipment_model_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_equipment_evidence_model
  ON equipment_evidence (equipment_model_id)
  WHERE equipment_model_id IS NOT NULL;
