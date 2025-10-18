import { NextResponse } from 'next/server';
import { regimeInputSchema } from '../../../lib/core/schema';
import { fromOhlcvTuples } from '../../../lib/utils/csv';
import { regimeDetector } from '../../../lib/tech/regimeDetector';

export async function POST(request: Request) {
  const json = await request.json().catch(() => null);
  const parseResult = regimeInputSchema.safeParse(json);
  if (!parseResult.success) {
    return NextResponse.json({ error: parseResult.error.flatten() }, { status: 400 });
  }

  const { spy, qqq, iwm, vix, tnx } = parseResult.data;
  const detection = regimeDetector({
    spy: fromOhlcvTuples(spy),
    qqq: fromOhlcvTuples(qqq),
    iwm: fromOhlcvTuples(iwm),
    vix,
    tnx
  });

  return NextResponse.json(detection);
}
