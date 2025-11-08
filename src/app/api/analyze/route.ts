import { NextResponse } from "next/server"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const symbol = searchParams.get("symbol")?.toUpperCase() || "AAPL"

    // Calculate a valid date window (7 days back)
    const now = new Date()
    const to = now.toISOString().split("T")[0]
    const from = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]

    // Polygon API endpoint
    const url = `https://api.polygon.io/v2/aggs/ticker/${symbol}/range/15/minute/${from}/${to}?adjusted=true&sort=asc&apiKey=${process.env.POLYGON_API_KEY}`

    const resp = await fetch(url)
    if (!resp.ok) {
      const errText = await resp.text()
      return NextResponse.json({ error: errText }, { status: resp.status })
    }

    const data = await resp.json()
    return NextResponse.json({ results: data.results || [] })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
