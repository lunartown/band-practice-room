// 네이버 phinf CDN(pstatic.net)은 ?type=f{w}_{h} 로 중앙 크롭·리사이즈된
// 썸네일을 내려준다. 44px 아바타에 원본(보통 1000px+)을 통째로 받던 것을
// 작은 정사각 썸네일로 바꿔 로딩을 줄인다.
//
// - 네이버 CDN URL: 리사이즈 파라미터를 붙인다(기존 query 는 덮어씀).
// - 그 외(로컬 /studios/*.jpg 등): 그대로 둔다.

const NAVER_CDN = 'pstatic.net';
const THUMB_PX = 176; // 44px 아바타의 레티나(최대 ~4x) 대응. 정사각 크롭.

export function thumbnailUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    // 상대경로(/studios/...)도 안전하게 파싱되도록 base 를 준다.
    const u = new URL(url, 'https://_');
    if (!u.hostname.includes(NAVER_CDN)) return url;
    u.search = `type=f${THUMB_PX}_${THUMB_PX}`;
    return u.toString();
  } catch {
    return url;
  }
}
