// 앱 설치를 식별하는 영속 UUID.
// FCM 토큰은 회전(재발급)되는 값이라 서버 디바이스 키로 쓰지 않고,
// 설치 ID 를 자연키 삼아 토큰은 갱신 가능한 속성으로 서버에 올린다.
const STORAGE_KEY = 'hapjusil.install-id.v1';

let cached: string | null = null;

export function getInstallId(): string {
  if (cached) return cached;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      cached = stored;
      return stored;
    }
  } catch {
    // 저장소가 막혀도 세션 한정 임시 ID 로 동작한다.
  }
  const created = createUuid();
  try {
    localStorage.setItem(STORAGE_KEY, created);
  } catch {
    // 위와 동일: 다음 실행에서 새 ID 가 되지만 서버가 토큰으로 옛 행을 회수하므로 안전하다.
  }
  cached = created;
  return created;
}

function createUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
