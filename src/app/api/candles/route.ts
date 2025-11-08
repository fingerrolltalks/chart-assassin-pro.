// src/app/api/candles/route.ts
export const runtime = 'edge';

import { NextResponse } from 'next/server';

const POLY_BASE = 'https://api.polygon.io/v2/aggs/ticker';

function parseTf(tf: string) {
  const t = (tf || '15m').toLowerCase();
  if (t.endsWith('m')) return { mult: parseInt(t), unit: 'minute' as const };
  if (t.endsWith('h')) return { mult: parseInt(t) * 60, unit: 'minute' as const }; // Polygon has minute/hour/day; use minute*60 for hours
  return { mult: 1, unit: 'day' as const };
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const symbol = (url.searchParams.get('symbol') || '').toUpperCase();
    const tf = (url.searchParams.get('tf') || '15m').toLowerCase();
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '200', 10), 1), 1000);

    if (!symbol) return NextResponse.json({ error: 'symbol_required' }, { status: 422 });

    const apiKey = process.env.POLYGON_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'polygon_key_missing' }, { status: 500 });

    const { mult, unit } = parseTf(tf);

    // Build a safe window that ends "now" so we never need a from/to query parameter from the user
    const now = new Date();
    const toISO = now.toISOString();
    // 30 days for intraday, 365 days for daily
    const daysBack = unit === 'day' ? 365 : 30;
    const from = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000).toISOString();

    // Polygon aggregates. For hours we already converted to minute*60 above.
    const u = `${POLY_BASE}/${symbol}/range/${mult}/${unit}/${from}/${toISO}?adjusted=true&sort=asc&limit=${limit}&apiKey=${apiKey}`;

    const res = await fetch(u, { cache: 'no-store', headers: { Accept: 'application/json' } });
    const data = await res.json();

    if (!res.ok || !Array.isArray(data?.results)) {
      return NextResponse.json({ error: 'polygon_error', status: res.status, details: data }, { status: 502 });
    }

    // Normalize to objects for the frontend: {t,o,h,l,c,v}
    const candles = data.results.map((r: any) => ({
      t: Number(r.t),
      o: Number(r.o),
      h: Number(r.h),
      l: Number(r.l),
      c: Number(r.c),
      v: Number(r.v ?? 0),
    }));

    if (candles.length < 20) {
      return NextResponse.json({ error: 'not_enough_candles', count: candles.length }, { status: 422 });
    }

    return NextResponse.json({ symbol, tf, limit: candles.length, candles });
  } catch (e: any) {
    return NextResponse.json({ error: 'candles_failed', details: String(e?.message ?? e) }, { status: 500 });
  }
}
