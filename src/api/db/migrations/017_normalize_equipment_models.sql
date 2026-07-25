-- 제조사·모델명이 같은 장비를 하나의 정규 모델로 관리한다.
-- JCM2000/DSL100/TSL100, MODX8/MODX8+처럼 실제로 다른 모델은 병합하지 않는다.

-- DW Collector 계열은 현재 데이터에서 Collector와 Collector's Series가
-- 같은 원문(“DW 콜렉터”)을 가리키므로 Collector's Series를 정규 모델로 사용한다.
DO $$
DECLARE
  canonical_id BIGINT;
  duplicate_id BIGINT;
BEGIN
  SELECT id INTO canonical_id FROM equipment_models WHERE slug = 'dw-collectors-series';
  SELECT id INTO duplicate_id FROM equipment_models WHERE slug = 'dw-collector';

  IF canonical_id IS NOT NULL AND duplicate_id IS NOT NULL THEN
    -- 근거 레코드가 기존 배치 ID를 참조하고 있으므로 먼저 canonical 배치로 옮긴다.
    UPDATE equipment_evidence ee
    SET room_equipment_id = target.id,
        equipment_model_id = canonical_id
    FROM room_equipment old
    JOIN room_equipment target
      ON target.room_id = old.room_id
     AND target.equipment_id = old.equipment_id
     AND target.equipment_model_id = canonical_id
     AND target.position_label IS NOT DISTINCT FROM old.position_label
    WHERE old.equipment_model_id = duplicate_id
      AND ee.room_equipment_id = old.id;

    UPDATE equipment_evidence ee
    SET studio_equipment_id = target.id,
        equipment_model_id = canonical_id
    FROM studio_equipment old
    JOIN studio_equipment target
      ON target.studio_id = old.studio_id
     AND target.equipment_id = old.equipment_id
     AND target.equipment_model_id = canonical_id
     AND target.position_label IS NOT DISTINCT FROM old.position_label
    WHERE old.equipment_model_id = duplicate_id
      AND ee.studio_equipment_id = old.id;

    DELETE FROM room_equipment old
    USING room_equipment target
    WHERE old.equipment_model_id = duplicate_id
      AND target.room_id = old.room_id
      AND target.equipment_id = old.equipment_id
      AND target.equipment_model_id = canonical_id
      AND target.position_label IS NOT DISTINCT FROM old.position_label;

    DELETE FROM studio_equipment old
    USING studio_equipment target
    WHERE old.equipment_model_id = duplicate_id
      AND target.studio_id = old.studio_id
      AND target.equipment_id = old.equipment_id
      AND target.equipment_model_id = canonical_id
      AND target.position_label IS NOT DISTINCT FROM old.position_label;

    UPDATE room_equipment SET equipment_model_id = canonical_id WHERE equipment_model_id = duplicate_id;
    UPDATE studio_equipment SET equipment_model_id = canonical_id WHERE equipment_model_id = duplicate_id;
    UPDATE equipment_evidence SET equipment_model_id = canonical_id WHERE equipment_model_id = duplicate_id;
    UPDATE equipment_evidence SET parsed_name = 'DW Collector''s Series' WHERE equipment_model_id = canonical_id;
    DELETE FROM equipment_models WHERE id = duplicate_id;
  END IF;
END $$;

-- 명백히 잘못되거나 불완전했던 제조사 표기를 바로잡는다. slug는 기존 배치와의
-- 연결 키이므로 유지하고, 표시명·검색명만 정규화한다.
UPDATE equipment_models
SET brand = 'PDP',
    display_name = 'PDP Concept Maple',
    normalized_name = 'pdp concept maple',
    updated_at = now()
WHERE slug = 'dw-pdp-concept-maple';
UPDATE equipment_evidence ee
SET parsed_name = 'PDP Concept Maple'
FROM equipment_models em
WHERE ee.equipment_model_id = em.id AND em.slug = 'dw-pdp-concept-maple';

UPDATE equipment_models
SET brand = 'Mackie',
    display_name = 'Mackie ProFX12',
    normalized_name = 'mackie profx12',
    updated_at = now()
WHERE slug = 'profx12';
UPDATE equipment_evidence ee
SET parsed_name = 'Mackie ProFX12'
FROM equipment_models em
WHERE ee.equipment_model_id = em.id AND em.slug = 'profx12';

UPDATE equipment_models
SET brand = 'D-Com',
    display_name = 'D-Com DMK 951 NC',
    normalized_name = 'd com dmk 951 nc',
    updated_at = now()
WHERE slug = 'd-com-dmk-951-nc';
UPDATE equipment_evidence ee
SET parsed_name = 'D-Com DMK 951 NC'
FROM equipment_models em
WHERE ee.equipment_model_id = em.id AND em.slug = 'd-com-dmk-951-nc';
