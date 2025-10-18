import { NextResponse } from 'next/server';
import { patternInputSchema } from '../../../lib/core/schema';
import { fromOhlcvTuples } from '../../../lib/utils/csv';
import { runPatternEngine } from '../../../lib/tech/patternEngine';

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parseResult = patternInputSchema.safeParse(json);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
  }

  const candles = fromOhlcvTuples(parseResult.data.ohlcv);
  const patterns = runPatternEngine(candles);
  return NextResponse.json({ patterns });
}
