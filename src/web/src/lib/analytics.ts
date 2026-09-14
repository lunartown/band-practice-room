// 이벤트 계측. PostHog · GA4 · Meta Pixel 로 같은 이벤트를 동시에 보낸다.
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
// Meta Pixel 만 성격이 다르다. 앞의 둘은 "서비스를 어떻게 쓰는가"를 보려는 자체 분석이고,
// 픽셀은 인스타/페이스북 광고비가 실제 유입으로 이어졌는지 Meta 에 되돌려 알려주는
// 광고 성과 측정 장치다. 목적이 광고이므로 개인정보처리방침(public/privacy.html)에
// 별도로 고지했고, 웹에서만 동작시킨다 — 네이티브 앱 설치는 픽셀로 측정되지 않고
// (클릭 ID 가 스토어를 건너오지 못한다) WebView 유입이 웹 광고 성과에 섞이면 안 된다.
//
// 키(VITE_POSTHOG_KEY / VITE_GA_MEASUREMENT_ID / VITE_META_PIXEL_ID)가 없는 쪽은
// 아무것도 전송하지 않는다. 전부 없으면 완전 무동작이라 로컬 개발에는 영향이 없다.
//
// 개발·테스트 기기는 `?internal=1` 로 한 번 접속해 표시한다(해제는 `?internal=0`).
// 표시된 기기의 이벤트에는 is_internal 이 붙고 PostHog 사람 속성 $internal_or_test_user 가
// 켜져 대시보드의 테스트 계정 필터로 빠진다. 광고 학습을 오염시키지 않게 Meta Pixel 은 켜지 않는다.
import { Capacitor } from '@capacitor/core';

type Props = Record<string, unknown>;
type PostHog = typeof import('posthog-js').default;
type Sink = (event: string, props: Props) => void;

