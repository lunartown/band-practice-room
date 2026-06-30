import { NaverReservationScraper } from './naver/scraper.js';
import { SpaceCloudScraper } from './spacecloud/scraper.js';
import type { ScrapeRoom, StudioScrapeResult } from './types.js';

// 한 스튜디오·소스를 수집하기 위한 정규화 입력. DB 행 모양에 의존하지 않으므로
// cron 워커(scraper)와 온디맨드 수동 갱신(api)이 같은 디스패처를 공유한다.
export interface BuildScraperInput {
  // sources.code ('naver' | 'spacecloud' | null). null 이면 url 호스트로 추정.
  sourceCode: string | null;
  studioName: string;
  url: string | null; // studio_sources.url
  externalKey: string | null; // studio_sources.external_key (네이버=bizId)
  rooms: Array<{ name: string; externalKey: string }>;
  studioSourceId: string;
  debug?: boolean;
}

export type BuildScraperResult =
  | { scrape: (dateFrom: string, dateTo: string) => Promise<StudioScrapeResult> }
  | { error: string };

// URL 의 /booking/{N}/ 세그먼트가 businessTypeId (보통 10, 일부 13).
function parseBusinessTypeId(url: string): number | null {
  const m = url.match(/\/booking\/(\d+)\//);
  return m ? Number(m[1]) : null;
}

// source.code 가 없는(마이그레이션 전) DB 대비: URL 호스트로 소스 종류를 추정.
function resolveSourceCode(input: BuildScraperInput): string {
  if (input.sourceCode) return input.sourceCode;
  if (input.url?.includes('spacecloud')) return 'spacecloud';
  return 'naver';
}

// 소스 종류별로 적절한 스크래퍼를 구성한다. 영구 실패할 설정 오류는 { error } 로 돌려준다.
export function buildStudioScraper(input: BuildScraperInput): BuildScraperResult {
  const debug = input.debug ?? false;
  const code = resolveSourceCode(input);

  if (code === 'spacecloud') {
    const scRooms = [];
    for (const r of input.rooms) {
      // external_key = "productId:reservationTypeId"
      const [productId, reservationTypeId] = r.externalKey.split(':');
      if (!productId || !reservationTypeId) {
        return {
          error: `스페이스클라우드 external_key 형식 오류(productId:reservationTypeId): ${r.externalKey}`,
        };
      }
      scRooms.push({ roomName: r.name, productId, reservationTypeId });
    }
    const scraper = new SpaceCloudScraper(
      { studioName: input.studioName, rooms: scRooms },
      { debug },
    );
    return { scrape: (from, to) => scraper.scrape(from, to) };
  }

  // 기본: 네이버
  if (!input.url || !input.externalKey) {
    return { error: 'studio_source URL/식별자가 없습니다(naver)' };
  }
  const businessTypeId = parseBusinessTypeId(input.url);
  if (businessTypeId === null) {
    return { error: `URL에서 businessTypeId 파싱 실패: ${input.url}` };
  }
  const scrapeRooms: ScrapeRoom[] = input.rooms.map((r) => ({
    roomName: r.name,
    externalKey: r.externalKey,
  }));
  const scraper = new NaverReservationScraper({ debug });
  return {
    scrape: (from, to) =>
      scraper.scrape(
        {
          studioSourceId: input.studioSourceId,
          studioName: input.studioName,
          businessId: input.externalKey as string,
          businessTypeId,
          rooms: scrapeRooms,
        },
        from,
        to,
      ),
  };
}
