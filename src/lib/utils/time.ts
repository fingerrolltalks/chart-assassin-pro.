export function toUnix(input: string | number | Date): number {
  if (typeof input === 'number') return input;
  if (input instanceof Date) return input.getTime();
  return new Date(input).getTime();
}

export function formatTime(ts: number): string {
  const date = new Date(ts);
  return `${date.toISOString().replace('T', ' ').slice(0, 16)}Z`;
}

export function timeframeLabel(tf: string): string {
  const map: Record<string, string> = {
    '1m': '1 Minute',
    '5m': '5 Minute',
    '15m': '15 Minute',
    '1h': '1 Hour',
    '4h': '4 Hour',
    D: 'Daily'
  };
  return map[tf] ?? tf;
}
