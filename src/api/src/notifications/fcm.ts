// FCM(파이어베이스 클라우드 메시징) 전송 래퍼.
// - 자격증명이 없으면 isConfigured()=false → dispatcher 는 dry-run(발송 없이 로그)만 한다. CI 안전.
// - firebase-admin 은 운영에서만 필요하므로 동적 import 한다(미설치 환경에서 typecheck/실행이 깨지지 않게).

export interface PushMessage {
  token: string;
  title: string;
  body: string;
  // 앱이 탭 시 라우팅에 쓰는 부가 데이터(모두 문자열이어야 한다 — FCM data 제약).
  data?: Record<string, string>;
}

export interface SendResult {
  token: string;
  success: boolean;
  // 토큰이 만료/무효일 때 true → 호출부에서 디바이스를 비활성화한다.
  invalidToken: boolean;
  error?: string;
}

// firebase-admin messaging 인스턴스(any) — 미설치 환경에서 컴파일 의존을 피하려고 느슨하게 둔다.
let messaging: any = null;
let initialized = false;

function readServiceAccount(): Record<string, unknown> | null {
  const raw = process.env.FCM_SERVICE_ACCOUNT;
  if (!raw) return null;
  // 원문 JSON 또는 base64 인코딩 JSON 둘 다 허용.
  const text = raw.trim().startsWith('{') ? raw : Buffer.from(raw, 'base64').toString('utf8');
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('FCM_SERVICE_ACCOUNT 파싱 실패(JSON 또는 base64 JSON 이어야 함)');
  }
}

async function init(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const serviceAccount = readServiceAccount();
  const useAdc = process.env.FCM_USE_ADC === 'true';
  if (!serviceAccount && !useAdc) return; // 미설정 → dry-run

  // 비리터럴 specifier 로 동적 import(컴파일 타임 모듈 해석 회피).
  const moduleName = 'firebase-admin';
  const imported: any = await import(moduleName);
  const admin = imported.default ?? imported;
  const credential = serviceAccount
    ? admin.credential.cert(serviceAccount)
    : admin.credential.applicationDefault();
  const app = admin.apps?.length ? admin.apps[0] : admin.initializeApp({ credential });
  messaging = admin.messaging(app);
}

export async function isConfigured(): Promise<boolean> {
  await init();
  return messaging !== null;
}

// FCM sendEach 는 한 번에 최대 500건. 호출부에서 청크하지만 여기서도 방어적으로 자른다.
const FCM_BATCH = 500;

export async function sendPush(messages: PushMessage[]): Promise<SendResult[]> {
  await init();
  if (messaging === null) {
    // dry-run: 발송한 셈 치고 성공으로 돌려준다(개발/미설정 환경).
    return messages.map((m) => ({ token: m.token, success: true, invalidToken: false }));
  }

  const results: SendResult[] = [];
  for (let i = 0; i < messages.length; i += FCM_BATCH) {
    const batch = messages.slice(i, i + FCM_BATCH);
    const payload = batch.map((m) => ({
      token: m.token,
      notification: { title: m.title, body: m.body },
      data: m.data ?? {},
    }));
    const response = await messaging.sendEach(payload);
    response.responses.forEach((r: any, idx: number) => {
      const code: string | undefined = r.error?.code;
      const message: string | undefined = r.error?.message;
      results.push({
        token: batch[idx].token,
        success: r.success === true,
        invalidToken:
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument',
        error: code && message ? `${code}: ${message}` : message,
      });
    });
  }
  return results;
}
