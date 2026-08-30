/**
 * 장비가 비어 있는 네이버 예약 방의 현재 상품 설명을 모아 수동 검토 후보를 만든다.
 * 데이터 반영은 하지 않으며, APOLLO_STATE에 공개된 상품명/설명만 읽는다.
 *
 * 사용:
 *   DATABASE_URL=... npx tsx scripts/audit-naver-equipment.ts
 *   DATABASE_URL=... npx tsx scripts/audit-naver-equipment.ts --since-ref 1acb71d^
 *   DATABASE_URL=... npx tsx scripts/audit-naver-equipment.ts --output ../../_local/equipment-audit.json
 */
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fetchBizItemDetail } from '../../scrape-core/naver/client.js';
import { end, query } from '../src/db.js';

const NAVER_SOURCE_ID = '1';
const EQUIPMENT_PATTERN =
  /장비|악기|드럼|스네어|심벌|앰프|엠프|암페그|암펙|건반|키보드|피아노|마이크|믹서|스피커|marshall|fender|orange|mesa|yamaha|korg|roland|peavey|ampeg|markbass|hartke|sonor|tama|pearl|mapex|ludwig|dw\b|jbl|shure|behringer|laney|vox|hughes|kettner/i;
const MODEL_LIKE_PATTERN =
  /(?:[A-Za-z]{2,}[ -]?[A-Z]*\d{2,}[A-Za-z-]*|\b(?:marshall|fender|orange|mesa|yamaha|korg|roland|peavey|ampeg|markbass|hartke|sonor|tama|pearl|mapex|ludwig|jbl|shure|behringer|laney|vox|hughes|kettner)\b)/i;

interface RoomRow {
  studioSlug: string;
  studioName: string;
  roomName: string;
  businessId: string;
  businessUrl: string;
  itemId: string;
}

interface AuditResult extends RoomRow {
  url: string;
  status: 'candidate' | 'generic-only' | 'no-signal' | 'fetch-error';
  itemName?: string;
  description?: string;
  error?: string;
}

function arg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 && index + 1 < process.argv.length ? process.argv[index + 1] : undefined;
}

function sqlUnescape(value: string): string {
  return value.replace(/''/g, "'");
}

function studioSlugs(seedSql: string): Set<string> {
  const slugs = new Set<string>();
  const pattern = /INSERT INTO studios \([^\n]+\) VALUES \('((?:''|[^'])*)'/g;
  for (const match of seedSql.matchAll(pattern)) slugs.add(sqlUnescape(match[1]));
  return slugs;
}

async function newStudioSlugs(sinceRef: string): Promise<Set<string>> {
  const seedPath = resolve('../api/db/seeds/002_studios.sql');
  const current = studioSlugs(await readFile(seedPath, 'utf8'));
  const previous = studioSlugs(execFileSync('git', ['show', `${sinceRef}:src/api/db/seeds/002_studios.sql`], {
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  }));
  return new Set([...current].filter((slug) => !previous.has(slug)));
}

async function audit(row: RoomRow): Promise<AuditResult> {
  const businessTypeId = Number(row.businessUrl.match(/\/booking\/(\d+)\//)?.[1] ?? 10);
  const url = `https://m.booking.naver.com/booking/${businessTypeId}/bizes/${row.businessId}/items/${row.itemId}`;
  try {
    const item = await fetchBizItemDetail({
      businessId: row.businessId,
      businessTypeId,
      bizItemId: row.itemId,
    });
    const description = [
      item.description,
      ...item.additionalDescriptions.map((additional) =>
        [additional.title, additional.context].filter(Boolean).join('\n')),
    ].filter(Boolean).join('\n\n');
    const hasSignal = EQUIPMENT_PATTERN.test(description);
    const status: AuditResult['status'] = !hasSignal
      ? 'no-signal'
      : MODEL_LIKE_PATTERN.test(description)
        ? 'candidate'
        : 'generic-only';
    return { ...row, url, status, itemName: item.name, description };
  } catch (error) {
    return { ...row, url, status: 'fetch-error', error: error instanceof Error ? error.message : String(error) };
  }
}

async function mapConcurrent<T, R>(values: T[], concurrency: number, fn: (value: T) => Promise<R>): Promise<R[]> {
  const output = new Array<R>(values.length);
  let cursor = 0;
  async function worker() {
    while (cursor < values.length) {
      const index = cursor++;
      output[index] = await fn(values[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, values.length) }, worker));
  return output;
}

async function main() {
  const sinceRef = arg('--since-ref');
  const outputPath = arg('--output');
  const addedSlugs = sinceRef ? await newStudioSlugs(sinceRef) : null;

  const rows = (await query<RoomRow>(
    `SELECT s.slug AS "studioSlug", s.name AS "studioName", r.name AS "roomName",
            ss.external_key AS "businessId", ss.url AS "businessUrl", rs.external_key AS "itemId"
       FROM rooms r
       JOIN studios s ON s.id = r.studio_id AND s.is_active = true
       JOIN studio_sources ss ON ss.studio_id = s.id AND ss.source_id = $1
       JOIN room_sources rs ON rs.room_id = r.id AND rs.source_id = $1
      WHERE r.is_active = true
        AND NOT EXISTS (SELECT 1 FROM room_equipment re WHERE re.room_id = r.id)
      ORDER BY s.name, r.name`,
    [NAVER_SOURCE_ID],
  )).rows.filter((row) => !addedSlugs || addedSlugs.has(row.studioSlug));

  console.error(`[equipment-audit] 대상 ${rows.length}개 방${addedSlugs ? ` / 신규 스튜디오 ${addedSlugs.size}곳` : ''}`);
  const results = await mapConcurrent(rows, 5, audit);
  const counts = results.reduce<Record<string, number>>((acc, result) => {
    acc[result.status] = (acc[result.status] ?? 0) + 1;
    return acc;
  }, {});
  const report = {
    auditedAt: new Date().toISOString(),
    sinceRef: sinceRef ?? null,
    targetRooms: rows.length,
    statusCounts: counts,
    results,
  };

  if (outputPath) {
    await writeFile(resolve(outputPath), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    console.error(`[equipment-audit] 저장 ${resolve(outputPath)}`);
  } else {
    console.log(JSON.stringify(report, null, 2));
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(end);
