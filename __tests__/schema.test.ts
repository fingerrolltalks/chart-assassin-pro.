import { describe, expect, it } from 'vitest';
import { analyzeInputSchema } from '../src/lib/core/schema';

describe('schema validation', () => {
  it('validates analyze payloads', () => {
    const payload = {
      ticker: 'SPY',
      timeframe: '15m',
      mode: 'scalp',
      ohlcv: Array.from({ length: 6 }, (_, idx) => [idx, 1, 2, 0.5, 1.5, 1000]),
      catalysts: ['CPI tomorrow']
    };
    const result = analyzeInputSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects invalid payloads', () => {
    const result = analyzeInputSchema.safeParse({ ticker: '', timeframe: '', mode: 'invalid', ohlcv: [] });
    expect(result.success).toBe(false);
  });
});
