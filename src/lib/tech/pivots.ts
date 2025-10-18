import type { Candle } from '../../lib/utils/csv';

export type Pivot = {
  index: number;
  price: number;
  type: 'high' | 'low';
};

export function findPivots(data: Candle[], lookback = 3): Pivot[] {
  const pivots: Pivot[] = [];
  for (let i = lookback; i < data.length - lookback; i += 1) {
    const current = data[i];
    let isHigh = true;
    let isLow = true;
    for (let j = 1; j <= lookback; j += 1) {
      if (data[i - j].high >= current.high || data[i + j].high >= current.high) {
        isHigh = false;
      }
      if (data[i - j].low <= current.low || data[i + j].low <= current.low) {
        isLow = false;
      }
    }
    if (isHigh) {
      pivots.push({ index: i, price: current.high, type: 'high' });
    }
    if (isLow) {
      pivots.push({ index: i, price: current.low, type: 'low' });
    }
  }
  return pivots.sort((a, b) => a.index - b.index);
}
