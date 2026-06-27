-- rooms 에 (studio_id, name) 자연키 UNIQUE 추가.
-- 시드(002_studios.sql)가 TRUNCATE 없이 ON CONFLICT (studio_id, name) 로 방을 upsert 하려면
-- 이 제약이 필요하다. 한 합주실 안에서 방 이름은 유일하므로 의미상으로도 옳다.
-- migrate 는 매번 전체 재실행되므로 IF NOT EXISTS 가드로 idempotent 하게 만든다.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'rooms_studio_id_name_key'
  ) THEN
    ALTER TABLE rooms ADD CONSTRAINT rooms_studio_id_name_key UNIQUE (studio_id, name);
  END IF;
END $$;
