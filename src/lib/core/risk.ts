import type { Candle } from '../utils/csv';
import { atr } from '../tech/atr';
import type { PatternDetection } from '../tech/patternEngine';
import type { Regime } from '../tech/regimeDetector';

export type TradeMode = 'scalp' | 'swing' | 'position';

export type RiskContext = {
  data: Candle[];
  mode: TradeMode;
  entry: number;
  bias: 'long' | 'short';
  regime: Regime;
  patterns: PatternDetection[];
};

const MODE_STOP_MULTIPLIER: Record<TradeMode, number> = {
  scalp: 0.6,
  swing: 1.2,
  position: 1.8
};

const MODE_TARGET_MULTIPLIER: Record<TradeMode, number> = {
  scalp: 1.5,
  swing: 2,
  position: 3
};

export function atrStop(data: Candle[], mode: TradeMode): number {
  if (!data.length) return 0;
  const atrValues = atr(data, 14);
  const latestAtr = atrValues[atrValues.length - 1] ?? 0;
  return latestAtr * MODE_STOP_MULTIPLIER[mode];
}

export function defaultTargets(
  entry: number,
  stop: number,
  bias: 'long' | 'short',
  mode: TradeMode
): number {
  const riskPerShare = Math.abs(entry - stop);
  const multiplier = MODE_TARGET_MULTIPLIER[mode];
  return bias === 'long' ? entry + riskPerShare * multiplier : entry - riskPerShare * multiplier;
}

export function positionSize({
  riskDollars,
  entry,
  stop,
  bias
}: {
  riskDollars: number;
  entry: number;
  stop: number;
  bias: 'long' | 'short';
}): number {
  const riskPerShare = Math.max(0.01, Math.abs(entry - stop));
  const size = riskDollars / riskPerShare;
  return bias === 'long' ? Math.floor(size) : -Math.floor(size);
}

export function riskReward(entry: number, stop: number, target: number, bias: 'long' | 'short'): number {
  const risk = Math.abs(entry - stop);
  const reward = Math.abs(target - entry);
  if (risk === 0) return 0;
  return Number((reward / risk).toFixed(2));
}

export function confidenceScore(context: RiskContext): number {
  const base = context.regime === 'bull' ? 55 : context.regime === 'bear' ? 45 : 50;
  const patternBonus = context.patterns.reduce((acc, pattern) => acc + pattern.score * 10, 0);
  const modeAdjustment = context.mode === 'scalp' ? -5 : context.mode === 'position' ? 5 : 0;
  const final = Math.max(15, Math.min(95, base + patternBonus + modeAdjustment));
  return Math.round(final);
}

export function buildRiskPlan(context: RiskContext) {
  const stopDistance = atrStop(context.data, context.mode);
  const rawStop = context.bias === 'long' ? context.entry - stopDistance : context.entry + stopDistance;
  const target = defaultTargets(context.entry, rawStop, context.bias, context.mode);
  const rr = riskReward(context.entry, rawStop, target, context.bias);
  const confidence = confidenceScore(context);
  return {
    stop: Number(rawStop.toFixed(2)),
    target: Number(target.toFixed(2)),
    rr,
    confidence
  };
}
