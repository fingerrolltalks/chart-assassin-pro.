import { NextResponse } from 'next/server';

type TimeframeConfig = { interval: string; range: string };

const timeframeConfig: Record<string, TimeframeConfig> = {
  '1m': { interval: '1m', range: '1d' },
  '5m': { interval: '5m', range: '5d' },
  '15m': { interval: '15m', range: '5d' },
  '30m': { interval: '30m', range: '1mo' },
  '1h': { interval: '60m', range: '1mo' },
  '1d': { interval: '1d', range: '6mo' }
};

type CandlePayload = { t: number; o: number; h: number; l: number; c: number; v: number };

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbolParam = searchParams.get('symbol');
    const tf = searchParams.get('tf');
    const limitParam = searchParams.get('limit');

    if (!symbolParam || !tf) {
      return NextResponse.json({ error: 'missing_params' }, { status: 400 });
    }

    const symbol = symbolParam.trim().toUpperCase();
    const config = timeframeConfig[tf];

    if (!config) {
      return NextResponse.json({ error: 'unsupported_timeframe' }, { status: 400 });
    }

    const limit = Number(limitParam ?? '500');

    const url = new URL(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`);
    url.searchParams.set('interval', config.interval);
    url.searchParams.set('range', config.range);

    const response = await fetch(url.toString(), { cache: 'no-store' });

    if (!response.ok) {
      const details = await response.text();
      throw new Error(details || `Provider returned status ${response.status}`);
    }

    const json = await response.json();
    const result = json?.chart?.result?.[0];
    const quote = result?.indicators?.quote?.[0];
    const timestamps: number[] | undefined = result?.timestamp;

    if (!result || !quote || !Array.isArray(timestamps)) {
      throw new Error('Malformed provider response');
    }

    const candles: CandlePayload[] = [];
    for (let index = 0; index < timestamps.length; index += 1) {
      const open = quote.open?.[index];
      const high = quote.high?.[index];
      const low = quote.low?.[index];
      const close = quote.close?.[index];
      const volume = quote.volume?.[index] ?? 0;
      if ([open, high, low, close].some((value) => value == null)) {
        continue;
      }
      candles.push({
        t: timestamps[index] * 1000,
        o: Number(open),
        h: Number(high),
        l: Number(low),
        c: Number(close),
        v: Number(volume)
      });
    }

    const sliced = limit > 0 ? candles.slice(-Math.min(limit, candles.length)) : candles;

    return NextResponse.json({ symbol, tf, limit: sliced.length, candles: sliced });
  } catch (err: any) {
    const details = err?.message ?? 'Unknown provider failure';
    return NextResponse.json({ error: 'provider_error', details }, { status: 502 });
  }
}
