import { toUnix } from './time';

export type Candle = {
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export function parseCsv(content: string): Candle[] {
  const lines = content.trim().split(/\r?\n/);
  if (lines.length <= 1) return [];
  const data: Candle[] = [];
  for (let i = 1; i < lines.length; i += 1) {
    const row = lines[i].trim();
    if (!row) continue;
    const [ts, open, high, low, close, volume] = row.split(',');
    data.push({
      ts: toUnix(ts),
      open: Number(open),
      high: Number(high),
      low: Number(low),
      close: Number(close),
      volume: Number(volume)
    });
  }
  return data;
}

export function parseJson(content: string): Candle[] {
  const value = JSON.parse(content);
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => {
      if (Array.isArray(entry)) {
        const [ts, o, h, l, c, v] = entry;
        return {
          ts: toUnix(ts),
          open: Number(o),
          high: Number(h),
          low: Number(l),
          close: Number(c),
          volume: Number(v)
        } satisfies Candle;
      }
      if (typeof entry === 'object' && entry) {
        const { ts, o, h, l, c, v, open, high, low, close, volume } = entry as Record<string, number>;
        return {
          ts: toUnix(ts ?? entry.time ?? Date.now()),
          open: Number(o ?? open),
          high: Number(h ?? high),
          low: Number(l ?? low),
          close: Number(c ?? close),
          volume: Number(v ?? volume)
        } satisfies Candle;
      }
      return undefined;
    })
    .filter(Boolean) as Candle[];
}

export function toOhlcvTuples(data: Candle[]): [number, number, number, number, number, number][] {
  return data.map((candle) => [
    candle.ts,
    candle.open,
    candle.high,
    candle.low,
    candle.close,
    candle.volume
  ]);
}

export function fromOhlcvTuples(
  tuples: Array<[number | string, number, number, number, number, number]>
): Candle[] {
  return tuples.map(([ts, open, high, low, close, volume]) => ({
    ts: toUnix(ts),
    open,
    high,
    low,
    close,
    volume
  }));
}
