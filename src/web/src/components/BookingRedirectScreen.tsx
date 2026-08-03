import { useEffect, useMemo } from 'react';
import { readBookingRedirectTarget } from '../lib/bookingRedirect';

const REDIRECT_DELAY_MS = 1100;

export function BookingRedirectScreen() {
  const target = useMemo(() => readBookingRedirectTarget(window.location.search), []);

  useEffect(() => {
    document.title = target ? '예약 페이지로 이동 중 | 합주실닷컴' : '예약 페이지 오류 | 합주실닷컴';
    if (!target) return;

    const timer = window.setTimeout(() => {
      window.location.replace(target.url);
    }, REDIRECT_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [target]);

  return (
    <section className="booking-redirect-screen" aria-live="polite">
      <img className="booking-redirect-logo" src="/hapjushil-logo.png" alt="" aria-hidden width={76} height={76} />

      {target ? (
        <div className="booking-redirect-content" role="status">
          <div className="booking-redirect-spinner" aria-hidden>
            <span />
            <span />
            <span />
          </div>
          <h1>외부 예약 페이지로 이동 중이에요</h1>
          <p>
            {target.label ? <strong>{target.label}</strong> : '선택하신 합주실'} 예약을 위해<br />
            합주실닷컴을 나가 외부 사이트로 이동합니다
          </p>
          <a className="booking-redirect-link" href={target.url} rel="noreferrer">
            바로 이동하기
          </a>
        </div>
      ) : (
        <div className="booking-redirect-content booking-redirect-error" role="alert">
          <h1>예약 페이지를 열 수 없어요</h1>
          <p>
            예약 주소가 올바르지 않습니다<br />
            합주실닷컴으로 돌아가 다시 시도해 주세요
          </p>
          <a className="booking-redirect-link" href="/">
            합주실닷컴으로 돌아가기
          </a>
        </div>
      )}
    </section>
  );
}
