import type { Area, Slot, SlotsQuery, SlotsResponse, StudiosResponse } from './types';

export const areas: Area[] = [
  { id: 1, slug: 'hongdae', name: '홍대' },
  { id: 2, slug: 'hapjeong', name: '합정' },
  { id: 3, slug: 'sinchon', name: '신촌' },
  { id: 4, slug: 'sadang', name: '사당/이수' },
  { id: 5, slug: 'gangnam', name: '강남' },
];

const studioList = [
  { id: 1, name: '그라운드 합주실 홍대 본점', areaId: 1, areaName: '홍대' },
  { id: 2, name: '그라운드 합주실 합정 1호점', areaId: 2, areaName: '합정' },
  { id: 3, name: '그루브 합주실', areaId: 3, areaName: '신촌' },
  { id: 4, name: '사운딕트', areaId: 1, areaName: '홍대' },
  { id: 5, name: '웨이브랩', areaId: 2, areaName: '합정' },
];

function dateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function nowKst(offsetMinutes: number) {
  return new Date(Date.now() - offsetMinutes * 60 * 1000).toISOString();
}

function makeSlot(
  id: number,
  date: string,
  startHour: number,
  studioIdx: number,
  roomId: number,
  roomName: string,
  capacity: number,
  price: number,
  freshness: Slot['freshness'],
  scrapedMinutesAgo: number,
  status: Slot['status'] = 'AVAILABLE',
): Slot {
  const s = studioList[studioIdx];
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    id,
    date,
    startTime: `${pad(startHour)}:00`,
    endTime: `${pad(startHour + 1)}:00`,
    status,
    price: status === 'AVAILABLE' ? price : null,
    priceSource: 'SCRAPED',
    studio: {
      id: s.id,
      name: s.name,
      primaryAreaId: s.areaId,
      primaryAreaName: s.areaName,
      areaIds: [s.areaId],
    },
    room: { id: roomId, name: roomName, pricePerHour: price, capacityMin: 2, capacityMax: capacity },
    bookingUrl: 'https://naver.me/example',
    freshness,
    scrapedAt: nowKst(scrapedMinutesAgo),
  };
}

const today = dateStr(0);
const d1 = dateStr(1);
const d2 = dateStr(2);
const d3 = dateStr(3);

let id = 1;
const slots: Slot[] = [
  // 오늘 - 그라운드홍대 A룸 (14~18 연속 4개)
  makeSlot(id++, today, 14, 0, 1, 'A룸', 6, 16000, 'fresh', 3),
  makeSlot(id++, today, 15, 0, 1, 'A룸', 6, 16000, 'fresh', 3),
  makeSlot(id++, today, 16, 0, 1, 'A룸', 6, 16000, 'recent', 18),
  makeSlot(id++, today, 17, 0, 1, 'A룸', 6, 16000, 'recent', 18),
  // 오늘 - 그라운드홍대 라이브룸 (20~22 연속 2개)
  makeSlot(id++, today, 20, 0, 2, '라이브룸', 10, 20000, 'aging', 75),
  makeSlot(id++, today, 21, 0, 2, '라이브룸', 10, 20000, 'aging', 75),
  // 오늘 - 그루브 스튜디오A (18시 1개만)
  makeSlot(id++, today, 18, 2, 3, '스튜디오 A', 4, 18000, 'recent', 12),
  // 오늘 - 그루브 스튜디오B stale
  makeSlot(id++, today, 21, 2, 4, '스튜디오 B', 4, 18000, 'stale', 480),
  // 오늘 - 합정 그라운드 (19~21 연속 2개)
  makeSlot(id++, today, 19, 1, 5, '1관', 8, 14000, 'fresh', 5),
  makeSlot(id++, today, 20, 1, 5, '1관', 8, 14000, 'fresh', 5),
  // 오늘 - 마감된 슬롯
  makeSlot(id++, today, 18, 2, 3, '스튜디오 A', 4, 0, 'fresh', 2, 'UNAVAILABLE'),

  // 내일
  makeSlot(id++, d1, 10, 2, 3, '스튜디오 B', 4, 18000, 'fresh', 5),
  makeSlot(id++, d1, 11, 2, 3, '스튜디오 B', 4, 18000, 'fresh', 5),
  makeSlot(id++, d1, 12, 2, 3, '스튜디오 B', 4, 18000, 'recent', 25),
  makeSlot(id++, d1, 13, 0, 1, 'A룸', 6, 16000, 'fresh', 4),
  makeSlot(id++, d1, 19, 1, 5, '2관', 6, 14000, 'recent', 30),
  makeSlot(id++, d1, 20, 1, 5, '2관', 6, 14000, 'recent', 30),
  makeSlot(id++, d1, 21, 1, 5, '2관', 6, 14000, 'recent', 30),

  // d2
  makeSlot(id++, d2, 11, 0, 1, 'A룸', 6, 16000, 'fresh', 1),
  makeSlot(id++, d2, 14, 3, 6, '룸1', 4, 12000, 'recent', 20),
  makeSlot(id++, d2, 15, 3, 6, '룸1', 4, 12000, 'recent', 20),
  makeSlot(id++, d2, 16, 3, 6, '룸1', 4, 12000, 'aging', 90),

  // d3
  makeSlot(id++, d3, 15, 2, 3, '스튜디오 A', 4, 18000, 'recent', 35),
  makeSlot(id++, d3, 16, 2, 3, '스튜디오 A', 4, 18000, 'aging', 100),
  makeSlot(id++, d3, 20, 4, 7, 'Room A', 6, 15000, 'fresh', 8),
  makeSlot(id++, d3, 21, 4, 7, 'Room A', 6, 15000, 'fresh', 8),
];

