import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol")?.toUpperCase() || "AAPL";

    // Automatically get last 24 hours of data
    const now = new Date();
    const to = now.toISOString().split("T")[0];
    const from = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0];

    // ✅ Massive (Polygon) API endpoint
    const url = `https://api.massive.app/v2/aggs/ticker/${symbol}/range/15/minute/${from}/${to}?adjusted=true&sort=asc&limit=50000&apiKey=${process.env.POLYGON_API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    if (!res.ok || data.status === "ERROR") {
      throw new Error(data.error || "Massive API error");
    }

    return NextResponse.json(data);
  } catch (err: any) {
    console.error("API Error:", err.message);
    return NextResponse.json(
      { error: "Massive request failed", details: err.message },
      { status: 500 }
    );
  }
}
