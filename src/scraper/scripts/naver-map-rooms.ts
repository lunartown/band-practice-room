/**
 * 네이버 스튜디오의 방(rooms)을 네이버 bizItem id 에 매핑(room_sources)한다.
 * room_sources 가 비어 있어 "매핑된 방이 없습니다(room_sources)" 로 영구 실패하던
 * 스튜디오를 살리기 위한 부트스트랩/보정용.
 *
 * 네이버는 한 물리 방을 여러 bizItem(평일특가/심야/일반·회원 등)으로 쪼개 파는 경우가 많고,
 * room_sources 는 (room_id, source_id) UNIQUE 라 방당 1개만 매핑할 수 있다.
 * → 방 이름과 매칭되는 후보 아이템들의 "실제 스케줄"을 떠보고, 가용 슬롯이 가장 많이
 *   나오는 아이템을 대표로 고른다.
 *
 * 사용:
 *   cd src/scraper
 *   DATABASE_URL='<neon>' npx tsx scripts/naver-map-rooms.ts            # 미리보기
 *   DATABASE_URL='<neon>' npx tsx scripts/naver-map-rooms.ts --apply    # 실제 기입
 *   DATABASE_URL='<neon>' npx tsx scripts/naver-map-rooms.ts --studios 34,35,41
 */
import { query, end } from '../src/db.js';
import { fetchBizItems, fetchHourlySchedule, type NaverBizItem } from '../../scrape-core/naver/client.js';
import { toAvailabilitySlots } from '../../scrape-core/naver/mapper.js';

const NAVER_SOURCE_ID = '1';
const SPAN_DAYS = 6;

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}
const doApply = process.argv.includes('--apply');
const onlyStudios = (arg('--studios') ?? '').split(',').map((s) => s.trim()).filter(Boolean);

function norm(s: string): string {
  return s.toLowerCase().replace(/\s+/g, '').replace(/[()[\]]/g, '').replace(/룸|room|호실/g, '');
}
function parseBusinessTypeId(url: string): number | null {
  const m = url.match(/\/booking\/(\d+)\//);
  return m ? Number(m[1]) : null;
}
function kstDate(offsetDays: number): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 3600_000 + offsetDays * 86400_000);
  return kst.toISOString().slice(0, 10);
}

interface Target { studio_id: string; slug: string; business_id: string; url: string; }
interface RoomRow { id: string; name: string; }

async function probeItem(
  businessId: string,
  businessTypeId: number,
  item: NaverBizItem,
  from: string,
  to: string,
): Promise<{ avail: number; total: number }> {
  try {
    const hourly = await fetchHourlySchedule({ businessId, businessTypeId, bizItemId: item.bizItemId, dateFrom: from, dateTo: to });
    const slots = toAvailabilitySlots(hourly, item.name);
    return { avail: slots.filter((s) => s.status === 'available').length, total: slots.length };
  } catch {
    return { avail: -1, total: -1 };
  }
}

