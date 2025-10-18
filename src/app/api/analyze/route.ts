import { NextResponse } from 'next/server';
import { analyzeInputSchema } from '../../../lib/core/schema';
import { fromOhlcvTuples } from '../../../lib/utils/csv';
import { runPatternEngine } from '../../../lib/tech/patternEngine';
import { regimeDetector } from '../../../lib/tech/regimeDetector';
import { buildPlaybook } from '../../../lib/core/templates';
import { formatAssistantContract } from '../../../lib/core/formatter';

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parseResult = analyzeInputSchema.safeParse(json);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
  }

  const { ticker, timeframe, ohlcv, mode, catalysts = [] } = parseResult.data;
  const candles = fromOhlcvTuples(ohlcv);
  const patterns = runPatternEngine(candles);
  const closeSeries = candles.map((candle) => candle.close);
  const vix = closeSeries.slice(-10).map((value) => Math.max(10, value * 0.02));
  const tnx = closeSeries.slice(-10).map((value) => Math.max(3, value * 0.005));
  const detection = regimeDetector({
    spy: candles,
    qqq: candles,
    iwm: candles,
    vix,
    tnx
  });

  const plan = buildPlaybook({
    ticker,
    timeframe,
    mode,
    regime: detection.regime,
    signals: detection.signals,
    data: candles,
    patterns,
    catalysts
  });

  const report = formatAssistantContract({ plan, regime: detection.regime });

  return NextResponse.json({
    regime: detection.regime,
    report,
    stats: {
      rr: plan.rr,
      confidence: plan.confidence
    },
    levels: {
      entry: candles[candles.length - 1]?.close ?? 0,
      stop: plan.stop,
      target: plan.target
    }
  });
}
