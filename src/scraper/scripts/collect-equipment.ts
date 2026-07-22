/**
 * 네이버 예약의 합주실/방 소개 텍스트에서 장비를 수집해 정규화 seed 를 생성한다.
 *
 * 입력: src/api/db/seeds/002_studios.sql
 * 출력: src/api/db/seeds/006_equipment_assignments.sql
 *
 * 실행:
 *   cd src/scraper
 *   npx tsx scripts/collect-equipment.ts
 *   npx tsx scripts/collect-equipment.ts --limit 3
 *   npx tsx scripts/collect-equipment.ts --studios studio-합정/홍대-그라운드-본점
 */
import { createHash } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  fetchBizItemDetail,
  fetchBusinessDetail,
  type NaverBizItemDetail,
  type NaverBusinessDetail,
} from '../../scrape-core/naver/client.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const apiSeedsDir = resolve(__dirname, '../../api/db/seeds');
const studiosSeedPath = resolve(apiSeedsDir, '002_studios.sql');
const outputPath = resolve(apiSeedsDir, '006_equipment_assignments.sql');
const reportPath = resolve(__dirname, '../../../_local/equipment-collection-report.json');

type SourceKind = 'NAVER_BOOKING';
type TargetKind = 'STUDIO' | 'ROOM';
type Confidence = 'HIGH' | 'MEDIUM' | 'LOW' | 'NEEDS_REVIEW';

interface StudioTarget {
  slug: string;
  name: string;
  naver?: {
    businessId: string;
    businessTypeId: number;
    url: string;
  };
  rooms: Map<string, RoomTarget>;
}

interface RoomTarget {
  name: string;
  naverBizItemId?: string;
}

interface Evidence {
  evidenceKey: string;
  targetKind: TargetKind;
  studioSlug: string;
  roomName: string | null;
  equipmentSlug: string | null;
  sourceKind: SourceKind;
  sourceUrl: string;
  sourceTitle: string;
  rawName: string | null;
  rawText: string;
  confidence: Confidence;
  assignable: boolean;
}

interface Assignment {
  targetKind: TargetKind;
  studioSlug: string;
  roomName: string | null;
  equipmentSlug: string;
  quantity: number | null;
  noteLines: string[];
  confidence: Confidence;
}

interface TextBlock {
  text: string;
  rawName: string | null;
  confidence: Confidence;
  assignable: boolean;
}

interface EquipmentRule {
  slug: string;
  pattern: RegExp;
}

const equipmentRules: EquipmentRule[] = [
  { slug: 'double-pedal', pattern: /더블\s*페달|double\s*pedal/i },
  { slug: 'cymbal-set', pattern: /심벌|심발|cymbal|symbal|sabian|zildjian|paiste|meinl|istanbul/i },
  {
    slug: 'drum-kit',
    pattern: /드럼|drums?|drum\s*set|tama|gretsch|gretch|pearl|dw|pdp|mapex|sonor/i,
  },
  {
    slug: 'guitar-amp',
    pattern:
      /기타\s*앰프|guitar\s*amp|gtr\s*(?:&\s*bass\s*)?amp|marshall|mesa|orange\s+crush\s+pro|fender\s+(?:twin|deluxe|bassman)|vox|bogner|laney|jcm|jvm|dsl|jc-?120/i,
  },
  {
    slug: 'bass-amp',
    pattern: /베이스\s*앰프|bass\s*amp|orange\s+crush\s+bass|ampeg|mark\s*bass|hartke|ashdown|gallien|svt/i,
  },
  {
    slug: 'acoustic-piano',
    pattern: /업라이트|그랜드\s*피아노|어쿠스틱\s*피아노|acoustic\s*piano|upright|grand\s*piano/i,
  },
  {
    slug: 'digital-piano',
    pattern: /디지털\s*피아노|전자\s*피아노|digital\s*piano|stage\s*piano|rd-?\d+/i,
  },
  {
    slug: 'keyboard',
    pattern:
      /건반|keyboard|신디|synth|yamaha\s*(?:montage|modx|motif|s90|cp|mx)|kurzweil|nord|korg|roland\s*(?:fa|fantom|juno)/i,
  },
  { slug: 'microphone', pattern: /마이크|mic|microphone|sm58|beta\s*58|무선\s*마이크|유선\s*마이크/i },
  { slug: 'mixer', pattern: /믹서|mixer|mixing|console|yamaha\s*mgp|x32|midas|soundcraft|behringer/i },
  {
    slug: 'monitor-speaker',
    pattern: /모니터\s*스피커|monitor\s*speaker|floor\s*monitor|pro12m|터보사운드|turbosound/i,
  },
  {
    slug: 'speaker',
    pattern: /스피커|\bspeakers?\b|메인\s*스피커|main\s*speaker|\bpa\b|p\.a|eaw|hk\s*audio\s*pro12(?!m)/i,
  },
  {
    slug: 'audio-interface',
    pattern: /오디오\s*인터페이스|오인페|audio\s*interface|apollo\s*twin|scarlett|rme|audient/i,
  },
  { slug: 'recording-booth', pattern: /녹음\s*부스|recording\s*booth|보컬\s*부스/i },
  { slug: 'music-stand', pattern: /보면대|악보대|music\s*stand/i },
  { slug: 'guitar-stand', pattern: /기타\s*스탠드|guitar\s*stand/i },
];

