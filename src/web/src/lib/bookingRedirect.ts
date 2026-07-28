const BOOKING_REDIRECT_PATH = '/booking/redirect';
const PUBLIC_WEB_ORIGIN = 'https://hapjusil.com';

export interface BookingRedirectTarget {
  url: string;
  label: string | null;
}

/**
 * 예약 링크를 바로 열지 않고 합주실닷컴의 외부 이동 안내 화면을 거치게 한다.
 * Capacitor의 로컬 origin은 외부 브라우저에서 열 수 없으므로 공개 웹 주소를 사용한다.
 */
export function bookingRedirectHref(bookingUrl: string | null, label: string): string {
  if (!bookingUrl) return '#';

  const params = new URLSearchParams({ to: bookingUrl, label });
  const isWebOrigin = window.location.protocol === 'http:' || window.location.protocol === 'https:';
  const origin = isWebOrigin ? '' : PUBLIC_WEB_ORIGIN;
  return `${origin}${BOOKING_REDIRECT_PATH}?${params.toString()}`;
}

export function readBookingRedirectTarget(search: string): BookingRedirectTarget | null {
  const params = new URLSearchParams(search);
  const rawUrl = params.get('to');
  if (!rawUrl) return null;

  try {
    const url = new URL(rawUrl);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;

    return {
      url: url.toString(),
      label: params.get('label'),
    };
  } catch {
    return null;
  }
}

export function isBookingRedirectPath(pathname: string): boolean {
  return pathname === BOOKING_REDIRECT_PATH;
}
