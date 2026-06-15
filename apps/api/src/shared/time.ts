export function formatTime(value: string | Date) {
  if (value instanceof Date) {
    return value.toISOString().slice(11, 16);
  }

  return value.slice(0, 5);
}

export function toIsoString(value: string | Date) {
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}
