import type { Candle } from '../utils/csv';
import type { PatternDetection } from '../tech/patternEngine';
import type { RegimeSignals, Regime } from '../tech/regimeDetector';
import { formatTime } from '../utils/time';
import { buildRiskPlan, type TradeMode, type RiskContext } from './risk';

export type PlaybookArgs = {
  ticker: string;
  timeframe: string;
  mode: TradeMode;
  regime: Regime;
  signals: RegimeSignals;
  data: Candle[];
  patterns: PatternDetection[];
  catalysts: string[];
};

export type PlaybookPlan = ReturnType<typeof buildRiskPlan> & {
  bias: 'long' | 'short';
  bullets: string[];
  executionLine: string;
};

function inferBias(patterns: PatternDetection[], regime: Regime): 'long' | 'short' {
  const bullishPatterns = patterns.filter((p) => ['flag', 'doubleBottom'].includes(p.type));
  const bearishPatterns = patterns.filter((p) => ['hs', 'doubleTop'].includes(p.type));
  if (bullishPatterns.length > bearishPatterns.length) return 'long';
  if (bearishPatterns.length > bullishPatterns.length) return 'short';
  return regime === 'bear' ? 'short' : 'long';
}

function catalystSummary(catalysts: string[]): string {
  if (!catalysts.length) return 'No major catalysts logged';
  return catalysts.join(', ');
}

function patternSummary(patterns: PatternDetection[]): string {
  if (!patterns.length) return 'No high conviction patterns';
  return patterns
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((pattern) => `${pattern.type} (${Math.round(pattern.score * 100)}%)`)
    .join(', ');
}

export function buildPlaybook(args: PlaybookArgs): PlaybookPlan {
  const bias = inferBias(args.patterns, args.regime);
  const entry = args.data[args.data.length - 1]?.close ?? 0;
  const context: RiskContext = {
    data: args.data,
    bias,
    entry,
    mode: args.mode,
    regime: args.regime,
    patterns: args.patterns
  };
  const risk = buildRiskPlan(context);
  const biasEmoji = bias === 'long' ? '🟢' : '🔴';
  const catalystText = catalystSummary(args.catalysts);
  const patternText = patternSummary(args.patterns);
  const timeframeStart = args.data[0] ? formatTime(args.data[0].ts) : 'n/a';
  const timeframeEnd = args.data[args.data.length - 1]
    ? formatTime(args.data[args.data.length - 1].ts)
    : 'n/a';

  const bullets = [
    `• Bias ${biasEmoji} ${bias.toUpperCase()} — Mode: ${args.mode}`,
    `• Catalyst: ${catalystText}`,
    `• Entry: ${entry.toFixed(2)} from ${timeframeStart} to ${timeframeEnd}`,
    `• 🚫 Stop: ${risk.stop.toFixed(2)} (ATR-adjusted)`,
    `• 🎯 Target: ${risk.target.toFixed(2)} with R:R ${risk.rr}`,
    `• Confidence: ${risk.confidence}% | Patterns: ${patternText}`,
    `• Regime signals: SPY ${args.signals.emas.spy}, breadth ${args.signals.breadth}, VIX ${args.signals.vix} (${args.signals.gammaFlip ? 'gamma flip risk' : 'stable'})`
  ];

  const executionLine = `Execute: Plan ${bias === 'long' ? 'buy' : 'short'} ${args.ticker} near ${entry.toFixed(2)} with stop ${risk.stop.toFixed(2)} and target ${risk.target.toFixed(2)}.`;

  return {
    ...risk,
    bias,
    bullets,
    executionLine
  };
}
