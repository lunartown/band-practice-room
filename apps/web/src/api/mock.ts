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

const today = '2026-06-15';
const tomorrow = '2026-06-16';
const afterTomorrow = '2026-06-17';

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

const slots: Slot[] = [
  slot(1, today, '14:00', '16:00', 1, 1, 'A룸', 32000, 'fresh', '2026-06-15T09:21:00+09:00'),
  slot(2, today, '16:00', '18:00', 3, 2, '스튜디오 A', 36000, 'recent', '2026-06-15T09:12:00+09:00'),
  slot(3, today, '18:00', '19:00', 2, 3, '2관', 14000, 'recent', '2026-06-15T09:04:00+09:00'),
  slot(4, today, '20:00', '22:00', 1, 4, '라이브룸', 40000, 'aging', '2026-06-15T08:24:00+09:00'),
  slot(5, today, '21:00', '23:00', 3, 5, '스튜디오 B', 36000, 'stale', '2026-06-15T01:24:00+09:00'),
  slot(6, tomorrow, '10:00', '12:00', 3, 6, '스튜디오 B', 36000, 'fresh', '2026-06-15T09:19:00+09:00'),
  slot(7, tomorrow, '13:00', '16:00', 2, 7, '1관', 42000, 'recent', '2026-06-15T09:09:00+09:00'),
  slot(8, tomorrow, '19:00', '21:00', 1, 8, 'B룸', 32000, 'recent', '2026-06-15T08:54:00+09:00'),
  slot(9, afterTomorrow, '11:00', '13:00', 1, 1, 'A룸', 32000, 'fresh', '2026-06-15T09:24:00+09:00'),
  slot(10, afterTomorrow, '15:00', '17:00', 3, 2, '스튜디오 A', 36000, 'aging', '2026-06-15T07:24:00+09:00'),
  slot(11, today, '18:00', '20:00', 3, 2, '스튜디오 A', 0, 'fresh', '2026-06-15T09:24:00+09:00', 'UNAVAILABLE'),
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
