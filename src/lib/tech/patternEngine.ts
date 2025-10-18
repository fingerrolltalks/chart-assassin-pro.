import type { Candle } from '../utils/csv';
import { ema } from './ema';
import { findPivots } from './pivots';
import { liquiditySweep, trendStrength, volatilityCompression } from './detectors';
import { mean, normalizeScore, pctChange } from '../utils/math';

export type PatternType =
  | 'flag'
  | 'wedge'
  | 'doubleTop'
  | 'doubleBottom'
  | 'hs'
  | 'liquiditySweep'
  | 'divergence';

export type PatternDetection = {
  type: PatternType;
  score: number;
  notes?: string;
  startIndex?: number;
  endIndex?: number;
};

function detectFlag(data: Candle[]): PatternDetection | null {
  if (data.length < 15) return null;
  const closes = data.map((d) => d.close);
  const ema20 = ema(closes, 20);
  const slope20 = ema20[ema20.length - 1] - ema20[Math.max(0, ema20.length - 5)];
  const compression = volatilityCompression(data.slice(-12));
  const score = normalizeScore(Math.abs(slope20) * 10 + compression.score, 0, 2);
  if (score < 0.3) return null;
  return {
    type: 'flag',
    score,
    notes: `EMA trend ${slope20 >= 0 ? 'up' : 'down'} with consolidation`,
    startIndex: Math.max(0, data.length - 12),
    endIndex: data.length - 1
  };
}

function detectWedge(data: Candle[]): PatternDetection | null {
  if (data.length < 20) return null;
  const recent = data.slice(-20);
  const highs = recent.map((c) => c.high);
  const lows = recent.map((c) => c.low);
  const highSlope = highs[highs.length - 1] - highs[0];
  const lowSlope = lows[lows.length - 1] - lows[0];
  const converging = Math.sign(highSlope) === -Math.sign(lowSlope);
  const score = converging ? normalizeScore(Math.abs(highSlope - lowSlope), 0, 2) : 0;
  if (score < 0.25) return null;
  return {
    type: 'wedge',
    score,
    notes: 'Highs and lows converging over last 20 bars',
    startIndex: data.length - 20,
    endIndex: data.length - 1
  };
}

function detectDoubleExtrema(data: Candle[], type: 'top' | 'bottom'): PatternDetection | null {
  const pivots = findPivots(data, 3).filter((pivot) => pivot.type === (type === 'top' ? 'high' : 'low'));
  if (pivots.length < 2) return null;
  const lastTwo = pivots.slice(-2);
  const distance = Math.abs(lastTwo[1].price - lastTwo[0].price);
  const base = mean(data.slice(-20).map((d) => d.close));
  const tolerance = base * 0.005;
  if (distance > tolerance) return null;
  const score = normalizeScore(tolerance - distance, 0, tolerance);
  return {
    type: type === 'top' ? 'doubleTop' : 'doubleBottom',
    score,
    notes: `Two swing ${type}s within ${(distance).toFixed(2)} of each other`,
    startIndex: lastTwo[0].index,
    endIndex: lastTwo[1].index
  };
}

function detectHeadAndShoulders(data: Candle[]): PatternDetection | null {
  const pivots = findPivots(data, 3);
  const highs = pivots.filter((p) => p.type === 'high');
  if (highs.length < 3) return null;
  const lastThree = highs.slice(-3);
  const [left, head, right] = lastThree;
  if (!(head.price > left.price && head.price > right.price)) return null;
  const shoulderDiff = Math.abs(left.price - right.price);
  const tolerance = mean(data.slice(-30).map((d) => d.close)) * 0.01;
  if (shoulderDiff > tolerance) return null;
  const score = normalizeScore((head.price - Math.max(left.price, right.price)) / head.price, 0, 0.03);
  if (score <= 0) return null;
  return {
    type: 'hs',
    score,
    notes: 'Potential head and shoulders with balanced shoulders',
    startIndex: left.index,
    endIndex: right.index
  };
}

function detectDivergence(data: Candle[]): PatternDetection | null {
  if (data.length < 40) return null;
  const closes = data.map((d) => d.close);
  const recent = closes.slice(-30);
  const priceChange = pctChange(recent[recent.length - 1], recent[0]);
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macd = recent.map((_, idx) => ema12[closes.length - 30 + idx] - ema26[closes.length - 30 + idx]);
  const macdChange = pctChange(macd[macd.length - 1], macd[0]);
  if (priceChange * macdChange >= 0) return null;
  const score = normalizeScore(Math.abs(priceChange - macdChange), 0, 0.1);
  return {
    type: 'divergence',
    score,
    notes: 'Price and MACD momentum diverging',
    startIndex: data.length - 30,
    endIndex: data.length - 1
  };
}

export function runPatternEngine(data: Candle[]): PatternDetection[] {
  if (!data.length) return [];
  const detections: (PatternDetection | null)[] = [
    detectFlag(data),
    detectWedge(data),
    detectDoubleExtrema(data, 'top'),
    detectDoubleExtrema(data, 'bottom'),
    detectHeadAndShoulders(data),
    detectDivergence(data)
  ];

  const liquidity = liquiditySweep(data);
  if (liquidity.score > 0) {
    detections.push({
      type: 'liquiditySweep',
      score: liquidity.score,
      notes: liquidity.notes,
      startIndex: Math.max(0, data.length - 5),
      endIndex: data.length - 1
    });
  }

  const trend = trendStrength(data);
  if (trend.score > 0.4) {
    detections.push({
      type: 'flag',
      score: Math.min(1, trend.score),
      notes: `Trend strength ${trend.notes}`,
      startIndex: Math.max(0, data.length - 30),
      endIndex: data.length - 1
    });
  }

  return detections.filter(Boolean) as PatternDetection[];
}
