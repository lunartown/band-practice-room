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

export function relativeCheckedText(scrapedAt?: string, freshness?: string) {
  if (!scrapedAt) return '확인 시각 없음';
  const base = new Date('2026-06-15T09:24:00+09:00').getTime();
  const diffMinutes = Math.max(0, Math.round((base - new Date(scrapedAt).getTime()) / 60000));
  if (diffMinutes < 1) return '방금 확인';
  if (diffMinutes < 60) return `${diffMinutes}분 전`;
  const hours = Math.round(diffMinutes / 60);
  return freshness === 'stale' ? `${hours}시간 전 · 오래됨` : `${hours}시간 전`;
}

export function dateLabel(date: string) {
  const labels: Record<string, string> = {
    '2026-06-15': '오늘 · 6/15 (월)',
    '2026-06-16': '내일 · 6/16 (화)',
  };
  if (labels[date]) return labels[date];
  const value = new Date(`${date}T00:00:00+09:00`);
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
  }).format(value);
}
