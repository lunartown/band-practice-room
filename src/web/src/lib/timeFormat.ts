function compactTime(time: string): string {
  const [hour, minute] = time.split(':');
  return minute === '00' ? `${Number(hour)}` : `${Number(hour)}:${minute}`;
}

export function formatTimeLabel(time: string): string {
  return `${compactTime(time)}시`;
}

export function formatTimeRangeLabel(from: string, to: string): string {
  return `${compactTime(from)}~${compactTime(to)}시`;
}
