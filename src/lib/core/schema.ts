import { z } from 'zod';

export const ohlcvTupleSchema = z
  .array(
    z.tuple([
      z.union([z.number(), z.string()]),
      z.number(),
      z.number(),
      z.number(),
      z.number(),
      z.number()
    ])
  )
  .min(5, 'At least five candles are required');

export const analyzeInputSchema = z.object({
  ticker: z.string().min(1),
  timeframe: z.string().min(1),
  ohlcv: ohlcvTupleSchema,
  mode: z.enum(['scalp', 'swing', 'position']),
  catalysts: z.array(z.string()).optional()
});

export const patternInputSchema = z.object({
  ohlcv: ohlcvTupleSchema
});

export const regimeInputSchema = z.object({
  spy: ohlcvTupleSchema,
  qqq: ohlcvTupleSchema,
  iwm: ohlcvTupleSchema,
  vix: z.array(z.number()).min(5),
  tnx: z.array(z.number()).min(5)
});

export type AnalyzeInput = z.infer<typeof analyzeInputSchema>;
export type PatternInput = z.infer<typeof patternInputSchema>;
export type RegimeInput = z.infer<typeof regimeInputSchema>;
