// PostHog 이벤트 계측.
//
// 이 서비스가 답해야 하는 질문은 하나다. "진입해서 예약으로 넘어가기까지 얼마나 걸리는가."
// 문제 정의서가 정한 성공 기준이 탐색 속도이기 때문이다(docs/01_기획/01_문제_정의서.md).
// 그래서 모든 이벤트에 세션 시작 이후 경과 시간(ms_since_open)과 그때까지의 조건 변경
// 횟수(filter_changes)를 함께 싣는다. 이 둘이 붙어 있으면 booking_click 하나만 봐도
// "몇 초 만에, 조건을 몇 번 바꿔서 예약까지 갔는가"가 복원된다.
//
// 키(VITE_POSTHOG_KEY)가 없으면 아무것도 전송하지 않는다. 로컬 개발은 자동으로 무동작.
import { Capacitor } from '@capacitor/core';

type Props = Record<string, unknown>;
type PostHog = typeof import('posthog-js').default;

const KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const HOST = (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';

const openedAt = Date.now();
let client: PostHog | null = null;
let filterChanges = 0;
// init 은 비동기(동적 import)라 그 전에 발생한 이벤트가 유실될 수 있다. 짧게 모아뒀다 흘려보낸다.
let pending: { event: string; props: Props }[] = [];

export async function initAnalytics(): Promise<void> {
  if (!KEY || client) return;

  const { default: posthog } = await import('posthog-js');
  posthog.init(KEY, {
    api_host: HOST,
    // SPA 라 페이지 전환이 없다. 자동 pageview 대신 아래 심은 이벤트만 본다.
    capture_pageview: false,
    // 아래 둘은 PostHog 기본값이 켜짐이다. 명시적으로 끈다.
    // 수집 범위가 개인정보처리방침(public/privacy.html)에 적은 내용과 어긋나면 안 되고,
    // 우리가 필요한 건 아래 track() 으로 직접 심은 이벤트뿐이다.
    autocapture: false,
    disable_session_recording: true,
  });
  client = posthog;

  for (const item of pending) posthog.capture(item.event, item.props);
  pending = [];
}

export function track(event: string, props: Props = {}): void {
  if (!KEY) return;

  if (event === 'filter_change') filterChanges += 1;

  const enriched: Props = {
    ...props,
    platform: Capacitor.getPlatform(),
    ms_since_open: Date.now() - openedAt,
    filter_changes: filterChanges,
  };

  if (!client) {
    pending.push({ event, props: enriched });
    return;
  }
  client.capture(event, enriched);
}
