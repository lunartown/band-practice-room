/**
 * 국가철도공단 도시광역철도 역사정보에서 서비스 주요 서울 지역의 역을 추린다.
 * 앱/DB에는 연결하지 않고, 향후 거리 계산에 쓸 독립 카탈로그만 갱신한다.
 *
 * 실행:
 *   cd src/scraper
 *   npx tsx scripts/collect-major-area-stations.ts
 */
import { execFileSync } from 'node:child_process';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const SOURCE_URL = 'https://data.kric.go.kr/rips/dataset/download.file?type=filedata&id=32&operation=1';
const SOURCE_PAGE_URL = 'https://data.kric.go.kr/rips/M_01_01/detail.do?id=32';
const DATA_AS_OF = '2026-06-30';
const OUTPUT_PATH = resolve(import.meta.dirname, '../catalogs/major-area-stations.json');

type StationDefinition = {
  id: string;
  name: string;
  areaSlugs: string[];
  sourceStationCodes: string[];
};

type SourceRow = {
  stationCode: string;
  stationName: string;
  lineName: string;
  latitude: number;
  longitude: number;
  operatorName: string;
};

const AREA_NAMES: Record<string, string> = {
  'hapjeong-hongdae': '합정/홍대',
  sinchon: '신촌',
  'sadang-isu': '사당/이수',
  'sindorim-yeongdeungpo': '신도림/영등포구청',
  mangwon: '망원',
  'sangdo-chungang': '상도/중앙대',
  'seoul-nat-univ': '서울대입구',
  bangbae: '방배',
  'hyehwa-ssuniv': '혜화/성신여대',
  gangnam: '강남',
  'gangdong-songpa': '강동/송파',
};

