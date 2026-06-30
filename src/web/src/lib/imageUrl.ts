// 네이버 phinf CDN(pstatic.net)은 ?type=w{px} 등으로 리사이즈된 이미지를 준다.
// 44px 아바타에 원본(보통 1000px+)을 통째로 받던 걸 작은 이미지로 줄여 로딩을 던다.
//
// 주의: 리사이즈 타입 지원 여부가 호스트마다 달라, 잘못된 값이면 404 가 날 수 있다.
//       그래서 호출부(StudioRow)는 리사이즈 URL 로드 실패 시 원본 URL 로 자동
//       폴백한다. 이 함수는 "시도해볼 리사이즈 URL"만 만든다.
//
// - 네이버 CDN URL: 리사이즈 파라미터를 붙인다(기존 query 는 덮어씀).
// - 그 외(로컬 /studios/*.webp 등): 그대로 둔다.

const NAVER_CDN = 'pstatic.net';
const THUMB_W = 176; // 44px 아바타의 레티나(최대 ~4x) 대응.
const GALLERY_W = 480; // 가로 스크롤 갤러리 카드(~160px)의 레티나 대응.

export const STUDIO_FALLBACK_IMAGE_URL = '/studios/fallback-drum.jpg';

// 네이버 phinf CDN URL 에 width 리사이즈 파라미터를 붙인다(그 외 호스트는 원본 그대로).
// 호출부는 리사이즈 URL 로드 실패 시 원본 URL 로 폴백한다.
function resizedNaverUrl(url: string, width: number): string {
  try {
    // 상대경로(/studios/...)도 안전하게 파싱되도록 base 를 준다.
    const u = new URL(url, 'https://_');
    if (!u.hostname.includes(NAVER_CDN)) return url;
    u.search = `type=w${width}`;
    return u.toString();
  } catch {
    return url;
  }
}

export function thumbnailUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return resizedNaverUrl(url, THUMB_W);
}

/** 갤러리(가로 스크롤 사진 스트립)용 리사이즈 URL. 아바타보다 큰 폭을 받는다. */
export function galleryImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  return resizedNaverUrl(url, GALLERY_W);
}
