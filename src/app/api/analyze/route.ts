import { NextResponse } from 'next/server';
import { fromOhlcvTuples } from '../../../lib/utils/csv';
import { ema } from '../../../lib/tech/ema';
import { atr } from '../../../lib/tech/atr';

type AnalyzeBody = {
  symbol?: string;
  timeframe?: string;
  mode?: 'scalp' | 'swing' | 'position';
  ohlcv?: Array<[number | string, number, number, number, number, number]>;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export async function POST(request: Request) {
  const json = (await request.json().catch(() => null)) as AnalyzeBody | null;

  if (!json || !json.symbol || !json.timeframe || !json.mode || !Array.isArray(json.ohlcv)) {
    return NextResponse.json({ error: 'invalid_payload' }, { status: 400 });
  }

  const candles = fromOhlcvTuples(json.ohlcv);

  if (candles.length < 20) {
    return NextResponse.json({ error: 'not enough candles' }, { status: 422 });
  }

  const closes = candles.map((candle) => candle.close);
  const highs = candles.map((candle) => candle.high);
  const lows = candles.map((candle) => candle.low);
  const volumes = candles.map((candle) => candle.volume);

  const ema20 = ema(closes, Math.min(20, closes.length));
  const ema50 = ema(closes, Math.min(50, closes.length));
  const atrSeries = atr(candles, Math.min(14, candles.length));

  const lastClose = closes[closes.length - 1];
  const priorClose = closes[Math.max(0, closes.length - 2)];
  const ema20Last = ema20[ema20.length - 1] ?? lastClose;
  const ema50Last = ema50[ema50.length - 1] ?? lastClose;
  const ema20Slope = ema20Last - (ema20[Math.max(0, ema20.length - 5)] ?? ema20Last);
  const ema50Slope = ema50Last - (ema50[Math.max(0, ema50.length - 5)] ?? ema50Last);
  const atrLast = atrSeries[atrSeries.length - 1] ?? Math.abs(lastClose - priorClose) || lastClose * 0.002;

  const bias = lastClose >= ema20Last ? 'long' : 'short';
  const regime = ema50Slope > 0 ? 'bull' : ema50Slope < 0 ? 'bear' : 'neutral';
  const priceChange10 = closes.length > 10 ? ((lastClose - closes[closes.length - 11]) / closes[closes.length - 11]) * 100 : 0;
  const rangeHigh = Math.max(...highs.slice(-Math.min(50, highs.length)));
  const rangeLow = Math.min(...lows.slice(-Math.min(50, lows.length)));
  const averageVolume = volumes.slice(-Math.min(20, volumes.length)).reduce((acc, value) => acc + value, 0) /
    Math.min(20, volumes.length);
  const latestVolume = volumes[volumes.length - 1];

  const riskMultiplier = json.mode === 'position' ? 2.8 : json.mode === 'swing' ? 2 : 1.4;
  const stopDistance = Math.max(atrLast * (json.mode === 'scalp' ? 1.1 : 1.5), lastClose * 0.0025);

  const entry = lastClose;
  const stop = bias === 'long' ? entry - stopDistance : entry + stopDistance;
  const target = bias === 'long' ? entry + atrLast * riskMultiplier : entry - atrLast * riskMultiplier;

  const rr = Math.abs(target - entry) / Math.max(Math.abs(entry - stop), 1e-6);
  const confidenceBase = 50 + clamp((ema20Slope / entry) * 200, -15, 15) + clamp(priceChange10, -20, 20);
  const volumeInfluence = clamp(((latestVolume - averageVolume) / Math.max(averageVolume, 1)) * 15, -10, 15);
  const confidence = clamp(confidenceBase + volumeInfluence, 5, 95);

  const modeLabel = json.mode === 'scalp' ? 'Scalp' : json.mode === 'swing' ? 'Swing' : 'Position';
  const directionText = bias === 'long' ? 'Long setup' : 'Short setup';
  const trendDescriptor = ema50Slope > 0 ? 'rising' : ema50Slope < 0 ? 'falling' : 'flat';
  const volatilityDescriptor = atrLast / entry;

  const reportLines = [
    `Regime: ${regime.toUpperCase()} • ${json.symbol.toUpperCase()} ${json.timeframe} ${modeLabel}`,
    `${directionText} with price ${entry.toFixed(2)} vs EMA20 ${ema20Last.toFixed(2)} and EMA50 ${ema50Last.toFixed(2)}.`,
    `Trend: EMA20 slope ${ema20Slope >= 0 ? 'up' : 'down'} ${ema20Slope.toFixed(2)} pts • EMA50 ${trendDescriptor} ${ema50Slope.toFixed(2)} pts.`,
    `Momentum: 10-bar change ${priceChange10.toFixed(2)}% • Volatility ${Math.round(volatilityDescriptor * 100)} bps ATR.`,
    `Plan: ${bias === 'long' ? 'Buy pullbacks' : 'Sell rallies'} near ${entry.toFixed(2)}, protect ${stop.toFixed(2)}, aim ${target.toFixed(2)}.`,
    `Risk: R:R ${rr.toFixed(2)} • Confidence ${Math.round(confidence)}%.`,
    `Context: Range ${rangeLow.toFixed(2)} – ${rangeHigh.toFixed(2)} across ${candles.length} bars • Volume ${latestVolume.toLocaleString()}.`
  ];

  return NextResponse.json({
    regime,
    report: reportLines.join('\n'),
    stats: {
      rr: Number(rr.toFixed(2)),
      confidence: Math.round(confidence)
    },
    levels: {
      entry,
      stop,
      target
    }
  });
}