const STATIONS: StationDefinition[] = [
  { id: 'hongik-univ', name: '홍대입구역', areaSlugs: ['hapjeong-hongdae'], sourceStationCodes: ['A03', '0239', '1264'] },
  { id: 'hapjeong', name: '합정역', areaSlugs: ['hapjeong-hongdae'], sourceStationCodes: ['0238', '0622'] },
  { id: 'sangsu', name: '상수역', areaSlugs: ['hapjeong-hongdae'], sourceStationCodes: ['0623'] },
  { id: 'gwangheungchang', name: '광흥창역', areaSlugs: ['hapjeong-hongdae'], sourceStationCodes: ['0624'] },
  { id: 'mangwon', name: '망원역', areaSlugs: ['mangwon', 'hapjeong-hongdae'], sourceStationCodes: ['0621'] },

  { id: 'sinchon-line-2', name: '신촌역', areaSlugs: ['sinchon'], sourceStationCodes: ['0240'] },
  { id: 'ewha-womans-univ', name: '이대역', areaSlugs: ['sinchon'], sourceStationCodes: ['0241'] },
  { id: 'seogang-univ', name: '서강대역', areaSlugs: ['sinchon'], sourceStationCodes: ['1263'] },
  { id: 'daeheung', name: '대흥역', areaSlugs: ['sinchon'], sourceStationCodes: ['0625'] },

  { id: 'sadang', name: '사당역', areaSlugs: ['sadang-isu'], sourceStationCodes: ['0226', '0433'] },
  { id: 'isu', name: '이수역', areaSlugs: ['sadang-isu'], sourceStationCodes: ['0432', '0736'] },
  { id: 'namseong', name: '남성역', areaSlugs: ['sadang-isu'], sourceStationCodes: ['0737'] },

  { id: 'sindorim', name: '신도림역', areaSlugs: ['sindorim-yeongdeungpo'], sourceStationCodes: ['0234', '1007'] },
  { id: 'guro-digital-complex', name: '구로디지털단지역', areaSlugs: ['sindorim-yeongdeungpo'], sourceStationCodes: ['0232'] },
  { id: 'daerim', name: '대림역', areaSlugs: ['sindorim-yeongdeungpo'], sourceStationCodes: ['0233', '0744'] },
  { id: 'mullae', name: '문래역', areaSlugs: ['sindorim-yeongdeungpo'], sourceStationCodes: ['0235'] },
  { id: 'yeongdeungpo-gu-office', name: '영등포구청역', areaSlugs: ['sindorim-yeongdeungpo'], sourceStationCodes: ['0236', '0523'] },
  { id: 'yeongdeungpo-market', name: '영등포시장역', areaSlugs: ['sindorim-yeongdeungpo'], sourceStationCodes: ['0524'] },
  { id: 'gasan-digital-complex', name: '가산디지털단지역', areaSlugs: ['sindorim-yeongdeungpo'], sourceStationCodes: ['0746', '1702'] },
  { id: 'sinpung', name: '신풍역', areaSlugs: ['sindorim-yeongdeungpo'], sourceStationCodes: ['0743'] },

  { id: 'heukseok', name: '흑석역', areaSlugs: ['sangdo-chungang'], sourceStationCodes: ['4119'] },
  { id: 'sangdo', name: '상도역', areaSlugs: ['sangdo-chungang'], sourceStationCodes: ['0739'] },
  { id: 'jangseungbaegi', name: '장승배기역', areaSlugs: ['sangdo-chungang'], sourceStationCodes: ['0740'] },
  { id: 'soongsil-univ', name: '숭실대입구역', areaSlugs: ['sangdo-chungang'], sourceStationCodes: ['0738'] },

  { id: 'seoul-nat-univ', name: '서울대입구역', areaSlugs: ['seoul-nat-univ'], sourceStationCodes: ['0228'] },
  { id: 'bongcheon', name: '봉천역', areaSlugs: ['seoul-nat-univ'], sourceStationCodes: ['0229'] },
  { id: 'nakseongdae', name: '낙성대역', areaSlugs: ['seoul-nat-univ'], sourceStationCodes: ['0227'] },

  { id: 'bangbae', name: '방배역', areaSlugs: ['bangbae', 'sadang-isu'], sourceStationCodes: ['0225'] },
  { id: 'naebang', name: '내방역', areaSlugs: ['bangbae'], sourceStationCodes: ['0735'] },
  { id: 'nambu-bus-terminal', name: '남부터미널역', areaSlugs: ['bangbae'], sourceStationCodes: ['0341'] },

  { id: 'hyehwa', name: '혜화역', areaSlugs: ['hyehwa-ssuniv'], sourceStationCodes: ['0420'] },
  { id: 'hansung-univ', name: '한성대입구역', areaSlugs: ['hyehwa-ssuniv'], sourceStationCodes: ['0419'] },
  { id: 'sungshin-womens-univ', name: '성신여대입구역', areaSlugs: ['hyehwa-ssuniv'], sourceStationCodes: ['0418', 'S120'] },
  { id: 'bomun', name: '보문역', areaSlugs: ['hyehwa-ssuniv'], sourceStationCodes: ['0638', 'S121'] },
  { id: 'anam', name: '안암역', areaSlugs: ['hyehwa-ssuniv'], sourceStationCodes: ['0639'] },
  { id: 'korea-univ', name: '고려대역', areaSlugs: ['hyehwa-ssuniv'], sourceStationCodes: ['0640'] },

  { id: 'gangnam', name: '강남역', areaSlugs: ['gangnam'], sourceStationCodes: ['D007', '0222'] },
  { id: 'yeoksam', name: '역삼역', areaSlugs: ['gangnam'], sourceStationCodes: ['0221'] },
  { id: 'sinnonhyeon', name: '신논현역', areaSlugs: ['gangnam'], sourceStationCodes: ['D006', '4125'] },
  { id: 'yangjae', name: '양재역', areaSlugs: ['gangnam'], sourceStationCodes: ['D008', '0342'] },
  { id: 'maebong', name: '매봉역', areaSlugs: ['gangnam'], sourceStationCodes: ['0343'] },
  { id: 'guryong', name: '구룡역', areaSlugs: ['gangnam'], sourceStationCodes: ['1026'] },
  { id: 'gaepo-dong', name: '개포동역', areaSlugs: ['gangnam'], sourceStationCodes: ['1027'] },
  { id: 'daemosan-entrance', name: '대모산입구역', areaSlugs: ['gangnam'], sourceStationCodes: ['1028'] },
  { id: 'nonhyeon', name: '논현역', areaSlugs: ['gangnam'], sourceStationCodes: ['D005', '0732'] },

  { id: 'jamsil', name: '잠실역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['0216', '0814'] },
  { id: 'jamsilsaenae', name: '잠실새내역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['0217'] },
  { id: 'sports-complex', name: '종합운동장역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['0218', '4130'] },
  { id: 'seokchon-gobun', name: '석촌고분역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['4132'] },
  { id: 'seokchon', name: '석촌역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['0815', '4133'] },
  { id: 'songpa', name: '송파역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['0816'] },
  { id: 'garak-market', name: '가락시장역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['0350', '0817'] },
  { id: 'bangi', name: '방이역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['P551'] },
  { id: 'olympic-park', name: '올림픽공원역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['P550', '4136'] },
  { id: 'dunchon-dong', name: '둔촌동역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['P549'] },
  { id: 'gangdong-gu-office', name: '강동구청역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['0812'] },
  { id: 'cheonho', name: '천호역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['0547', '0811'] },
  { id: 'amsa', name: '암사역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['0810'] },
  { id: 'mongchontoseong', name: '몽촌토성역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['0813'] },
  { id: 'ogeum', name: '오금역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['0352', 'P552'] },
  { id: 'gaerong', name: '개롱역', areaSlugs: ['gangdong-songpa'], sourceStationCodes: ['P553'] },
];

function decodeXml(value: string): string {
  return value
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
    .replaceAll('&quot;', '"')
    .replaceAll('&apos;', "'")
    .replaceAll('&amp;', '&');
}

function columnIndex(reference: string): number {
  const letters = reference.match(/^[A-Z]+/)?.[0] ?? '';
  return [...letters].reduce((index, letter) => index * 26 + letter.charCodeAt(0) - 64, 0) - 1;
}

function parseRows(xlsxPath: string): SourceRow[] {
  const sharedStringsXml = execFileSync('unzip', ['-p', xlsxPath, 'xl/sharedStrings.xml'], { encoding: 'utf8' });
  const sharedStrings = [...sharedStringsXml.matchAll(/<si(?: [^>]*)?>([\s\S]*?)<\/si>/g)].map((match) =>
    [...match[1].matchAll(/<t(?: [^>]*)?>([\s\S]*?)<\/t>/g)].map((text) => decodeXml(text[1])).join(''),
  );
  const sheetXml = execFileSync('unzip', ['-p', xlsxPath, 'xl/worksheets/sheet1.xml'], { encoding: 'utf8' });
  const parsedRows: SourceRow[] = [];

  for (const rowMatch of sheetXml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const cellMatch of rowMatch[1].matchAll(/<c([^>]*?)(?:\/>|>([\s\S]*?)<\/c>)/g)) {
      const reference = cellMatch[1].match(/ r="([A-Z]+\d+)"/)?.[1];
      const rawValue = cellMatch[2]?.match(/<v>([\s\S]*?)<\/v>/)?.[1];
      if (!reference || rawValue === undefined) continue;
      const value = / t="s"/.test(cellMatch[1]) ? sharedStrings[Number(rawValue)] : rawValue;
      cells[columnIndex(reference)] = value;
    }

    const latitude = Number(cells[9]);
    const longitude = Number(cells[10]);
    if (!cells[0] || !cells[1] || !cells[3] || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
    parsedRows.push({
      stationCode: cells[0],
      stationName: cells[1],
      lineName: cells[3],
      latitude,
      longitude,
      operatorName: cells[11] ?? '',
    });
  }
  return parsedRows;
}

function roundCoordinate(value: number): number {
  return Number(value.toFixed(7));
}

async function main(): Promise<void> {
  const temporaryDirectory = await mkdtemp(resolve(tmpdir(), 'hapjusil-stations-'));
  const xlsxPath = resolve(temporaryDirectory, 'stations.xlsx');

  try {
    const response = await fetch(SOURCE_URL);
    if (!response.ok) throw new Error(`역사정보 다운로드 실패: ${response.status}`);
    await writeFile(xlsxPath, Buffer.from(await response.arrayBuffer()));

    const rows = parseRows(xlsxPath);
    console.log(`[stations] 원본 좌표 행 ${rows.length}개`);
    const rowsByCode = new Map<string, SourceRow[]>();
    for (const row of rows) {
      const isSeoulArea =
        row.latitude >= 37.4 && row.latitude <= 37.7 && row.longitude >= 126.7 && row.longitude <= 127.2;
      if (!isSeoulArea) continue;
      rowsByCode.set(row.stationCode, [...(rowsByCode.get(row.stationCode) ?? []), row]);
    }

    const stations = STATIONS.map((definition) => {
      const sourceRows = definition.sourceStationCodes.flatMap((code) => rowsByCode.get(code) ?? []);
      const uniqueSourceRows = [...new Map(sourceRows.map((row) => [`${row.stationCode}:${row.lineName}`, row])).values()];
      if (uniqueSourceRows.length < definition.sourceStationCodes.length) {
        const foundCodes = new Set(uniqueSourceRows.map((row) => row.stationCode));
        const missingCodes = definition.sourceStationCodes.filter((code) => !foundCodes.has(code));
        const similarlyNamedRows = rows.filter((row) => row.stationName.includes(definition.name.replace(/역$/, '')));
        throw new Error(
          `${definition.name}: 원본 역사코드 누락(${missingCodes.join(', ')}), 이름 후보 ${similarlyNamedRows.map((row) => row.stationCode).join(', ')}`,
        );
      }

      return {
        id: definition.id,
        name: definition.name,
        latitude: roundCoordinate(uniqueSourceRows.reduce((sum, row) => sum + row.latitude, 0) / uniqueSourceRows.length),
        longitude: roundCoordinate(uniqueSourceRows.reduce((sum, row) => sum + row.longitude, 0) / uniqueSourceRows.length),
        areaSlugs: definition.areaSlugs,
        lines: [...new Set(uniqueSourceRows.map((row) => row.lineName))],
        sourceStations: uniqueSourceRows.map((row) => ({
          stationCode: row.stationCode,
          stationName: row.stationName,
          lineName: row.lineName,
          operatorName: row.operatorName,
        })),
      };
    });

    const areas = Object.entries(AREA_NAMES).map(([slug, name]) => ({
      slug,
      name,
      stationIds: stations.filter((station) => station.areaSlugs.includes(slug)).map((station) => station.id),
    }));
    const output = {
      generatedAt: new Date().toISOString(),
      dataAsOf: DATA_AS_OF,
      source: {
        name: '국가철도공단 도시광역철도 역사정보',
        pageUrl: SOURCE_PAGE_URL,
        downloadUrl: SOURCE_URL,
      },
      count: stations.length,
      areas,
      stations,
    };

    await mkdir(resolve(OUTPUT_PATH, '..'), { recursive: true });
    await writeFile(OUTPUT_PATH, `${JSON.stringify(output, null, 2)}\n`);
    console.log(`[stations] ${OUTPUT_PATH} / ${stations.length}개 역`);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