const reviewOnlyPattern = /예약|취소|환불|위약금|음료|주차|와이파이|화장실|영업|오픈|문자|입금/;
const genericEquipmentPattern = /장비|악기|specification|set/i;
const roomBusinessPattern = /합주실|연습실|이용료|대여료/;

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 && i + 1 < process.argv.length ? process.argv[i + 1] : undefined;
}

function sqlUnescape(value: string): string {
  return value.replace(/''/g, "'");
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''").replace(/\s+/g, ' ').trim()}'`;
}

function sqlNullableString(value: string | null): string {
  return value === null ? 'NULL' : sqlString(value);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
}

function hash(input: string): string {
  return createHash('sha1').update(input).digest('hex').slice(0, 12);
}

function parseBusinessTypeId(url: string): number {
  return Number(url.match(/\/booking\/(\d+)\//)?.[1] ?? '10');
}

function sourceUrlForStudio(studio: StudioTarget): string {
  const naver = studio.naver;
  if (!naver) return '';
  return `https://m.booking.naver.com/booking/${naver.businessTypeId}/bizes/${naver.businessId}`;
}

function sourceUrlForRoom(studio: StudioTarget, room: RoomTarget): string {
  const naver = studio.naver;
  if (!naver || !room.naverBizItemId) return '';
  return `${sourceUrlForStudio(studio)}/items/${room.naverBizItemId}`;
}

function parseTargets(): StudioTarget[] {
  const seed = readFileSync(studiosSeedPath, 'utf-8');
  const studios = new Map<string, StudioTarget>();

  for (const match of seed.matchAll(
    /INSERT INTO studios \(slug, name,[^\n]*VALUES \('((?:''|[^'])*)', '((?:''|[^'])*)'/g,
  )) {
    const slug = sqlUnescape(match[1]);
    studios.set(slug, {
      slug,
      name: sqlUnescape(match[2]),
      rooms: new Map(),
    });
  }

  for (const match of seed.matchAll(
    /INSERT INTO rooms \([^\n]*SELECT id, '((?:''|[^'])*)'[^\n]*WHERE slug='((?:''|[^'])*)'/g,
  )) {
    const roomName = sqlUnescape(match[1]);
    const studio = studios.get(sqlUnescape(match[2]));
    studio?.rooms.set(roomName, { name: roomName });
  }

  for (const match of seed.matchAll(
    /INSERT INTO studio_sources \([^\n]*SELECT id, 1, '([^']+)', '([^']+)' FROM studios WHERE slug='((?:''|[^'])*)'/g,
  )) {
    const studio = studios.get(sqlUnescape(match[3]));
    if (!studio) continue;
    studio.naver = {
      businessId: match[1],
      businessTypeId: parseBusinessTypeId(match[2]),
      url: match[2],
    };
  }

  for (const match of seed.matchAll(
    /INSERT INTO room_sources \(room_id, source_id, external_key\) SELECT r\.id, 1, '([^']+)' FROM rooms r JOIN studios s ON r\.studio_id=s\.id WHERE s\.slug='((?:''|[^'])*)' AND r\.name='((?:''|[^'])*)'/g,
  )) {
    const studio = studios.get(sqlUnescape(match[2]));
    const roomName = sqlUnescape(match[3]);
    const room = studio?.rooms.get(roomName);
    if (room) room.naverBizItemId = match[1];
  }

  return [...studios.values()]
    .filter((studio) => studio.naver)
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function cleanLine(line: string): string {
  return line
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/^[\s*\-•·]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitEquipmentLines(text: string): string[] {
  return text
    .split(/\n|<br\s*\/?>/i)
    .map(cleanLine)
    .filter((line) => line.length > 0)
    .filter((line) => line.length <= 260)
    .filter(
      (line) =>
        !roomBusinessPattern.test(line) ||
        /앰프|건반|스피커|마이크|심벌|심발|cymbal|드럼\s+[a-z0-9]|drum\s*set/i.test(line),
    )
    .filter((line) => equipmentRules.some((rule) => rule.pattern.test(line)) || genericEquipmentPattern.test(line))
    .filter((line) => !reviewOnlyPattern.test(line) || equipmentRules.some((rule) => rule.pattern.test(line)));
}

function matchEquipmentSlugs(line: string): string[] {
  const slugs = new Set<string>();
  for (const rule of equipmentRules) {
    if (rule.pattern.test(line)) slugs.add(rule.slug);
  }
  if (slugs.has('monitor-speaker') && !/메인|main|\bpa\b|p\.a/i.test(line)) {
    slugs.delete('speaker');
  }
  return [...slugs];
}

function parseQuantity(line: string): number | null {
  const match = line.match(/(\d+)\s*(개|대|조|세트|set|sets)\b/i);
  if (!match) return null;
  const quantity = Number(match[1]);
  return Number.isFinite(quantity) && quantity > 0 && quantity < 100 ? quantity : null;
}

function betterConfidence(a: Confidence, b: Confidence): Confidence {
  const rank: Record<Confidence, number> = {
    HIGH: 4,
    MEDIUM: 3,
    LOW: 2,
    NEEDS_REVIEW: 1,
  };
  return rank[a] >= rank[b] ? a : b;
}

function evidenceKey(parts: {
  targetKind: TargetKind;
  studioSlug: string;
  roomName: string | null;
  sourceUrl: string;
  equipmentSlug: string | null;
  rawText: string;
}): string {
  const roomPart = parts.roomName ?? 'studio';
  const equipmentPart = parts.equipmentSlug ?? 'unknown';
  return [
    parts.targetKind.toLowerCase(),
    hash(parts.studioSlug),
    hash(roomPart),
    hash(parts.sourceUrl),
    equipmentPart,
    hash(parts.rawText),
  ].join(':');
}

function addEvidence(
  evidences: Evidence[],
  assignments: Map<string, Assignment>,
  params: {
    targetKind: TargetKind;
    studioSlug: string;
    roomName: string | null;
    sourceUrl: string;
    sourceTitle: string;
    sourceKind: SourceKind;
    block: TextBlock;
    line: string;
  },
): void {
  const slugs = matchEquipmentSlugs(params.line);
  const equipmentSlugs = slugs.length ? slugs : [null];
  const confidence = slugs.length ? params.block.confidence : 'NEEDS_REVIEW';
  const rawText =
    params.block.rawName && params.block.rawName !== params.line
      ? `${params.block.rawName}: ${params.line}`
      : params.line;

  for (const equipmentSlug of equipmentSlugs) {
    const evidence: Evidence = {
      evidenceKey: evidenceKey({
        targetKind: params.targetKind,
        studioSlug: params.studioSlug,
        roomName: params.roomName,
        sourceUrl: params.sourceUrl,
        equipmentSlug,
        rawText,
      }),
      targetKind: params.targetKind,
      studioSlug: params.studioSlug,
      roomName: params.roomName,
      equipmentSlug,
      sourceKind: params.sourceKind,
      sourceUrl: params.sourceUrl,
      sourceTitle: params.sourceTitle,
      rawName: params.block.rawName,
      rawText,
      confidence,
      assignable: params.block.assignable && equipmentSlug !== null && confidence !== 'LOW',
    };
    evidences.push(evidence);

    if (!evidence.assignable || equipmentSlug === null) continue;

    const key = [
      evidence.targetKind,
      evidence.studioSlug,
      evidence.roomName ?? '',
      equipmentSlug,
    ].join('\u0000');
    const quantity = parseQuantity(params.line);
    const existing = assignments.get(key);
    if (existing) {
      existing.confidence = betterConfidence(existing.confidence, confidence);
      if (existing.quantity === null && quantity !== null) existing.quantity = quantity;
      if (!existing.noteLines.includes(params.line)) existing.noteLines.push(params.line);
      continue;
    }

    assignments.set(key, {
      targetKind: evidence.targetKind,
      studioSlug: evidence.studioSlug,
      roomName: evidence.roomName,
      equipmentSlug,
      quantity,
      noteLines: [params.line],
      confidence,
    });
  }
}

function businessBlocks(business: NaverBusinessDetail): TextBlock[] {
  if (!business.desc) return [];
  const hasCommonSignal = /모든\s*룸|모든룸|각\s*방|각방|완비|보유|설치|제공/.test(business.desc);
  return [
    {
      text: business.desc,
      rawName: '네이버 예약 소개',
      confidence: hasCommonSignal ? 'HIGH' : 'MEDIUM',
      assignable: true,
    },
  ];
}

function bizItemBlocks(item: NaverBizItemDetail): TextBlock[] {
  const blocks: TextBlock[] = [];

  if (item.desc) {
    blocks.push({
      text: item.desc,
      rawName: '방 설명',
      confidence: item.desc.includes('\n') ? 'HIGH' : 'MEDIUM',
      assignable: true,
    });
  }

  for (const extra of item.extraDescJson ?? []) {
    if (!extra.context) continue;
    blocks.push({
      text: extra.context,
      rawName: extra.title ?? '추가 설명',
      confidence: 'HIGH',
      assignable: true,
    });
  }

  for (const precaution of item.bookingPrecautionJson ?? []) {
    if (!precaution.desc) continue;
    blocks.push({
      text: precaution.desc,
      rawName: precaution.title ?? '예약 유의사항',
      confidence: 'LOW',
      assignable: false,
    });
  }

  return blocks;
}

function noteForAssignment(assignment: Assignment): string {
  const lines = assignment.noteLines.slice(0, 4);
  const suffix = assignment.noteLines.length > lines.length ? ` 외 ${assignment.noteLines.length - lines.length}건` : '';
  return `${lines.join('; ')}${suffix}`;
}

function valueTuple(values: Array<string | number | null>): string {
  return `(${values
    .map((value) => {
      if (value === null) return 'NULL';
      if (typeof value === 'number') return String(value);
      return sqlString(value);
    })
    .join(', ')})`;
}

function generateSql(assignments: Assignment[], evidences: Evidence[], observedAt: string): string {
  const uniqueEvidence = new Map<string, Evidence>();
  for (const evidence of evidences) {
    uniqueEvidence.set(evidence.evidenceKey, evidence);
  }

  const sortedAssignments = [...assignments].sort((a, b) =>
    [a.targetKind, a.studioSlug, a.roomName ?? '', a.equipmentSlug].join('\u0000').localeCompare(
      [b.targetKind, b.studioSlug, b.roomName ?? '', b.equipmentSlug].join('\u0000'),
    ),
  );
  const sortedEvidence = [...uniqueEvidence.values()].sort((a, b) =>
    a.evidenceKey.localeCompare(b.evidenceKey),
  );

  const assignmentValues = sortedAssignments.map((assignment) =>
    valueTuple([
      assignment.targetKind,
      assignment.studioSlug,
      assignment.roomName,
      assignment.equipmentSlug,
      assignment.quantity,
      noteForAssignment(assignment),
      'SCRAPED',
    ]),
  );

  const evidenceValues = sortedEvidence.map((evidence) =>
    valueTuple([
      evidence.evidenceKey,
      evidence.targetKind,
      evidence.studioSlug,
      evidence.roomName,
      evidence.equipmentSlug,
      evidence.sourceKind,
      evidence.sourceUrl,
      evidence.sourceTitle,
      evidence.rawName,
      evidence.rawText,
      evidence.confidence,
      observedAt,
    ]),
  );

  return `-- Auto-generated by src/scraper/scripts/collect-equipment.ts
-- Source: Naver Booking GraphQL (business.desc, bizItem.desc, extraDescJson, bookingPrecautionJson)
-- Observed at: ${observedAt}

WITH assignment_seed(target_kind, studio_slug, room_name, equipment_slug, quantity, note, source) AS (
  VALUES
${assignmentValues.map((value) => `    ${value}`).join(',\n')}
)
INSERT INTO room_equipment (room_id, equipment_id, quantity, note, source)
SELECT r.id, ei.id, assignment_seed.quantity, assignment_seed.note, assignment_seed.source
FROM assignment_seed
JOIN studios s ON s.slug = assignment_seed.studio_slug
JOIN rooms r ON r.studio_id = s.id AND r.name = assignment_seed.room_name
JOIN equipment_items ei ON ei.slug = assignment_seed.equipment_slug
WHERE assignment_seed.target_kind = 'ROOM'
ON CONFLICT (room_id, equipment_id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  note = EXCLUDED.note,
  source = EXCLUDED.source,
  updated_at = now();

WITH assignment_seed(target_kind, studio_slug, room_name, equipment_slug, quantity, note, source) AS (
  VALUES
${assignmentValues.map((value) => `    ${value}`).join(',\n')}
)
INSERT INTO studio_equipment (studio_id, equipment_id, quantity, note, source)
SELECT s.id, ei.id, assignment_seed.quantity, assignment_seed.note, assignment_seed.source
FROM assignment_seed
JOIN studios s ON s.slug = assignment_seed.studio_slug
JOIN equipment_items ei ON ei.slug = assignment_seed.equipment_slug
WHERE assignment_seed.target_kind = 'STUDIO'
ON CONFLICT (studio_id, equipment_id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  note = EXCLUDED.note,
  source = EXCLUDED.source,
  updated_at = now();

WITH evidence_seed(
  evidence_key,
  target_kind,
  studio_slug,
  room_name,
  equipment_slug,
  source_kind,
  source_url,
  source_title,
  raw_name,
  raw_text,
  confidence,
  observed_at
) AS (
  VALUES
${evidenceValues.map((value) => `    ${value}`).join(',\n')}
)
INSERT INTO equipment_evidence (
  evidence_key,
  target_kind,
  studio_id,
  room_id,
  equipment_id,
  source_kind,
  source_url,
  source_title,
  raw_name,
  raw_text,
  confidence,
  observed_at
)
SELECT
  evidence_seed.evidence_key,
  evidence_seed.target_kind,
  CASE WHEN evidence_seed.target_kind = 'STUDIO' THEN s.id ELSE NULL END,
  CASE WHEN evidence_seed.target_kind = 'ROOM' THEN r.id ELSE NULL END,
  ei.id,
  evidence_seed.source_kind,
  evidence_seed.source_url,
  evidence_seed.source_title,
  evidence_seed.raw_name,
  evidence_seed.raw_text,
  evidence_seed.confidence,
  evidence_seed.observed_at::timestamptz
FROM evidence_seed
JOIN studios s ON s.slug = evidence_seed.studio_slug
LEFT JOIN rooms r
  ON evidence_seed.target_kind = 'ROOM'
  AND r.studio_id = s.id
  AND r.name = evidence_seed.room_name
LEFT JOIN equipment_items ei ON ei.slug = evidence_seed.equipment_slug
WHERE
  (evidence_seed.target_kind = 'STUDIO' OR r.id IS NOT NULL)
ON CONFLICT (evidence_key) DO UPDATE SET
  equipment_id = EXCLUDED.equipment_id,
  source_kind = EXCLUDED.source_kind,
  source_url = EXCLUDED.source_url,
  source_title = EXCLUDED.source_title,
  raw_name = EXCLUDED.raw_name,
  raw_text = EXCLUDED.raw_text,
  confidence = EXCLUDED.confidence,
  observed_at = EXCLUDED.observed_at;
`;
}

async function main(): Promise<void> {
  const limit = Number(arg('--limit') ?? '0');
  const onlyStudios = new Set((arg('--studios') ?? '').split(',').map((v) => v.trim()).filter(Boolean));
  const observedAt = process.env.EQUIPMENT_OBSERVED_AT ?? new Date().toISOString();
  const targets = parseTargets()
    .filter((studio) => onlyStudios.size === 0 || onlyStudios.has(studio.slug))
    .slice(0, limit > 0 ? limit : undefined);

  const evidences: Evidence[] = [];
  const assignments = new Map<string, Assignment>();
  const failures: Array<{ studio: string; room?: string; error: string }> = [];

  console.log(`[equipment] 대상 합주실 ${targets.length}곳`);

  for (const [index, studio] of targets.entries()) {
    if (!studio.naver) continue;
    const prefix = `[${index + 1}/${targets.length}] ${studio.slug}`;
    const studioUrl = sourceUrlForStudio(studio);

    try {
      const business = await fetchBusinessDetail({
        businessId: studio.naver.businessId,
        businessTypeId: studio.naver.businessTypeId,
      });

      if (business) {
        for (const block of businessBlocks(business)) {
          for (const line of splitEquipmentLines(block.text)) {
            addEvidence(evidences, assignments, {
              targetKind: 'STUDIO',
              studioSlug: studio.slug,
              roomName: null,
              sourceUrl: studioUrl,
              sourceTitle: `${studio.name} 네이버 예약 소개`,
              sourceKind: 'NAVER_BOOKING',
              block,
              line,
            });
          }
        }
      }
    } catch (error) {
      failures.push({
        studio: studio.slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }

    await sleep(120);

    const rooms = [...studio.rooms.values()].filter((room) => room.naverBizItemId);
    for (const room of rooms) {
      if (!room.naverBizItemId) continue;
      try {
        const item = await fetchBizItemDetail({
          businessId: studio.naver.businessId,
          businessTypeId: studio.naver.businessTypeId,
          bizItemId: room.naverBizItemId,
        });

        if (!item) continue;
        for (const block of bizItemBlocks(item)) {
          for (const line of splitEquipmentLines(block.text)) {
            addEvidence(evidences, assignments, {
              targetKind: 'ROOM',
              studioSlug: studio.slug,
              roomName: room.name,
              sourceUrl: sourceUrlForRoom(studio, room),
              sourceTitle: `${studio.name} ${room.name} 네이버 예약 상세`,
              sourceKind: 'NAVER_BOOKING',
              block,
              line,
            });
          }
        }
      } catch (error) {
        failures.push({
          studio: studio.slug,
          room: room.name,
          error: error instanceof Error ? error.message : String(error),
        });
      }
      await sleep(120);
    }

    console.log(
      `${prefix}: evidence=${evidences.length}, assignments=${assignments.size}, failures=${failures.length}`,
    );
  }

  const assignmentRows = [...assignments.values()];
  const sql = generateSql(assignmentRows, evidences, observedAt);
  writeFileSync(outputPath, sql, 'utf-8');

  mkdirSync(dirname(reportPath), { recursive: true });
  writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        observedAt,
        targetCount: targets.length,
        evidenceCount: evidences.length,
        assignmentCount: assignmentRows.length,
        failures,
      },
      null,
      2,
    )}\n`,
    'utf-8',
  );

  console.log(
    `[equipment] 완료: assignments=${assignmentRows.length}, evidence=${evidences.length}, failures=${failures.length}`,
  );
  console.log(`[equipment] seed: ${outputPath}`);
  console.log(`[equipment] report: ${reportPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
