-- end_time = '00:00' (자정)은 다음날 00:00를 의미하므로 부등호를 >=로 완화한다.
ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_check;
ALTER TABLE slots DROP CONSTRAINT IF EXISTS slots_end_after_start;
ALTER TABLE slots ADD CONSTRAINT slots_end_after_start
  CHECK (end_time > start_time OR end_time = '00:00:00');