declare global {
  interface Window {
    dataLayer?: unknown[];
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

// Meta 가 배포하는 fbevents.js 가 채워 넣는 함수. 로드 전에는 큐에 쌓기만 한다.
interface FbqFn {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[];
  push?: unknown;
  loaded?: boolean;
  version?: string;
}

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const POSTHOG_HOST =
  (import.meta.env.VITE_POSTHOG_HOST as string | undefined) ?? 'https://us.i.posthog.com';
const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const META_PIXEL_ID = import.meta.env.VITE_META_PIXEL_ID as string | undefined;

const INTERNAL_STORAGE_KEY = 'hapjusil.analytics-internal.v1';
const isInternal = readInternalFlag();

// beacon 이벤트에 광고 파라미터를 싣기 위해 진입 주소를 기억한다(internal 파라미터는 위에서 지운 뒤).
const landingSearch = window.location.search;

// 픽셀은 웹 전용이고 내부 기기에서는 켜지 않는다. 위 주석 참고.
const metaPixelId = Capacitor.isNativePlatform() || isInternal ? undefined : META_PIXEL_ID;

const openedAt = Date.now();
let filterChanges = 0;

// 각 도구의 init 은 비동기(스크립트 로드)라 그 전에 발생한 이벤트가 유실될 수 있다.
// 준비된 곳에는 바로 보내고, 아직 안 붙은 곳을 위해 pending 에도 모아둔다.
// 모든 sink 가 붙으면 pending 은 비운다.
const expectedSinks = (POSTHOG_KEY ? 1 : 0) + (GA_ID ? 1 : 0) + (metaPixelId ? 1 : 0);
const sinks: Sink[] = [];
interface PendingEvent {
  event: string;
  props: Props;
  at: number;
  // SDK 가 붙기 전에 beacon 으로 PostHog 에 이미 보낸 이벤트. 아래 beacon 절 참고.
  sentByBeacon: boolean;
}

let pending: PendingEvent[] = [];
let posthogInstance: PostHog | null = null;
let posthogAttached = false;
let resultsReady = false;
let sessionRecordingScheduled = false;
let analyticsInitStarted = false;
let analyticsFallbackTimer: number | undefined;

// 첫 화면과 분석 SDK 다운로드·파싱이 경쟁하지 않게 한다. 사용자가 먼저 조작하면
// 즉시 초기화를 시작하고, 조작이 없는 방문도 결과 표시 8초 뒤에는 큐를 전송한다.
const ANALYTICS_FALLBACK_DELAY_MS = 8000;
const ANALYTICS_INTERACTION_EVENTS = ['pointerdown', 'keydown'] as const;

function addSink(sink: Sink, skipSentByBeacon = false): void {
  for (const item of pending) {
    if (skipSentByBeacon && item.sentByBeacon) continue;
    sink(item.event, item.props);
  }
  sinks.push(sink);
  if (sinks.length >= expectedSinks) pending = [];
}

export function initAnalytics(): void {
  if (expectedSinks === 0) return;

  if (POSTHOG_KEY) {
    document.addEventListener('visibilitychange', flushPendingOnHide);
    window.addEventListener('pagehide', flushPendingByBeacon);
  }

  for (const event of ANALYTICS_INTERACTION_EVENTS) {
    window.addEventListener(event, startAnalyticsOnInteraction, {
      capture: true,
      once: true,
      passive: true,
    });
  }
}

// 결과가 처음 그려지기 전에 세션 리플레이가 큰 DOM 을 스냅샷으로 만들면 LCP 와
// 입력을 막는다. 이벤트 수집은 즉시 유지하고, 녹화만 결과 표시 후 유휴 시점에 켠다.
export function markResultsReadyForAnalytics(): void {
  resultsReady = true;
  scheduleAnalyticsFallback();
  scheduleSessionRecording();
}

function startAnalyticsOnInteraction(): void {
  startAnalytics();
}

function scheduleAnalyticsFallback(): void {
  if (!resultsReady || analyticsInitStarted || analyticsFallbackTimer != null) return;
  analyticsFallbackTimer = window.setTimeout(startAnalytics, ANALYTICS_FALLBACK_DELAY_MS);
}

function startAnalytics(): void {
  if (analyticsInitStarted) return;
  analyticsInitStarted = true;

  if (analyticsFallbackTimer != null) {
    window.clearTimeout(analyticsFallbackTimer);
    analyticsFallbackTimer = undefined;
  }
  for (const event of ANALYTICS_INTERACTION_EVENTS) {
    window.removeEventListener(event, startAnalyticsOnInteraction, true);
  }

  void Promise.all([initPostHog(), initGa(), initMetaPixel()]);
}

function scheduleSessionRecording(): void {
  if (!resultsReady || !posthogInstance || sessionRecordingScheduled) return;
  sessionRecordingScheduled = true;

  const start = () => posthogInstance?.startSessionRecording();
  const idleWindow = window as Window & { requestIdleCallback?: typeof window.requestIdleCallback };
  if (typeof idleWindow.requestIdleCallback === 'function') {
    idleWindow.requestIdleCallback(start, { timeout: 3000 });
  } else {
    globalThis.setTimeout(start, 1000);
  }
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
    // 이벤트는 즉시 수집하되 세션 리플레이는 첫 결과 표시 뒤에 별도로 시작한다.
    // 거대한 초기 DOM 스냅샷이 LCP 를 막지 않으면서 이후 행동 리플레이는 유지한다.
    disable_session_recording: true,
    session_recording: {
      maskAllInputs: true,
      maskTextSelector: '[data-private]',
    },
    // beacon 을 보낸 뒤 돌아온 방문이면 같은 사람·세션으로 이어 붙인다. 저장된 익명 ID 가
    // 있을 때 distinctID 를 넘기면 그 ID 를 덮어쓰므로, 새로 만든 경우에만 넘긴다.
    ...(beaconIdentity?.used
      ? {
          bootstrap: {
            sessionID: beaconIdentity.sessionId,
            ...(beaconIdentity.newDistinctId ? { distinctID: beaconIdentity.distinctId } : {}),
          },
        }
      : {}),
  });

  if (isInternal) posthog.setPersonProperties({ $internal_or_test_user: true });

  posthogInstance = posthog;
  posthogAttached = true;
  addSink((event, props) => posthog.capture(event, props), true);
  scheduleSessionRecording();
}

// --- SDK 가 붙기 전에 떠난 방문 (beacon) ---
//
// SDK 초기화를 첫 입력이나 결과 표시 8초 뒤로 미루면서, 그 전에 조작 없이 떠난 방문은
// 이벤트가 하나도 전송되지 않았다. 가장 큰 이탈 구간이 통째로 빠지는 셈이라, 탭이 가려지거나
// 페이지를 떠나는 순간 쌓아둔 이벤트만 PostHog 수집 API 로 직접 보낸다. SDK 를 더 일찍
// 내려받지 않으므로 첫 화면 성능에는 영향이 없다.
//
// SDK 이벤트와 같은 사람·세션으로 묶이도록 저장된 PostHog 익명 ID 와 30분 이내 세션 ID 를
// 재사용하고, 없으면 SDK 와 같은 UUIDv7 형식으로 만든다. 기기 속성은 SDK 만큼 자세하지 않고
// 세션 리플레이도 없다.
const SESSION_IDLE_MS = 30 * 60 * 1000;
const CAMPAIGN_PARAMS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];

interface BeaconIdentity {
  distinctId: string;
  sessionId: string;
  newDistinctId: boolean;
  used: boolean;
}

let beaconIdentity: BeaconIdentity | null = null;