async function main() {
  const params: unknown[] = [];
  let filter = '';
  if (onlyStudios.length) { params.push(onlyStudios); filter = `AND s.id = ANY($1)`; }
  const targets = (await query<Target>(
    `SELECT s.id AS studio_id, s.slug, ss.external_key AS business_id, ss.url
     FROM studios s
     JOIN studio_sources ss ON ss.studio_id = s.id AND ss.source_id = ${NAVER_SOURCE_ID}
     WHERE s.is_active = true ${filter}
       AND EXISTS (SELECT 1 FROM rooms r WHERE r.studio_id = s.id AND r.is_active)
       AND NOT EXISTS (
         SELECT 1 FROM room_sources rs JOIN rooms r ON r.id = rs.room_id
         WHERE r.studio_id = s.id AND rs.source_id = ${NAVER_SOURCE_ID})
     ORDER BY s.id`, params)).rows;

  const from = kstDate(0), to = kstDate(SPAN_DAYS);
  console.log(`[map] 대상 ${targets.length}곳 / 스케줄 ${from}~${to} / apply=${doApply}\n`);

  const dead: string[] = [];
  const review: string[] = [];
  let mappedRooms = 0, totalRooms = 0;

  for (const t of targets) {
    const businessTypeId = parseBusinessTypeId(t.url);
    if (businessTypeId === null) { review.push(`${t.slug}: businessTypeId 파싱 실패`); continue; }

    let items: NaverBizItem[];
    try { items = await fetchBizItems({ businessId: t.business_id, businessTypeId }); }
    catch (e) { review.push(`${t.slug}: bizItems 조회 실패 — ${e instanceof Error ? e.message : e}`); continue; }

    console.log(`■ ${t.slug} (studio ${t.studio_id}, biz ${t.business_id}/${businessTypeId}) — 네이버 아이템 ${items.length}개`);
    if (items.length === 0) {
      console.log(`   ✗ 네이버 business 가 비어있음/소멸 → 새 businessId 필요`);
      dead.push(`${t.slug} (studio ${t.studio_id}, biz ${t.business_id})`);
      console.log('');
      continue;
    }

    const rooms = (await query<RoomRow>(
      `SELECT id, name FROM rooms WHERE studio_id = $1 AND is_active ORDER BY id`, [t.studio_id])).rows;
    totalRooms += rooms.length;
    const used = new Set<string>();

    for (const r of rooms) {
      // 후보: 정확일치 → 정규화 substring → (방이 하나뿐이면) 전체
      let cands = items.filter((it) => !used.has(it.bizItemId) && (it.name === r.name || norm(it.name).includes(norm(r.name)) || norm(r.name).includes(norm(it.name))));
      if (cands.length === 0 && rooms.length === 1) cands = items.filter((it) => !used.has(it.bizItemId));

      if (cands.length === 0) { console.log(`   ✗ "${r.name}" → 후보 아이템 없음`); review.push(`${t.slug} / "${r.name}": 이름 매칭 실패`); continue; }

      // 후보별 스케줄 실측. 대표 아이템 = "방의 실제 영업 캘린더 전체"를 담은 것.
      // → 전체 unit 수(total, 커버리지)가 넓은 걸 우선. 프로모션/회원/심야 같은 한정상품은
      //   좁은 시간대만 담아 저녁·주말이 통째로 빠지므로 패널티로 후순위.
      const promo = (n: string) => /특가|할인|심야|새벽|회원|대관|이벤트|creative/i.test(n) ? 1 : 0;
      const scored = [];
      for (const it of cands) { const p = await probeItem(t.business_id, businessTypeId, it, from, to); scored.push({ it, pen: promo(it.name), ...p }); }
      scored.sort((a, b) => a.pen - b.pen || b.total - a.total || b.avail - a.avail);
      const best = scored[0];
      const detail = scored.map((s) => `${s.it.bizItemId}:"${s.it.name}"(avail ${s.avail}/${s.total}${s.pen ? ',한정' : ''})`).join('  ');
      console.log(`   • "${r.name}" 후보: ${detail}`);

      if (!best || best.total <= 0) { console.log(`   ✗ "${r.name}" → 가용 스케줄 없음 (대표 선정 보류)`); review.push(`${t.slug} / "${r.name}": 후보는 있으나 스케줄 0`); continue; }

      used.add(best.it.bizItemId);
      console.log(`   ✓ "${r.name}" → ${best.it.bizItemId} ("${best.it.name}") avail ${best.avail}`);
      mappedRooms++;

      if (doApply) {
        await query(
          `INSERT INTO room_sources (room_id, source_id, external_key, mapping_status, last_verified_at)
           VALUES ($1, ${NAVER_SOURCE_ID}, $2, 'ACTIVE', NOW())
           ON CONFLICT (room_id, source_id)
           DO UPDATE SET external_key = EXCLUDED.external_key, mapping_status = 'ACTIVE', last_verified_at = NOW()`,
          [r.id, best.it.bizItemId]);
      }
    }

    if (doApply) {
      await query(
        `UPDATE scrape_jobs j SET status='PENDING', attempts=0, run_after=NULL, last_error=NULL, updated_at=NOW()
         FROM studio_sources ss WHERE j.studio_source_id = ss.id AND ss.studio_id = $1 AND j.status='FAILED'`,
        [t.studio_id]);
      console.log(`   → 잡 재활성화`);
    }
    console.log('');
  }

  console.log(`[map] 매핑 ${mappedRooms}/${totalRooms} 방${doApply ? ' (INSERT 완료)' : ' (미리보기)'}`);
  if (dead.length) { console.log(`\n[map] businessId 소멸(새 id 필요) ${dead.length}곳:`); dead.forEach((d) => console.log('  - ' + d)); }
  if (review.length) { console.log(`\n[map] 수동 점검 ${review.length}건:`); review.forEach((d) => console.log('  - ' + d)); }
  if (!doApply) console.log('\n[map] --apply 로 실제 기입.');
  await end();
}

main().catch((e) => { console.error(e); process.exit(1); });
