// src/app/api/analyze/route.ts
export const runtime = 'edge';
import { NextResponse } from 'next/server';

type Bar = { t: number; o: number; h: number; l: number; c: number; v: number };
type Tup = [number, number, number, number, number, number];

function ema(values: number[], period: number) {
  if (!values.length) return [];
  const k = 2 / (period + 1);
  let e = values[0];
  const out = [e];
  for (let i = 1; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
    out.push(e);
  }
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const symbol = String(body?.symbol ?? '').trim().toUpperCase();
    const timeframe = String(body?.timeframe ?? '').trim() || '15m';
    const mode = String(body?.mode ?? '').trim() || 'scalp';
    const raw = body?.ohlcv;

    if (!symbol) return NextResponse.json({ error: 'symbol_required' }, { status: 422 });
    if (!Array.isArray(raw) || raw.length < 20) return NextResponse.json({ error: 'not_enough_candles' }, { status: 422 });

    // Accept either array of tuples or array of objects
    const bars: Bar[] = raw.map((b: any) => (
      Array.isArray(b) ? { t: +b[0], o: +b[1], h: +b[2], l: +b[3], c: +b[4], v: +b[5] }
                       : { t: +b.t, o: +b.o, h: +b.h, l: +b.l, c: +b.c, v: +b.v }
    )).filter(b => Number.isFinite(b.c));

    const closes = bars.map(b => b.c);
    const last = closes[closes.length - 1];

    const e20 = (ema(closes, 20).pop() ?? last);
    const e50 = (ema(closes, 50).pop() ?? last);
    const bull = e20 > e50;
    const regime = bull ? 'Bull' : 'Bear';

    const rr = 1.5;
    const entry = last;
    const stop = bull ? entry * 0.995 : entry * 1.005;
    const target = bull ? entry * (1 + 0.003 * rr) : entry * (1 - 0.003 * rr);

    const report =
`Market Regime: ${regime}
• Bias ${bull ? '🟢 LONG' : '🔴 SHORT'} — Mode: ${mode}
• Entry: ${entry.toFixed(2)}
• 🚫 Stop: ${stop.toFixed(2)}
• 🎯 Target: ${target.toFixed(2)} with R:R ${rr.toFixed(2)}
• Confidence: 55%
Execute: Stay ${bull ? 'long above VWAP; watch for reversal on volume fade.' : 'short below VWAP; watch for squeeze on volume spike.'}
Educational only — not financial advice.`;

    return NextResponse.json({
      report,
      levels: { entry, stop, target },
      stats: { rr, confidence: 0.55 },
      meta: { symbol, timeframe, bars: bars.length }
    });
  } catch (e: any) {
    return NextResponse.json({ error: 'analyze_failed', details: String(e?.message ?? e) }, { status: 500 });
  }
}
