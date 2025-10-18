import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  _request: Request,
  { params }: { params: { symbol: string } }
) {
  const fileName = params.symbol.endsWith('.csv') ? params.symbol : `${params.symbol}.csv`;
  const filePath = path.join(process.cwd(), 'src', 'data', 'samples', fileName);
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/csv'
      }
    });
  } catch (error) {
    return NextResponse.json({ error: 'Sample not found' }, { status: 404 });
  }
}
