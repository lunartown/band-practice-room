// 네이버 예약 비공개 GraphQL 호출 래퍼.
// 인증/쿠키는 필요 없고 모바일 UA + Referer 만 맞추면 된다.
const GRAPHQL_BASE = 'https://m.booking.naver.com/graphql';
const MOBILE_USER_AGENT =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const DEFAULT_TIMEOUT_MS = 20_000;

export class NaverApiError extends Error {}

type GraphqlResponse<T> = { data?: T; errors?: Array<{ message: string }> };

export async function naverGraphql<T>(params: {
  operationName: string;
  query: string;
  variables: unknown;
  referer: string;
  timeoutMs?: number;
}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), params.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  try {
    const res = await fetch(`${GRAPHQL_BASE}?opName=${params.operationName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        'User-Agent': MOBILE_USER_AGENT,
        Referer: params.referer,
      },
      body: JSON.stringify({
        operationName: params.operationName,
        query: params.query,
        variables: params.variables,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new NaverApiError(`HTTP ${res.status} (${params.operationName})`);
    }

    const json = (await res.json()) as GraphqlResponse<T>;
    if (json.errors?.length) {
      throw new NaverApiError(
        `GraphQL ${params.operationName}: ${json.errors.map((e) => e.message).join('; ')}`,
      );
    }
    if (json.data === undefined) {
      throw new NaverApiError(`GraphQL ${params.operationName}: 빈 응답`);
    }
    return json.data;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new NaverApiError(`timeout (${params.operationName})`);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export function bookingReferer(businessTypeId: number, businessId: string): string {
  return `https://m.booking.naver.com/booking/${businessTypeId}/bizes/${businessId}`;
}
