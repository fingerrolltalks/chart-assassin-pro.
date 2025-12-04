// src/app/api/test-finnhub/route.ts

export async function GET(request: Request): Promise<Response> {
  try {
    const { searchParams } = new URL(request.url);
    const symbol = searchParams.get("symbol") || "AAPL";
    const resolution = searchParams.get("resolution") || "15";

    // Simple 2-day window of candles
    const now = Math.floor(Date.now() / 1000); // current time in seconds
    const from = now - 2 * 24 * 60 * 60;       // 2 days ago

    const token = process.env.FINNHUB_API_KEY;
    if (!token) {
      return new Response(
        JSON.stringify({ error: "FINNHUB_API_KEY is not set on the server" }),
        { status: 500 }
      );
    }

    const url =
      `https://finnhub.io/api/v1/stock/candle` +
      `?symbol=${encodeURIComponent(symbol)}` +
      `&resolution=${encodeURIComponent(resolution)}` +
      `&from=${from}` +
      `&to=${now}` +
      `&token=${token}`;

    const res = await fetch(url);
    const data = await res.json();

    return new Response(JSON.stringify(data), {
      status: res.ok ? 200 : res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Unknown error" }),
      { status: 500 }
    );
  }
}
