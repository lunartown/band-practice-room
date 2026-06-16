import type { Freshness } from '../api/types';

export function formatWon(value: number | null) {
  if (value == null) return '가격 미확인';
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0,
  }).format(value);
}

export function durationText(startTime: string, endTime: string) {
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  const minutes = endHour * 60 + endMinute - startHour * 60 - startMinute;
  const hours = minutes / 60;
  return Number.isInteger(hours) ? `${hours}시간` : `${minutes}분`;
}

export function computeFreshness(scrapedAt: string | undefined): Freshness {
  if (!scrapedAt) return 'unknown';
  const ageMinutes = (Date.now() - new Date(scrapedAt).getTime()) / 60000;
  if (ageMinutes < 30) return 'fresh';
  if (ageMinutes < 120) return 'recent';
  if (ageMinutes < 360) return 'aging';
  return 'stale';
}

export function relativeCheckedText(scrapedAt?: string, freshness?: Freshness) {
  if (!scrapedAt) return '확인 시각 없음';
  const diffMinutes = Math.max(0, Math.round((Date.now() - new Date(scrapedAt).getTime()) / 60000));
  if (diffMinutes < 1) return '방금 확인';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const hours = Math.round(diffMinutes / 60);
  return freshness === 'stale' ? `${hours}시간 전 · 오래됨` : `${hours}시간 전`;
}

export function todayKst() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function addDays(dateStr: string, days: number) {
  const d = new Date(`${dateStr}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

const DOW_KO = ['일', '월', '화', '수', '목', '금', '토'];

export function dateLabel(date: string) {
  const today = todayKst();
  const tomorrow = addDays(today, 1);
  const d = new Date(`${date}T00:00:00+09:00`);
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const dowIdx = d.getDay();
  const base = `${month}/${day} (${DOW_KO[dowIdx]})`;
  let suffix = '';
  if (date === today) suffix = '오늘';
  else if (date === tomorrow) suffix = '내일';
  else if (dowIdx === 0 || dowIdx === 6) suffix = '주말';
  return suffix ? `${base} ${suffix}` : base;
}

export function shortDateLabel(date: string) {
  const d = new Date(`${date}T00:00:00+09:00`);
  return `${d.getMonth() + 1}/${d.getDate()} (${DOW_KO[d.getDay()]})`;
}