function flushPendingOnHide(): void {
  if (document.visibilityState === 'hidden') flushPendingByBeacon();
}

function flushPendingByBeacon(): void {
  if (!POSTHOG_KEY || posthogAttached || typeof navigator.sendBeacon !== 'function' || isLikelyBot()) return;

  const unsent = pending.filter((item) => !item.sentByBeacon);
  if (unsent.length === 0) return;

  const identity = getBeaconIdentity(POSTHOG_KEY);
  const base = beaconBaseProps(identity);
  const body = JSON.stringify({
    api_key: POSTHOG_KEY,
    batch: unsent.map((item) => ({
      event: item.event,
      timestamp: new Date(item.at).toISOString(),
      properties: { ...base, ...item.props, distinct_id: identity.distinctId },
    })),
  });

  // text/plain 이라 CORS preflight 없이 나간다. PostHog 수집 API 는 본문을 JSON 으로 읽는다.
  const queued = navigator.sendBeacon(`${POSTHOG_HOST}/batch/`, new Blob([body], { type: 'text/plain' }));
  if (!queued) return;

  identity.used = true;
  for (const item of unsent) item.sentByBeacon = true;
}

function getBeaconIdentity(token: string): BeaconIdentity {
  if (beaconIdentity) return beaconIdentity;

  const stored = readPostHogPersistence(token);
  const storedDistinctId = typeof stored?.distinct_id === 'string' ? stored.distinct_id : undefined;
  // posthog-js 는 세션을 [마지막 활동 시각, 세션 ID, 시작 시각] 으로 저장한다.
  const sesid = stored?.$sesid;
  const storedSessionId =
    Array.isArray(sesid) &&
    typeof sesid[0] === 'number' &&
    typeof sesid[1] === 'string' &&
    Date.now() - sesid[0] < SESSION_IDLE_MS
      ? sesid[1]
      : undefined;

  beaconIdentity = {
    distinctId: storedDistinctId ?? createUuidV7(),
    sessionId: storedSessionId ?? createUuidV7(),
    newDistinctId: storedDistinctId == null,
    used: false,
  };
  return beaconIdentity;
}

// posthog-js 기본 저장 방식(localStorage+cookie)의 키 이름을 따른다.
function readPostHogPersistence(token: string): Record<string, unknown> | null {
  const name = `ph_${token}_posthog`;
  try {
    const raw = localStorage.getItem(name) ?? readCookie(name);
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function readCookie(name: string): string | null {
  const prefix = `${name}=`;
  const found = document.cookie.split('; ').find((part) => part.startsWith(prefix));
  return found ? decodeURIComponent(found.slice(prefix.length)) : null;
}

function beaconBaseProps(identity: BeaconIdentity): Props {
  const params = new URLSearchParams(landingSearch);
  const campaign: Props = {};
  for (const key of CAMPAIGN_PARAMS) {
    const value = params.get(key);
    if (value) campaign[key] = value;
  }

  return {
    ...campaign,
    $session_id: identity.sessionId,
    $current_url: window.location.href,
    $host: window.location.host,
    $pathname: window.location.pathname,
    $referrer: document.referrer || '$direct',
    $referring_domain: referringDomain(),
    $raw_user_agent: navigator.userAgent,
    $device_type: deviceType(),
    $screen_width: window.screen.width,
    $screen_height: window.screen.height,
    // SDK 가 보낸 이벤트와 구분하기 위한 표시.
    $lib: 'hapjusil-beacon',
    // SDK 기본값(identified_only)처럼 익명 방문은 사람 프로필을 만들지 않는다.
    $process_person_profile: isInternal,
    ...(isInternal ? { $set: { $internal_or_test_user: true } } : {}),
  };
}

function referringDomain(): string {
  try {
    return document.referrer ? new URL(document.referrer).host : '$direct';
  } catch {
    return '$direct';
  }
}

// SDK 는 크롤러·자동화 브라우저의 이벤트를 버린다(사용자 에이전트·브랜드 목록·webdriver).
// beacon 도 같은 방문을 보내지 않아야 "금방 떠난 방문"에 봇이 섞이지 않는다.
const BOT_UA =
  /bot|crawl|spider|slurp|headless|lighthouse|pagespeed|facebookexternalhit|bingpreview|google-inspectiontool|google web preview|google favicon|googleweblight|mediapartners-google|feedfetcher|chatgpt-user|cypress|vercel-screenshot|prerender|phantomjs|puppeteer|playwright/i;

function isLikelyBot(): boolean {
  if (navigator.webdriver || BOT_UA.test(navigator.userAgent)) return true;
  const brands = (navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } }).userAgentData?.brands;
  return brands?.some((item) => BOT_UA.test(item.brand)) ?? false;
}

