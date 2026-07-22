import type {
  Area,
  EquipmentAssignment,
  EquipmentResponse,
  Room,
  Slot,
  Studio,
  SlotsQuery,
  SlotsResponse,
  StudiosResponse,
} from './types';

export const areas: Area[] = [
  { id: 1, slug: 'hongdae', name: '홍대' },
  { id: 2, slug: 'hapjeong', name: '합정' },
  { id: 3, slug: 'sinchon', name: '신촌' },
  { id: 4, slug: 'sadang', name: '사당/이수' },
  { id: 5, slug: 'gangnam', name: '강남' },
];

type MockStudio = Omit<Studio, 'primaryAreaId' | 'primaryAreaName'> & {
  areaId: number;
  areaName: string;
  rooms: Room[];
};

const studioList: MockStudio[] = [
  { id: 1, name: '그라운드 합주실 홍대 본점', areaId: 1, areaName: '홍대', imageUrl: 'https://picsum.photos/seed/ground-hongdae/120', images: ['https://picsum.photos/seed/ground-hongdae-1/600/400', 'https://picsum.photos/seed/ground-hongdae-2/600/400', 'https://picsum.photos/seed/ground-hongdae-3/600/400', 'https://picsum.photos/seed/ground-hongdae-4/600/400'], rating: 4.7, reviewCount: 213, reviewKeywords: [{ keyword: '시설이 깔끔해요', count: 69 }, { keyword: '가성비가 좋아요', count: 47 }, { keyword: '방음이 잘돼요', count: 40 }], equipment: [{ id: 9, slug: 'microphone', name: '마이크', quantity: 4 }], rooms: [{ id: 1, name: 'A룸', pricePerHour: 16000, capacityMin: 2, capacityMax: 6, equipment: [{ id: 1, slug: 'drum-kit', name: '드럼 세트', quantity: 1 }, { id: 4, slug: 'guitar-amp', name: '기타 앰프', quantity: 2 }, { id: 5, slug: 'bass-amp', name: '베이스 앰프', quantity: 1 }] }, { id: 2, name: '라이브룸', pricePerHour: 20000, capacityMin: 2, capacityMax: 10, equipment: [{ id: 1, slug: 'drum-kit', name: '드럼 세트', quantity: 1 }, { id: 4, slug: 'guitar-amp', name: '기타 앰프', quantity: 2 }, { id: 5, slug: 'bass-amp', name: '베이스 앰프', quantity: 1 }, { id: 6, slug: 'keyboard', name: '키보드', quantity: 1 }] }] },
  { id: 2, name: '그라운드 합주실 합정 1호점', areaId: 2, areaName: '합정', imageUrl: null, rating: 4.5, reviewCount: 88, reviewKeywords: [{ keyword: '친절해요', count: 22 }, { keyword: '스피커 성능이 좋아요', count: 18 }], equipment: [{ id: 9, slug: 'microphone', name: '마이크', quantity: 3 }], rooms: [{ id: 5, name: '1관', pricePerHour: 14000, capacityMin: 2, capacityMax: 8, equipment: [{ id: 1, slug: 'drum-kit', name: '드럼 세트', quantity: 1 }, { id: 4, slug: 'guitar-amp', name: '기타 앰프', quantity: 1 }] }, { id: 8, name: '2관', pricePerHour: 14000, capacityMin: 2, capacityMax: 6, equipment: [{ id: 1, slug: 'drum-kit', name: '드럼 세트', quantity: 1 }] }] },
  { id: 3, name: '그루브 합주실', areaId: 3, areaName: '신촌', imageUrl: 'https://picsum.photos/seed/groove/120', images: ['https://picsum.photos/seed/groove-1/600/400', 'https://picsum.photos/seed/groove-2/600/400', 'https://picsum.photos/seed/groove-3/600/400', 'https://picsum.photos/seed/groove-4/600/400', 'https://picsum.photos/seed/groove-5/600/400'], rating: 4.2, reviewCount: 41, reviewKeywords: [{ keyword: '인테리어가 멋져요', count: 12 }], equipment: [{ id: 9, slug: 'microphone', name: '마이크', quantity: 2 }], rooms: [{ id: 3, name: '스튜디오 A', pricePerHour: 18000, capacityMin: 2, capacityMax: 4, equipment: [{ id: 1, slug: 'drum-kit', name: '드럼 세트', quantity: 1 }, { id: 5, slug: 'bass-amp', name: '베이스 앰프', quantity: 1 }] }, { id: 4, name: '스튜디오 B', pricePerHour: 18000, capacityMin: 2, capacityMax: 4, equipment: [{ id: 6, slug: 'keyboard', name: '키보드', quantity: 1 }] }] },
  { id: 4, name: '사운딕트', areaId: 1, areaName: '홍대', imageUrl: null, rating: null, reviewCount: null, reviewKeywords: [], equipment: [], rooms: [{ id: 6, name: '룸1', pricePerHour: 12000, capacityMin: 2, capacityMax: 4, equipment: [{ id: 4, slug: 'guitar-amp', name: '기타 앰프', quantity: 1 }] }] },
  { id: 5, name: '웨이브랩', areaId: 2, areaName: '합정', imageUrl: null, rating: 4.9, reviewCount: 7, reviewKeywords: [], equipment: [], rooms: [{ id: 7, name: 'Room A', pricePerHour: 15000, capacityMin: 2, capacityMax: 6, equipment: [{ id: 7, slug: 'digital-piano', name: '디지털 피아노', quantity: 1 }] }] },
];

