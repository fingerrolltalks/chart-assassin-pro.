import { describe, expect, it } from 'vitest';
import { ema } from '../src/lib/tech/ema';
import { atr } from '../src/lib/tech/atr';
import { findPivots } from '../src/lib/tech/pivots';
import { runPatternEngine } from '../src/lib/tech/patternEngine';
import { regimeDetector } from '../src/lib/tech/regimeDetector';
import { fromOhlcvTuples, type Candle } from '../src/lib/utils/csv';

const sample: Candle[] = fromOhlcvTuples([
  [1, 10, 11, 9, 10.5, 1000],
  [2, 10.5, 11.5, 10.2, 11.2, 900],
  [3, 11.2, 11.8, 10.8, 11.5, 950],
  [4, 11.5, 12, 11.2, 11.8, 980],
  [5, 11.8, 12.5, 11.4, 12.1, 1020],
  [6, 12.1, 12.7, 11.9, 12.4, 1010],
  [7, 12.4, 12.9, 12.1, 12.7, 990],
  [8, 12.7, 13, 12.4, 12.6, 995]
]);

describe('technical utilities', () => {
  it('computes ema series', () => {
    const result = ema(sample.map((c) => c.close), 3);
    expect(result).toHaveLength(sample.length);
    expect(result.at(-1)).toBeGreaterThan(result[0]);
  });

  it('computes atr series', () => {
    const result = atr(sample, 3);
    expect(result).toHaveLength(sample.length);
    expect(result.at(-1)).toBeGreaterThan(0);
  });

  it('finds pivots', () => {
    const pivots = findPivots(sample, 2);
    expect(pivots.length).toBeGreaterThan(0);
  });

  it('detects patterns without crashing', () => {
    const patterns = runPatternEngine(sample);
    expect(Array.isArray(patterns)).toBe(true);
  });

  it('produces regime signals', () => {
    const detection = regimeDetector({
      spy: sample,
      qqq: sample,
      iwm: sample,
      vix: sample.map((c) => c.close * 0.02),
      tnx: sample.map((c) => c.close * 0.01)
    });
    expect(['bull', 'bear', 'neutral']).toContain(detection.regime);
    expect(detection.signals.breadth).toBeGreaterThan(0);
  });
});
