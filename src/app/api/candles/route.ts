import { NextResponse } from 'next/server';

type TimeframeConfig = {
  multiplier: number;
  timespan: 'minute' | 'day';
  windowMs: number;
};

type Candle = {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
};

const HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Cache-Control': 'no-store',
};

const TF_MAP: Record<string, TimeframeConfig> = {
  '1m': { multiplier: 1, timespan: 'minute', windowMs: 60_000 },
  '5m': { multiplier: 5, timespan: 'minute', windowMs: 5 * 60_000 },
  '15m': { multiplier: 15, timespan: 'minute', windowMs: 15 * 60_000 },
  '30m': { multiplier: 30, timespan: 'minute', windowMs: 30 * 60_000 },
  '1h': { multiplier: 60, timespan: 'minute', windowMs: 60 * 60_000 },
  '1d': { multiplier: 1, timespan: 'day', windowMs: 24 * 60 * 60_000 },
};

const DEFAULT_SYMBOL = 'SPY';
const DEFAULT_TIMEFRAME = '1m';
const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

export const runtime = 'edge';

function jsonResponse(body: unknown, init?: { status?: number }) {
  return NextResponse.json(body, { status: init?.status ?? 200, headers: HEADERS });
}

export async function GET(request: Request) {
  const apiKey = process.env.POLYGON_API_KEY;
  if (!apiKey) {
    return jsonResponse({ error: 'Polygon API key is missing' }, { status: 503 });
  }

  const url = new URL(request.url);
  const symbol = (url.searchParams.get('symbol') ?? DEFAULT_SYMBOL).toUpperCase();
  const tf = url.searchParams.get('tf') ?? DEFAULT_TIMEFRAME;
  const config = TF_MAP[tf];

  if (!config) {
    return jsonResponse({ error: `Unsupported timeframe: ${tf}` }, { status: 400 });
  }

  const limitParam = url.searchParams.get('limit');
  let limit = DEFAULT_LIMIT;

  if (limitParam !== null) {
    const parsedLimit = Number.parseInt(limitParam, 10);
    if (!Number.isFinite(parsedLimit) || parsedLimit <= 0) {
      return jsonResponse({ error: 'Invalid limit parameter' }, { status: 400 });
    }
    limit = Math.min(parsedLimit, MAX_LIMIT);
  }

  const now = new Date();
  const fromDate = new Date(now.getTime() - config.windowMs * (limit + 5));
  const from = fromDate.toISOString();
  const to = now.toISOString();

  const endpoint = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(
    symbol,
  )}/range/${config.multiplier}/${config.timespan}/${from}/${to}?adjusted=true&sort=asc&limit=${limit}&apiKey=${apiKey}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      headers: {
        Accept: 'application/json',
      },
    });
  } catch (error) {
    return jsonResponse(
      {
        error: 'Failed to reach Polygon',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const details = await response.text();
    return jsonResponse(
      {
        error: 'Polygon request failed',
        details: details || response.statusText,
      },
      { status: 502 },
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    return jsonResponse(
      {
        error: 'Invalid JSON from Polygon',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  const results = (payload as { results?: Candle[] | undefined })?.results ?? [];
  const candles = Array.isArray(results)
    ? results.slice(-limit).map((entry) => ({
        t: entry.t,
        o: entry.o,
        h: entry.h,
        l: entry.l,
        c: entry.c,
        v: entry.v,
      }))
    : [];

  return jsonResponse({
    symbol,
    tf,
    limit,
    source: 'polygon',
    candles,
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS });
}
