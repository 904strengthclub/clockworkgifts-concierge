import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { rating, location, suggestionsCount } = body || {};
    if (!rating || !['up','down'].includes(rating)) {
      return NextResponse.json({ error: 'Invalid rating' }, { status: 400 });
    }
    console.log('FEEDBACK', { rating, location, suggestionsCount, ts: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('FEEDBACK_ERROR', e);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