export async function getMockAreas() {
  return { areas };
}

export async function getMockStudios(areaIds?: number[]): Promise<StudiosResponse> {
  const all = studioList.map((s) => ({
    id: s.id,
    name: s.name,
    primaryAreaId: s.areaId,
    primaryAreaName: s.areaName,
  }));
  return {
    studios: areaIds?.length ? all.filter((s) => areaIds.includes(s.primaryAreaId)) : all,
  };
}

export async function getMockSlots(query: SlotsQuery): Promise<SlotsResponse> {
  const today = dateStr(0);
  const effectiveDates =
    query.dates && query.dates.length > 0
      ? query.dates
      : Array.from({ length: 7 }, (_, i) => dateStr(i));

  let filtered = slots.filter((s) => {
    if (!effectiveDates.includes(s.date)) return false;
    if (query.areaIds?.length && !query.areaIds.includes(s.studio.primaryAreaId!)) return false;
    if (query.studioId && s.studio.id !== query.studioId) return false;
    if (query.minCapacity && (s.room.capacityMax ?? 99) < query.minCapacity) return false;
    if (query.timeFrom && s.startTime < query.timeFrom) return false;
    if (query.timeTo && s.startTime >= query.timeTo) return false;
    return true;
  });

  if (query.minDuration && query.minDuration > 1) {
    filtered = applyMinDuration(filtered, query.minDuration);
  }

  return { dates: effectiveDates, slots: filtered };
}

function applyMinDuration(slots: Slot[], minDuration: number): Slot[] {
  // 룸별·날짜별로 그룹화 후 연속 블록 검사
  const groups = new Map<string, Slot[]>();
  for (const s of slots) {
    const key = `${s.date}__${s.room.id}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(s);
  }

  const result: Slot[] = [];
  for (const group of groups.values()) {
    const available = group
      .filter((s) => s.status === 'AVAILABLE')
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // gap-and-islands: consecutive = 시간차 1시간
    const runs: Slot[][] = [];
    let current: Slot[] = [];
    for (const s of available) {
      if (current.length === 0) {
        current.push(s);
      } else {
        const prev = current[current.length - 1];
        if (prev.endTime === s.startTime) {
          current.push(s);
        } else {
          runs.push(current);
          current = [s];
        }
      }
    }
    if (current.length) runs.push(current);

    for (const run of runs) {
      if (run.length >= minDuration) {
        result.push(...run);
      }
    }
  }
  return result;
}
