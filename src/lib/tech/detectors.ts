import type { Candle } from '../utils/csv';
import { ema } from './ema';
import { mean, normalizeScore, pctChange, slope, standardDeviation } from '../utils/math';

export type DetectorResult = {
  score: number;
  notes: string;
};

export function emaStackSignal(close: number[]): 'bull' | 'bear' | 'mixed' {
  if (close.length < 200) return 'mixed';
  const ema20 = ema(close, 20);
  const ema50 = ema(close, 50);
  const ema200 = ema(close, 200);
  const latest = close.length - 1;
  const value20 = ema20[latest];
  const value50 = ema50[latest];
  const value200 = ema200[latest];
  if (value20 > value50 && value50 > value200) return 'bull';
  if (value20 < value50 && value50 < value200) return 'bear';
  return 'mixed';
}

export function breadthProxy(spyEqualWeight: number[], spy: number[]): number {
  if (!spyEqualWeight.length || spyEqualWeight.length !== spy.length) return 0.5;
  const ratios = spyEqualWeight.map((eq, idx) => (spy[idx] === 0 ? 1 : eq / spy[idx]));
  const avg = mean(ratios);
  return Number(avg.toFixed(2));
}

export function vixTrend(values: number[]): 'up' | 'down' | 'flat' {
  const s = slope(values.slice(-20));
  if (s > 0.02) return 'up';
  if (s < -0.02) return 'down';
  return 'flat';
}

export function yieldTrend(values: number[]): 'up' | 'down' | 'flat' {
  const s = slope(values.slice(-20));
  if (s > 0.01) return 'up';
  if (s < -0.01) return 'down';
  return 'flat';
}

export function volatilityCompression(data: Candle[]): DetectorResult {
  if (data.length < 10) return { score: 0, notes: 'insufficient data' };
  const closes = data.map((d) => d.close);
  const std = standardDeviation(closes.slice(-20));
  const score = normalizeScore(1 / (std + 1e-6), 0, 5);
  return {
    score,
    notes: `20-bar std dev ${std.toFixed(2)}`
  };
}

export function trendStrength(data: Candle[]): DetectorResult {
  if (data.length < 10) return { score: 0, notes: 'insufficient data' };
  const closes = data.map((d) => d.close);
  const s = slope(closes.slice(-30));
  const rr = pctChange(closes[closes.length - 1], closes[Math.max(0, closes.length - 30)]);
  const score = normalizeScore(Math.abs(s) + Math.abs(rr), 0, 0.5);
  return {
    score,
    notes: `slope ${s.toFixed(4)}, pct ${ (rr * 100).toFixed(2) }%`
  };
}

export function liquiditySweep(data: Candle[]): DetectorResult {
  if (data.length < 5) return { score: 0, notes: 'insufficient data' };
  const recent = data.slice(-5);
  const longWicks = recent.filter((candle) => {
    const body = Math.abs(candle.close - candle.open);
    const wick = candle.high - candle.low;
    return wick > body * 2;
  });
  const score = Math.min(1, longWicks.length / recent.length);
  return {
    score,
    notes: `${longWicks.length} of ${recent.length} bars with liquidity sweep traits`
  };
}
