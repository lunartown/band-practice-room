import type { Area, Slot, SlotsQuery, SlotsResponse, Studio } from './types';

export const areas: Area[] = [
  { id: 1, slug: 'hongdae', name: '홍대' },
  { id: 2, slug: 'hapjeong', name: '합정' },
  { id: 3, slug: 'sinchon', name: '신촌' },
];

export const studios: Studio[] = [
  { id: 1, slug: 'ground-hongdae', name: '그라운드 합주실 홍대 본점', primaryAreaId: 1, primaryAreaName: '홍대', areaIds: [1], address: '서울시 마포구' },
  { id: 2, slug: 'ground-hapjeong', name: '그라운드 합주실 합정 1호점', primaryAreaId: 2, primaryAreaName: '합정', areaIds: [2], address: '서울시 마포구' },
  { id: 3, slug: 'groove-sinchon', name: '그루브 합주실', primaryAreaId: 3, primaryAreaName: '신촌', areaIds: [3], address: '서울시 서대문구' },
];

function dateStr(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

const today = dateStr(0);
const tomorrow = dateStr(1);
const afterTomorrow = dateStr(2);

const slot = (
  id: number,
  date: string,
  startTime: string,
  endTime: string,
  studioId: number,
  roomId: number,
  roomName: string,
  price: number,
  freshness: Slot['freshness'],
  scrapedAt: string,
  status: Slot['status'] = 'AVAILABLE',
): Slot => {
  const studio = studios.find((item) => item.id === studioId)!;
  const area = areas.find((item) => item.id === studio.primaryAreaId)!;
  return {
    id,
    date,
    startTime,
    endTime,
    status,
    price: status === 'AVAILABLE' ? price : null,
    priceSource: status === 'AVAILABLE' ? 'SCRAPED' : 'UNKNOWN',
    studio,
    room: {
      id: roomId,
      name: roomName,
      pricePerHour: price / durationHours(startTime, endTime),
      capacityMin: 2,
      capacityMax: roomName.includes('라이브') ? 8 : 6,
    },
    area,
    bookingUrl: 'https://example.com/reservation',
    freshness,
    scrapedAt,
  };
};

function nowKst(offsetMinutes: number) {
  const d = new Date(Date.now() - offsetMinutes * 60 * 1000);
  return d.toISOString().replace('Z', '+09:00');
}

const slots: Slot[] = [
  slot(1, today, '14:00', '16:00', 1, 1, 'A룸', 32000, 'fresh', nowKst(3)),
  slot(2, today, '16:00', '18:00', 3, 2, '스튜디오 A', 36000, 'recent', nowKst(12)),
  slot(3, today, '18:00', '19:00', 2, 3, '2관', 14000, 'recent', nowKst(20)),
  slot(4, today, '20:00', '22:00', 1, 4, '라이브룸', 40000, 'aging', nowKst(60)),
  slot(5, today, '21:00', '23:00', 3, 5, '스튜디오 B', 36000, 'stale', nowKst(480)),
  slot(6, tomorrow, '10:00', '12:00', 3, 6, '스튜디오 B', 36000, 'fresh', nowKst(5)),
  slot(7, tomorrow, '13:00', '16:00', 2, 7, '1관', 42000, 'recent', nowKst(15)),
  slot(8, tomorrow, '19:00', '21:00', 1, 8, 'B룸', 32000, 'recent', nowKst(30)),
  slot(9, afterTomorrow, '11:00', '13:00', 1, 1, 'A룸', 32000, 'fresh', nowKst(0)),
  slot(10, afterTomorrow, '15:00', '17:00', 3, 2, '스튜디오 A', 36000, 'aging', nowKst(120)),
  slot(11, today, '18:00', '20:00', 3, 2, '스튜디오 A', 0, 'fresh', nowKst(0), 'UNAVAILABLE'),
];

export async function getMockAreas() {
  return { areas };
}

export async function getMockStudios(areaId?: number) {
  return {
    studios: areaId ? studios.filter((studio) => studio.areaIds?.includes(areaId)) : studios,
  };
}

export async function getMockSlots(query: SlotsQuery): Promise<SlotsResponse> {
  const filtered = slots.filter((item) => {
    if (item.date < query.dateFrom || item.date > query.dateTo) return false;
    if (query.areaId && !item.studio.areaIds?.includes(query.areaId)) return false;
    if (query.studioId && item.studio.id !== query.studioId) return false;
    return true;
  });

  return {
    dateFrom: query.dateFrom,
    dateTo: query.dateTo,
    slots: filtered,
  };
}

function durationHours(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  return (endHour * 60 + endMinute - startHour * 60 - startMinute) / 60;
}
