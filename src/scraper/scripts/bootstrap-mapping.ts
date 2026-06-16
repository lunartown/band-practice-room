/**
 * 네이버 예약 bizItems API로 방↔bizItemId 매핑을 재부트스트랩한다.
 *
 * 현재 DB의 room_sources.external_key 는 네이버 실제 bizItemId 가 아니며(스튜디오 자체 코드),
 * 방 이름도 어긋난다("A1룸" vs 네이버 "A1"). 이 스크립트는 읽기 전용으로
 *   - 각 studio_source 의 businessId/businessTypeId 를 추출하고
 *   - bizItems 쿼리로 네이버의 실제 방 목록(id+name)을 받아
 *   - DB 방과 이름 정규화 매칭을 시도해
 * 리포트(/tmp/naver-mapping-report.json)와 콘솔 요약을 만든다. DB는 수정하지 않는다.
 *
 * 실행: cd src/scraper && npx tsx scripts/bootstrap-mapping.ts
 */
import { query, end } from '../src/db.js';

const GRAPHQL_URL = 'https://m.booking.naver.com/graphql?opName=bizItems';
const MOBILE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const BIZ_ITEMS_QUERY =
  'query bizItems($input: BizItemsParams) { bizItems(input: $input) { id name bookingTimeUnitCode } }';

interface StudioSourceRow {
  studio_source_id: string;
  studio_id: string;
  studio_name: string;
  external_key: string | null;
  url: string | null;
}

interface DbRoom {
  room_id: string;
  name: string;
  room_external_key: string | null;
}

interface NaverBizItem {
  bizItemId: string;
  name: string;
  bookingTimeUnitCode: string;
}

// businessTypeId 는 URL 의 /booking/{N}/ 세그먼트에서 온다 (보통 10, 브라운=13).
function parseBusinessTypeId(url: string | null): number | null {
  const m = url?.match(/\/booking\/(\d+)\//);
  return m ? Number(m[1]) : null;
}

function parseBusinessId(externalKey: string | null, url: string | null): string | null {
  if (externalKey) return externalKey;
  const m = url?.match(/\/bizes\/(\d+)/);
  return m ? m[1] : null;
}

// "A1룸", "Room A", "1번방" 등 표기 차이를 흡수하는 느슨한 정규화 키.
// 네이버 이름엔 "[개강특가]", "(최대 인원 8명)" 같은 프로모션/안내 장식이 붙으므로 먼저 제거한다.
function normalizeRoomName(name: string): string {
  // 안내/프로모션 장식 제거. 단 이름 전체가 괄호인 "[A룸]" 같은 경우는
  // 통째로 지워지면 빈 문자열이 되므로, 그때는 괄호 문자만 제거해 내용을 살린다.
  const stripped = name
    .replace(/\[[^\]]*\]/g, '')
    .replace(/\([^)]*\)/g, '')
    .replace(/（[^）]*）/g, '')
    .trim();
  const base = stripped || name.replace(/[[\]()（）]/g, '');
  return base
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/룸$|room|booth|부스/g, '')
    .replace(/번방$|번룸$/, '')
    .trim();
}

// DB 방 이름의 핵심 토큰(예: "1번방"→"1번", "A룸"→"a")이 네이버 이름에 유일하게
// 포함되면 매칭으로 간주하는 폴백. 지점명 접두("강동 1번방")나 접미 활동명을 흡수한다.
function uniqueContainmentMatch(
  dbNorm: string,
  candidates: NaverBizItem[],
): NaverBizItem[] | null {
  if (dbNorm.length < 2) return null; // 너무 짧으면 오매칭 위험
  const hits = candidates.filter((it) => normalizeRoomName(it.name).includes(dbNorm));
  return hits.length ? hits : null;
}