// 장비 UI를 먼저 검토할 수 있도록 로컬 mock에만 실제 카탈로그 형태의 모델명을 넣는다.
// 운영 API가 room.equipment.note를 내려주기 시작하면 같은 컴포넌트가 그대로 표시한다.
const equipmentPreviewByRoomId: Record<number, EquipmentAssignment[]> = {
  1: [
    { id: 1, slug: 'drum-kit', name: '드럼', note: 'Pearl Masters Studio · Zildjian K Custom' },
    { id: 4, slug: 'guitar-amp', name: '기타 앰프', note: 'Marshall JCM2000 TSL100 · 1960A Cabinet' },
    { id: 5, slug: 'bass-amp', name: '베이스 앰프', note: 'Ampeg SVT-2 Pro · SVT-410HLF' },
    { id: 6, slug: 'keyboard', name: '건반', note: 'Yamaha S90XS · Yamaha MOTIF 6' },
  ],
  2: [
    { id: 1, slug: 'drum-kit', name: '드럼', note: 'Tama Starclassic' },
    { id: 4, slug: 'guitar-amp', name: '기타 앰프', note: 'Marshall DSL100H · Fender Twin Reverb' },
    { id: 5, slug: 'bass-amp', name: '베이스 앰프', note: 'Ampeg SVT-4 Pro · SVT-810E' },
    { id: 6, slug: 'keyboard', name: '건반', note: 'Yamaha MODX8+ · Yamaha MODX7+' },
  ],
  3: [
    { id: 1, slug: 'drum-kit', name: '드럼', note: 'Gretsch Renown RN1' },
    { id: 5, slug: 'bass-amp', name: '베이스 앰프', note: 'Markbass TTE 500' },
  ],
  4: [
    { id: 6, slug: 'keyboard', name: '건반', note: 'Yamaha CP88 Stage Piano · Nord Stage 3' },
  ],
};

for (const studio of studioList) {
  for (const room of studio.rooms) {
    room.equipment = equipmentPreviewByRoomId[room.id] ?? room.equipment;
  }
}

const equipmentCategories: EquipmentResponse['categories'] = [
  {
    id: 1,
    slug: 'drums',
    name: '드럼',
    items: [
      { id: 1, slug: 'drum-kit', name: '드럼 세트', normalizedName: 'drum kit', aliases: ['드럼', '드럼셋'] },
    ],
  },
  {
    id: 2,
    slug: 'amps',
    name: '앰프',
    items: [
      { id: 4, slug: 'guitar-amp', name: '기타 앰프', normalizedName: 'guitar amp', aliases: ['기타앰프'] },
      { id: 5, slug: 'bass-amp', name: '베이스 앰프', normalizedName: 'bass amp', aliases: ['베이스앰프'] },
    ],
  },
  {
    id: 3,
    slug: 'keys',
    name: '건반',
    items: [
      { id: 6, slug: 'keyboard', name: '키보드', normalizedName: 'keyboard', aliases: ['건반'] },
      { id: 7, slug: 'digital-piano', name: '디지털 피아노', normalizedName: 'digital piano', aliases: ['디피'] },
    ],
  },
  {
    id: 4,
    slug: 'pa',
    name: 'PA/음향',
    items: [
      { id: 9, slug: 'microphone', name: '마이크', normalizedName: 'microphone', aliases: ['mic'] },
    ],
  },
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
      imageUrl: s.imageUrl,
      rating: s.rating,
      reviewCount: s.reviewCount,
      reviewKeywords: s.reviewKeywords,
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
  makeSlot(id++, d1, 10, 2, 4, '스튜디오 B', 4, 18000, 'fresh', 5),
  makeSlot(id++, d1, 11, 2, 4, '스튜디오 B', 4, 18000, 'fresh', 5),
  makeSlot(id++, d1, 12, 2, 4, '스튜디오 B', 4, 18000, 'recent', 25),
  makeSlot(id++, d1, 13, 0, 1, 'A룸', 6, 16000, 'fresh', 4),
  makeSlot(id++, d1, 19, 1, 8, '2관', 6, 14000, 'recent', 30),
  makeSlot(id++, d1, 20, 1, 8, '2관', 6, 14000, 'recent', 30),
  makeSlot(id++, d1, 21, 1, 8, '2관', 6, 14000, 'recent', 30),

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
    imageUrl: s.imageUrl,
    images: (s as { images?: string[] }).images ?? [],
    rating: s.rating,
    reviewCount: s.reviewCount,
    reviewKeywords: s.reviewKeywords,
    equipment: s.equipment,
    rooms: s.rooms,
    hasOnlineBooking: s.id !== 5, // 5번은 전화예약 데모
  }));
  return {
    studios: areaIds?.length ? all.filter((s) => areaIds.includes(s.primaryAreaId)) : all,
  };
}

export async function getMockEquipment(): Promise<EquipmentResponse> {
  return { categories: equipmentCategories };
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
    if (query.equipmentIds?.length && !roomHasAllEquipment(s.room.id, s.studio.id, query.equipmentIds)) return false;
    if (query.timeWindows?.length) {
      const inWindow = query.timeWindows.some(
        (w) => s.startTime >= w.from && (w.to === '24:00' || s.startTime < w.to),
      );
      if (!inWindow) return false;
    }
    return true;
  });

  if (query.minDuration && query.minDuration > 1) {
    filtered = applyMinDuration(filtered, query.minDuration);
  }

  return { dates: effectiveDates, slots: filtered };
}

function roomHasAllEquipment(roomId: number, studioId: number, equipmentIds: number[]) {
  const studio = studioList.find((s) => s.id === studioId);
  const room = studio?.rooms.find((r) => r.id === roomId);
  const available = new Set([
    ...(studio?.equipment ?? []).map((equipment) => equipment.id),
    ...(room?.equipment ?? []).map((equipment) => equipment.id),
  ]);
  return equipmentIds.every((equipmentId) => available.has(equipmentId));
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
