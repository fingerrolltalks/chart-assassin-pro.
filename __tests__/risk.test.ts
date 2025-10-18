import { describe, expect, it } from 'vitest';
import { buildRiskPlan, positionSize } from '../src/lib/core/risk';
import { fromOhlcvTuples } from '../src/lib/utils/csv';

const sample = fromOhlcvTuples([
  [1, 10, 11, 9.5, 10.2, 1000],
  [2, 10.3, 10.9, 9.9, 10.7, 1000],
  [3, 10.7, 11.2, 10.5, 11.1, 1000],
  [4, 11.1, 11.6, 10.8, 11.4, 1000],
  [5, 11.4, 11.8, 11.1, 11.7, 1000]
]);

describe('risk utilities', () => {
  it('builds a risk plan', () => {
    const plan = buildRiskPlan({
      data: sample,
      mode: 'swing',
      entry: 11.7,
      bias: 'long',
      regime: 'bull',
      patterns: []
    });
    expect(plan.stop).toBeLessThan(11.7);
    expect(plan.target).toBeGreaterThan(11.7);
    expect(plan.rr).toBeGreaterThan(0);
  });

  it('sizes a position correctly', () => {
    const size = positionSize({ riskDollars: 500, entry: 100, stop: 99, bias: 'long' });
    expect(size).toBe(500);
  });
});
