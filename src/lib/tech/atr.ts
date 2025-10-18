import { ema } from './ema';
import type { Candle } from '../../lib/utils/csv';

export function atr(data: Candle[], period: number): number[] {
  if (!data.length) return [];
  const trueRanges: number[] = [];
  for (let i = 0; i < data.length; i += 1) {
    const current = data[i];
    const prev = i > 0 ? data[i - 1] : current;
    const highLow = current.high - current.low;
    const highClose = Math.abs(current.high - prev.close);
    const lowClose = Math.abs(current.low - prev.close);
    trueRanges.push(Math.max(highLow, highClose, lowClose));
  }
  return ema(trueRanges, period);
}
