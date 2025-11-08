import { NextRequest, NextResponse } from "next/server";

type PolygonAggsResponse = {
  status: string;
  results?: unknown[];
  error?: string;
};

const API_HOST = "https://api.polygon.io";
const DEFAULT_MULTIPLIER = 5;
const DEFAULT_TIMESPAN = "minute";
const DEFAULT_LIMIT = 5000;

function formatDate(date: Date) {
  return date.toISOString().split(".")[0] + "Z";
}

export async function GET(req: NextRequest) {
  try {
    const apiKey = process.env.POLYGON_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: "Missing POLYGON_API_KEY environment variable" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol")?.toUpperCase() ?? "AAPL";
    const multiplier = Number(searchParams.get("multiplier")) || DEFAULT_MULTIPLIER;
    const timespan = searchParams.get("timespan") ?? DEFAULT_TIMESPAN;
    const limit = Number(searchParams.get("limit")) || DEFAULT_LIMIT;

    const now = new Date();
    const from = searchParams.get("from") ?? formatDate(new Date(now.getTime() - 24 * 60 * 60 * 1000));
    const to = searchParams.get("to") ?? formatDate(now);

    const url = new URL(`${API_HOST}/v2/aggs/ticker/${symbol}/range/${multiplier}/${timespan}/${from}/${to}`);
    url.searchParams.set("adjusted", "true");
    url.searchParams.set("limit", limit.toString());
    url.searchParams.set("sort", "asc");
    url.searchParams.set("apiKey", apiKey);

    const response = await fetch(url, {
      headers: { "Accept": "application/json" },
      next: { revalidate: 0 },
    });

    const data: PolygonAggsResponse = await response.json();

    if (!response.ok || data.status !== "OK") {
      const message = data.error || `Polygon API request failed with status ${response.status}`;
      return NextResponse.json({ error: message }, { status: response.status || 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Polygon API error:", error);
    return NextResponse.json(
      { error: "Unexpected error fetching data from Polygon" },
      { status: 500 }
    );
  }
}
