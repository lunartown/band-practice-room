/**
 * bootstrap-mapping 이 만든 리포트(/tmp/naver-mapping-report.json)를 읽어
 * 시드 원천 _local/data 의 각 roomDetails 에 naverBizItemId 를 주입한다.
 *
 * - 1:1(variantCount===1) 매칭만 반영한다. 1:N(요금제 변형)과 미매칭은 건너뛴다.
 * - 주입 후 generate_seed.py 로 시드를 재생성하면 room_sources.external_key 가
 *   네이버 실제 bizItemId 로 채워진다.
 *
 * 실행: cd src/scraper && npx tsx scripts/apply-mapping-to-seed.ts
 *   (선행: npx tsx scripts/bootstrap-mapping.ts 로 리포트 먼저 생성)
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DATA_PATH = new URL('../../../_local/data', import.meta.url).pathname;
const REPORT_PATH = '/tmp/naver-mapping-report.json';

interface ReportEntry {
  studio: string;
  businessId: string | null;
  businessTypeId: number | null;
  matched: Array<{ dbName: string; bizItemIds: string[]; variantCount: number; via: string }>;
}

const report: ReportEntry[] = JSON.parse(readFileSync(REPORT_PATH, 'utf8'));
const data = JSON.parse(readFileSync(DATA_PATH, 'utf8')) as {
  studios: Array<{ name: string; roomDetails?: Array<{ name: string; naverBizItemId?: string }> }>;
};

// (스튜디오명) → (방명 → bizItemId), 1:1 만.
const byStudio = new Map<string, Map<string, string>>();
for (const e of report) {
  const roomMap = new Map<string, string>();
  for (const m of e.matched) {
    if (m.variantCount === 1) roomMap.set(m.dbName, m.bizItemIds[0]);
  }
  byStudio.set(e.studio, roomMap);
}

let injected = 0;
let studiosTouched = 0;
const skipped: string[] = [];

for (const studio of data.studios) {
  const roomMap = byStudio.get(studio.name);
  if (!roomMap || !studio.roomDetails) continue;
  let touched = false;
  for (const room of studio.roomDetails) {
    const bizItemId = roomMap.get(room.name);
    if (bizItemId) {
      room.naverBizItemId = bizItemId;
      injected++;
      touched = true;
    } else if (studio.roomDetails.length) {
      skipped.push(`${studio.name} / ${room.name}`);
    }
  }
  if (touched) studiosTouched++;
}

writeFileSync(DATA_PATH, JSON.stringify(data, null, 2) + '\n');

console.log(`naverBizItemId 주입: ${injected}개 방, ${studiosTouched}개 스튜디오`);
console.log(`미반영(1:N/미매칭/네이버없음): ${skipped.length}개 방`);
console.log(`_local/data 갱신 완료 → generate_seed.py 재실행 필요`);
