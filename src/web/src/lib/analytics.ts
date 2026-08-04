// 이벤트 계측. PostHog 와 GA4 로 같은 이벤트를 동시에 보낸다.
//
// 이 서비스가 답해야 하는 질문은 하나다. "진입해서 예약으로 넘어가기까지 얼마나 걸리는가."
// 문제 정의서가 정한 성공 기준이 탐색 속도이기 때문이다(docs/01_기획/01_문제_정의서.md).
// 그래서 모든 이벤트에 세션 시작 이후 경과 시간(ms_since_open)과 그때까지의 조건 변경
// 횟수(filter_changes)를 함께 싣는다. 이 둘이 붙어 있으면 booking_click 하나만 봐도
// "몇 초 만에, 조건을 몇 번 바꿔서 예약까지 갔는가"가 복원된다.
//
// 두 도구를 함께 쓰는 이유는 GA4 에 세션 리플레이가 없기 때문이다. 지표는 GA4 로 옮기되
// "어디서 막히는지"는 당분간 PostHog 리플레이로 계속 본다.
//
// 키(VITE_POSTHOG_KEY / VITE_GA_MEASUREMENT_ID)가 없는 쪽은 아무것도 전송하지 않는다.
// 둘 다 없으면 완전 무동작이라 로컬 개발에는 영향이 없다.
import { Capacitor } from '@capacitor/core';

type Props = Record<string, unknown>;
type PostHog = typeof import('posthog-js').default;
type Sink = (event: string, props: Props) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;

const openedAt = Date.now();
let filterChanges = 0;

// 각 도구의 init 은 비동기(스크립트 로드)라 그 전에 발생한 이벤트가 유실될 수 있다.
// 준비된 곳에는 바로 보내고, 아직 안 붙은 곳을 위해 pending 에도 모아둔다.
// 모든 sink 가 붙으면 pending 은 비운다.
const expectedSinks = (POSTHOG_KEY ? 1 : 0) + (GA_ID ? 1 : 0);
const sinks: Sink[] = [];
let pending: { event: string; props: Props }[] = [];

function addSink(sink: Sink): void {
  for (const item of pending) sink(item.event, item.props);
  sinks.push(sink);
  if (sinks.length >= expectedSinks) pending = [];
}

export async function initAnalytics(): Promise<void> {
  await Promise.all([initPostHog(), initGa()]);
}

async function initPostHog(): Promise<void> {
  if (!POSTHOG_KEY) return;

  const { default: posthog } = await import('posthog-js');
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // SPA 라 페이지 전환이 없다. 자동 pageview 대신 아래 심은 이벤트만 본다.
    capture_pageview: false,
    // 클릭 자동 수집은 끈다. 필요한 건 아래 track() 으로 직접 심은 이벤트뿐이고,
    // 수집 범위가 개인정보처리방침(public/privacy.html)에 적은 내용과 어긋나면 안 된다.
    autocapture: false,
    // 세션 리플레이는 켠다. 사용자가 어디서 막히는지는 이벤트 수치만으로는 안 보인다.
    // 다만 입력값은 전부 가린다 — 합주실 검색어 등이 녹화에 남을 이유가 없다.
    disable_session_recording: false,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-private]',
    },
  });

  addSink((event, props) => posthog.capture(event, props));
}

async function initGa(): Promise<void> {
  if (!GA_ID) return;

  window.dataLayer = window.dataLayer ?? [];
  // gtag.js 는 dataLayer 에 쌓인 arguments 객체를 그대로 읽는다. 배열로 바꿔 넣으면
  // 명령을 인식하지 못하므로 arguments 를 그대로 넘긴다.
  function gtag(..._args: unknown[]): void {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer?.push(arguments);
  }

  gtag('js', new Date());
  gtag('config', GA_ID, {
    // PostHog 와 마찬가지로 자동 pageview 는 끄고 직접 심은 이벤트만 본다.
    send_page_view: false,
    // GA4 는 기본으로 광고 개인화 신호와 Google 시그널을 켠다. 개인정보처리방침
    // (public/privacy.html)에 "광고 목적 추적·프로파일링을 하지 않는다"고 적어두었으므로
    // 두 가지 모두 끈 상태를 유지한다.
    allow_google_signals: false,
    allow_ad_personalization_signals: false,
    // 네이티브 WebView 의 주소는 capacitor://localhost 라 그대로 두면 GA4 리포트에
    // localhost 유입으로 뭉친다. 앱 트래픽임이 드러나는 경로를 직접 지정한다.
    ...(Capacitor.isNativePlatform()
      ? { page_location: `https://hapjusil.com/${Capacitor.getPlatform()}-app` }
      : {}),
  });

  // 스크립트 로드 전에 dataLayer 에 쌓아두면 로드 후 순서대로 처리된다.
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(script);

  addSink((event, props) => gtag('event', event, toGaProps(props)));
}

// GA4 는 이벤트 매개변수 이름 40자, 값 100자 제한이 있고, 문자열·숫자·불리언만 받는다.
// 그 밖의 값(배열·객체)은 리포트에서 쓸 수 없으므로 문자열로 눌러 보낸다.
function toGaProps(props: Props): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(props)) {
    if (value == null) continue;

    // GA4 에는 이미 "플랫폼"이라는 기본 측정기준이 있어 이름이 겹치면 리포트에서
    // 구분이 어렵다. 우리 값은 app_platform 으로 보낸다.
    const name = key === 'platform' ? 'app_platform' : key;

    if (typeof value === 'number' || typeof value === 'boolean') {
      out[name] = value;
    } else {
      out[name] = String(value).slice(0, 100);
    }
  }

  return out;
}

export function track(event: string, props: Props = {}): void {
  if (expectedSinks === 0) return;

  if (event === 'filter_change') filterChanges += 1;

  const enriched: Props = {
    ...props,
    platform: Capacitor.getPlatform(),
    ms_since_open: Date.now() - openedAt,
    filter_changes: filterChanges,
  };

  if (sinks.length < expectedSinks) pending.push({ event, props: enriched });
  for (const sink of sinks) sink(event, enriched);
}
