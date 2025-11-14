// src/app/api/candles/route.ts
import { NextRequest, NextResponse } from "next/server";

type OHLC = { t: number; o: number; h: number; l: number; c: number; v: number };

// supported timeframes and their minute resolution for Finnhub
const MINUTES: Record<string, number> = {
  "1m": 1,
  "5m": 5,
  "15m": 15,
  "30m": 30,
  "1h": 60,
};

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const symbol = (url.searchParams.get("symbol") || "AAPL").toUpperCase();
    const tf = (url.searchParams.get("tf") || "15m").toLowerCase();
    const limit = Math.min(parseInt(url.searchParams.get("limit") || "300", 10), 1000);

    const provider = (process.env.DATA_PROVIDER || "FINNHUB").toUpperCase();
    if (provider !== "FINNHUB") {
      return NextResponse.json(
        { error: `provider ${provider} not enabled (expected FINNHUB)` },
        { status: 400 }
      );
    }

    if (!MINUTES[tf]) {
      return NextResponse.json({ error: `unsupported timeframe ${tf}` }, { status: 400 });
    }

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "FINNHUB_API_KEY missing" }, { status: 500 });
    }

    const resolution = MINUTES[tf].toString(); // 1,5,15,30,60
    const now = Math.floor(Date.now() / 1000);
    const secsPerBar = MINUTES[tf] * 60;
    const spanSec = secsPerBar * limit;
    const from = now - spanSec - 5; // small pad

    const endpoint =
      `https://finnhub.io/api/v1/stock/candle` +
      `?symbol=${symbol}` +
      `&resolution=${resolution}` +
      `&from=${from}` +
      `&to=${now}` +
      `&token=${apiKey}`;

    const r = await fetch(endpoint, { cache: "no-store" });
    if (!r.ok) {
      const txt = await r.text().catch(() => "");
      return NextResponse.json(
        { error: "finnhub_http_error", status: r.status, body: txt },
        { status: 502 }
      );
    }

    const j = await r.json();

    // Finnhub returns { s: "ok"|"no_data", t:[], o:[], h:[], l:[], c:[], v:[] }
    if (j.s !== "ok" || !Array.isArray(j.t)) {
      return NextResponse.json(
        { error: "finnhub_bad_payload", details: j },
        { status: 502 }
      );
    }

    const candles: OHLC[] = j.t.map((t: number, i: number) => ({
      t,                        // unix seconds
      o: j.o[i],
      h: j.h[i],
      l: j.l[i],
      c: j.c[i],
      v: j.v[i],
    }));

    const trimmed = candles.slice(-limit);

    if (trimmed.length < 1) {
      return NextResponse.json(
        { error: "finnhub_no_candles", symbol, tf },
        { status: 422 }
      );
    }

    return NextResponse.json({
      symbol,
      tf,
      provider: "FINNHUB",
      candles: trimmed,
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: "server_error", details: e?.message || String(e) },
      { status: 500 }
    );
  }
}
