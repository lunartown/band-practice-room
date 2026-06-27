/**
 * 운영 알림. ALERT_WEBHOOK_URL(Discord/Slack 호환 incoming webhook)이 있으면
 * 메시지를 POST 한다. 없으면 콘솔 경고만 남긴다(로컬/개발).
 * 알림 실패가 수집 자체를 막지 않도록 예외는 모두 삼킨다.
 */
export async function sendAlert(text: string): Promise<void> {
  const url = process.env.ALERT_WEBHOOK_URL;
  if (!url) {
    console.warn(`[alert] (웹훅 미설정) ${text}`);
    return;
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // Discord 는 content, Slack 은 text 키를 쓴다. 둘 다 넣어 호환.
      body: JSON.stringify({ content: text, text }),
    });
    if (!res.ok) {
      console.error(`[alert] 전송 실패: HTTP ${res.status}`);
    }
  } catch (err) {
    console.error('[alert] 전송 중 오류:', err);
  }
}
