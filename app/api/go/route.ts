import { NextResponse } from 'next/server';
const TAG = 'clockworkgift-20';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = searchParams.get('u');
  const r = (searchParams.get('r') || '').toLowerCase();

  if (!u || r !== 'amazon.com') return NextResponse.redirect(`https://www.amazon.com?tag=${TAG}`, 302);

  let dst = decodeURIComponent(u);
  try {
    const url = new URL(dst);
    if (!url.searchParams.has('tag')) url.searchParams.set('tag', TAG);
    dst = url.toString();
  } catch {
    dst = `https://www.amazon.com?tag=${TAG}`;
  }
  return NextResponse.redirect(dst, 302);
}
