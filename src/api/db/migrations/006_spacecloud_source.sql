-- 멀티 예약채널 지원: sources.code 컬럼 + 스페이스클라우드 소스 등록.
-- code 는 스크래퍼/예약링크 빌더가 소스 종류를 안정적으로 분기하는 키다(이름은 표시용).

ALTER TABLE sources ADD COLUMN IF NOT EXISTS code VARCHAR(32);

-- 기존 네이버 소스(id=1) 백필
UPDATE sources SET code = 'naver' WHERE id = 1 AND (code IS NULL OR code = '');

-- 스페이스클라우드 소스. 가용성 API 는 개인 토큰이 필요할 수 있어 credential_key 로 env 키를 가리킨다.
INSERT INTO sources (id, name, url, auth_kind, credential_key, is_active, code)
VALUES (2, '스페이스클라우드', 'https://www.spacecloud.kr/', 'MANUAL_SESSION', 'SPACECLOUD_API_TOKEN', true, 'spacecloud')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  auth_kind = EXCLUDED.auth_kind,
  credential_key = EXCLUDED.credential_key,
  is_active = EXCLUDED.is_active,
  code = EXCLUDED.code;

-- 수동 id 삽입 뒤 시퀀스 보정(다음 INSERT 충돌 방지).
SELECT setval(
  pg_get_serial_sequence('sources', 'id'),
  GREATEST((SELECT MAX(id) FROM sources), 1)
);
