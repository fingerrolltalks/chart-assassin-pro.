import { NextResponse } from 'next/server';

const HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': '*',
  'Cache-Control': 'no-store',
};

const DEFAULT_SYMBOL = 'SPY';

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

  const endpoint = `https://api.polygon.io/v2/aggs/ticker/${encodeURIComponent(
    symbol,
  )}/prev?adjusted=true&apiKey=${apiKey}`;

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

  const result = (payload as { results?: Array<{ c?: number }> | undefined })?.results?.[0];

  if (!result || typeof result.c !== 'number') {
    return jsonResponse({ error: 'Polygon response missing close price' }, { status: 502 });
  }

  return jsonResponse({
    symbol,
    price: result.c,
    source: 'polygon',
  });
}

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: HEADERS });
}
