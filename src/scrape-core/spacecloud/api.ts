// 스페이스클라우드 비공개 REST API 호출 래퍼.
// 가용성 조회는 개인 토큰(Authorization)이 필요할 수 있어, 있으면 env 에서 주입한다.
//   SPACECLOUD_API_TOKEN = 로그인 세션의 JWT (절대 커밋 금지, CI 시크릿으로 주입)
const API_BASE = 'https://api.spacecloud.kr';
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36';

const DEFAULT_TIMEOUT_MS = 20_000;

export class SpaceCloudApiError extends Error {}

export async function spacecloudGet<T>(path: string, timeoutMs = DEFAULT_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'User-Agent': USER_AGENT,
    Origin: 'https://www.spacecloud.kr',
    Referer: 'https://www.spacecloud.kr/',
  };
  const token = process.env.SPACECLOUD_API_TOKEN;
  if (token) headers.Authorization = token;

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });

    if (!res.ok) {
      // 401/403 은 classifyError 가 AUTH_FAILED 로 잡도록 상태코드를 메시지에 포함한다.
      throw new SpaceCloudApiError(`HTTP ${res.status} (${path})`);
    }

    return (await res.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new SpaceCloudApiError(`timeout (${path})`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
