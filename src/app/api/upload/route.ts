import { NextResponse } from 'next/server';
import { parseCsv, type Candle } from '../../../lib/utils/csv';
import { ema } from '../../../lib/tech/ema';
import { regimeDetector } from '../../../lib/tech/regimeDetector';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function buildIndicators(candles: Candle[]) {
  const closes = candles.map((candle) => candle.close);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);

  let cumulativeVolume = 0;
  let cumulativeTypical = 0;
  const vwap: number[] = [];

  candles.forEach((candle) => {
    const typical = (candle.high + candle.low + candle.close) / 3;
    cumulativeTypical += typical * candle.volume;
    cumulativeVolume += candle.volume;
    vwap.push(cumulativeVolume === 0 ? candle.close : cumulativeTypical / cumulativeVolume);
  });

  return { ema20, ema50, ema200, vwap };
}

function serializeCandles(candles: Candle[], indicators: ReturnType<typeof buildIndicators>) {
  return candles.map((candle, index) => ({
    ...candle,
    ema20: indicators.ema20[index] ?? null,
    ema50: indicators.ema50[index] ?? null,
    ema200: indicators.ema200[index] ?? null,
    vwap: indicators.vwap[index] ?? null
  }));
}

async function readCsvFromRequest(request: Request): Promise<Candle[]> {
  const contentType = request.headers.get('content-type') ?? '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const file = formData.get('file');
    if (!file || typeof file === 'string') {
      throw new Error('Missing file upload');
    }
    const text = await file.text();
    return parseCsv(text);
  }

  if (contentType.includes('text/csv') || contentType.includes('application/csv')) {
    const text = await request.text();
    return parseCsv(text);
  }

  throw new Error('Unsupported content type');
}

export async function POST(request: Request) {
  try {
    const candles = await readCsvFromRequest(request);

    if (!candles.length) {
      return NextResponse.json({ error: 'No candles parsed from CSV upload.' }, { status: 400 });
    }

    const indicators = buildIndicators(candles);

    const vixSeries = candles.map((candle) => Math.max(10, candle.close * 0.02));
    const tnxSeries = candles.map((candle) => Math.max(3, candle.close * 0.005));

    const detection = regimeDetector({
      spy: candles,
      qqq: candles,
      iwm: candles,
      vix: vixSeries.slice(-Math.min(vixSeries.length, 120)),
      tnx: tnxSeries.slice(-Math.min(tnxSeries.length, 120))
    });

    return NextResponse.json({
      candles: serializeCandles(candles, indicators),
      indicators,
      regime: detection.regime,
      signals: detection.signals
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status =
      message === 'Unsupported content type'
        ? 415
        : message === 'Missing file upload'
          ? 400
          : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