function deviceType(): string {
  const ua = navigator.userAgent;
  if (/iPad|Tablet/i.test(ua)) return 'Tablet';
  if (/Mobi|Android|iPhone|iPod/i.test(ua)) return 'Mobile';
  return 'Desktop';
}

// SDK 가 만드는 ID 와 같은 UUIDv7(앞 48비트가 ms 타임스탬프).
function createUuidV7(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  let ms = Date.now();
  for (let i = 5; i >= 0; i -= 1) {
    bytes[i] = ms % 256;
    ms = Math.floor(ms / 256);
  }
  bytes[6] = (bytes[6] & 0x0f) | 0x70;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
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

// Meta 가 이름을 미리 정해둔 표준 이벤트. 광고 관리자에서 별도 설정 없이 전환으로
// 잡히고 캠페인 최적화 목표로 바로 쓸 수 있어, 우리 이벤트 중 광고 성과에 해당하는
// 것만 표준 이름으로 한 번 더 보낸다. 나머지는 trackCustom 으로 우리 이름 그대로 간다
// (필요하면 Events Manager 에서 맞춤 전환으로 승격하면 된다).
//
// booking_click 이 이 서비스의 전환이다. 예약 페이지로 넘어간 시점이 우리가 광고로
// 만들어낼 수 있는 마지막 지점이고, 그 뒤 실제 예약은 외부 사이트에서 일어나 관측할 수 없다.
const META_STANDARD_EVENTS: Record<string, string> = {
  booking_click: 'Lead',
};

async function initMetaPixel(): Promise<void> {
  if (!metaPixelId) return;

  // Meta 가 제공하는 표준 부트스트랩. fbevents.js 가 로드되기 전 호출은 queue 에 쌓였다가
  // 로드 후 순서대로 처리된다. 원본 스니펫과 동작을 맞추기 위해 형태를 유지한다.
  const fbq: FbqFn = function (...args: unknown[]): void {
    if (fbq.callMethod) fbq.callMethod(...args);
    else fbq.queue?.push(args);
  };
  fbq.queue = [];
  fbq.loaded = true;
  fbq.version = '2.0';
  fbq.push = fbq;
  window.fbq = fbq;
  window._fbq = window._fbq ?? fbq;

  fbq('init', metaPixelId);
  // 광고 클릭으로 들어온 방문 자체를 알린다. 픽셀이 URL 의 fbclid 를 읽어 _fbc 쿠키로
  // 저장하는 것도 이 시점이라, 이후 이벤트가 어느 광고에서 왔는지 이어 붙는다.
  fbq('track', 'PageView');

  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://connect.facebook.net/en_US/fbevents.js';
  document.head.appendChild(script);

  addSink((event, props) => {
    const standard = META_STANDARD_EVENTS[event];
    if (standard) fbq('track', standard, toMetaProps(props));
    else fbq('trackCustom', event, toMetaProps(props));
  });
}

// 픽셀에는 광고 성과를 읽는 데 필요한 값만 보낸다. 개인을 식별할 수 있는 값은 애초에
// track() 에 실리지 않지만, 자체 분석용 지표(ms_since_open 등)까지 Meta 에 넘길 이유는 없다.
const META_ALLOWED_PROPS = new Set(['platform', 'area_count', 'studio_count', 'target']);

function toMetaProps(props: Props): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};

  for (const [key, value] of Object.entries(props)) {
    if (value == null || !META_ALLOWED_PROPS.has(key)) continue;
    out[key] =
      typeof value === 'number' || typeof value === 'boolean' ? value : String(value).slice(0, 100);
  }

  return out;
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
    ...(isInternal ? { is_internal: true } : {}),
  };

  if (sinks.length < expectedSinks) {
    pending.push({ event, props: enriched, at: Date.now(), sentByBeacon: false });
  }
  for (const sink of sinks) sink(event, enriched);
}

// `?internal=1` 이면 이 기기를 내부로 기억하고 `?internal=0` 이면 해제한다. 표시용 파라미터가
// 공유 링크에 딸려 나가지 않도록 주소에서는 바로 지운다.
function readInternalFlag(): boolean {
  try {
    const url = new URL(window.location.href);
    const flag = url.searchParams.get('internal');
    if (flag != null) {
      if (flag === '1') localStorage.setItem(INTERNAL_STORAGE_KEY, '1');
      if (flag === '0') localStorage.removeItem(INTERNAL_STORAGE_KEY);
      url.searchParams.delete('internal');
      window.history.replaceState(window.history.state, '', url.toString());
    }
    return flag === '1' || (flag !== '0' && localStorage.getItem(INTERNAL_STORAGE_KEY) === '1');
  } catch {
    return false;
  }
}
