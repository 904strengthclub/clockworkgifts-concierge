// /app/api/go/route.ts
import { NextResponse } from 'next/server';

const TAG = 'clockworkgift-20';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = searchParams.get('u');
  const r = (searchParams.get('r') || '').toLowerCase();

  // MVP: Amazon only
  if (!u || r !== 'amazon.com') {
    return NextResponse.redirect('https://www.amazon.com', 302);
  }

  let dst = decodeURIComponent(u);
  try {
    const url = new URL(dst);

    // Always append your Associates tag
    if (!url.searchParams.has('tag')) {
      url.searchParams.set('tag', TAG);
    }

    dst = url.toString();
  } catch {
    // Fallback to Amazon homepage with tag if URL is malformed
    dst = `https://www.amazon.com?tag=${TAG}`;
  }

  return NextResponse.redirect(dst, 302);
}