async function fetchBizItems(businessId: string): Promise<NaverBizItem[]> {
  const res = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': MOBILE_UA,
      Referer: `https://m.booking.naver.com/booking/10/bizes/${businessId}`,
    },
    body: JSON.stringify({
      operationName: 'bizItems',
      query: BIZ_ITEMS_QUERY,
      variables: { input: { businessId } },
    }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = (await res.json()) as {
    data?: { bizItems?: Array<{ id: string; name: string; bookingTimeUnitCode: string }> };
    errors?: unknown;
  };
  if (json.errors) throw new Error(`GraphQL: ${JSON.stringify(json.errors).slice(0, 200)}`);
  // id 는 "5587861_{...}" 형태(Apollo 캐시 복합키)라 숫자 접두부만 실제 bizItemId.
  return (json.data?.bizItems ?? []).map((it) => ({
    bizItemId: String(it.id).split('_')[0],
    name: it.name,
    bookingTimeUnitCode: it.bookingTimeUnitCode,
  }));
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const sources = await query<StudioSourceRow>(`
    SELECT ss.id AS studio_source_id, ss.studio_id, st.name AS studio_name,
           ss.external_key, ss.url
    FROM studio_sources ss
    INNER JOIN studios st ON st.id = ss.studio_id
    ORDER BY ss.id
  `);

  const report: any[] = [];
  let okCount = 0;
  let errCount = 0;

  for (const src of sources.rows) {
    const businessId = parseBusinessId(src.external_key, src.url);
    const businessTypeId = parseBusinessTypeId(src.url);
    const dbRooms = (
      await query<DbRoom>(
        `SELECT r.id AS room_id, r.name, rs.external_key AS room_external_key
         FROM rooms r LEFT JOIN room_sources rs ON rs.room_id = r.id
         WHERE r.studio_id = $1 AND r.is_active = true ORDER BY r.id`,
        [src.studio_id],
      )
    ).rows;

    const entry: any = {
      studio: src.studio_name,
      businessId,
      businessTypeId,
      matched: [] as any[],
      dbRoomsUnmatched: [] as string[],
      naverRoomsMissingInDb: [] as any[],
    };

    if (!businessId) {
      entry.error = 'businessId 추출 실패';
      report.push(entry);
      errCount++;
      continue;
    }

    let naverItems: NaverBizItem[];
    try {
      naverItems = await fetchBizItems(businessId);
    } catch (e) {
      entry.error = e instanceof Error ? e.message : String(e);
      report.push(entry);
      errCount++;
      await sleep(400);
      continue;
    }

    // 같은 정규화 키에 네이버 아이템이 여러 개일 수 있다(요금제 변형) → 배열로 그룹화.
    const naverByNorm = new Map<string, NaverBizItem[]>();
    for (const it of naverItems) {
      const k = normalizeRoomName(it.name);
      (naverByNorm.get(k) ?? naverByNorm.set(k, []).get(k)!).push(it);
    }
    const usedNaver = new Set<string>();

    for (const room of dbRooms) {
      const norm = normalizeRoomName(room.name);
      let hits = naverByNorm.get(norm) ?? null;
      let via = 'exact';
      if (!hits) {
        const remaining = naverItems.filter((it) => !usedNaver.has(it.bizItemId));
        hits = uniqueContainmentMatch(norm, remaining);
        via = 'contains';
      }
      if (hits && hits.length) {
        hits.forEach((h) => usedNaver.add(h.bizItemId));
        entry.matched.push({
          dbName: room.name,
          bizItemIds: hits.map((h) => h.bizItemId),
          naverNames: hits.map((h) => h.name),
          unit: hits[0].bookingTimeUnitCode,
          oldExternalKey: room.room_external_key,
          variantCount: hits.length, // >1 이면 요금제 변형 다수
          via, // exact | contains (contains 는 사람 검토 권장)
        });
      } else {
        entry.dbRoomsUnmatched.push(room.name);
      }
    }
    entry.naverRoomsMissingInDb = naverItems
      .filter((it) => !usedNaver.has(it.bizItemId))
      .map((it) => ({ naverName: it.name, bizItemId: it.bizItemId, unit: it.bookingTimeUnitCode }));

    report.push(entry);
    okCount++;
    const flag =
      entry.dbRoomsUnmatched.length || entry.naverRoomsMissingInDb.length ? ' ⚠️' : '';
    console.log(
      `[${businessId}] ${src.studio_name}: 매칭 ${entry.matched.length}, ` +
        `DB미매칭 ${entry.dbRoomsUnmatched.length}, 네이버에만 ${entry.naverRoomsMissingInDb.length}${flag}`,
    );
    await sleep(300); // 가벼운 레이트리밋
  }

  const { writeFileSync } = await import('node:fs');
  writeFileSync('/tmp/naver-mapping-report.json', JSON.stringify(report, null, 2));
  console.log(
    `\n완료: 성공 ${okCount}, 실패 ${errCount}. 상세 → /tmp/naver-mapping-report.json`,
  );
  await end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
