import { NextRequest, NextResponse } from 'next/server';
import { platformSearchMap } from '@/lib/platformSearchMap';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const giftId = searchParams.get('giftId') || 'Gift';
  const rawUrl = searchParams.get('url');
  const platform = searchParams.get('platform');
  const query = searchParams.get('query');

  let redirectUrl: string | null = null;

  // First, check if a valid direct URL was provided
  if (rawUrl && rawUrl !== 'undefined' && /^https?:\/\//.test(rawUrl)) {
    redirectUrl = rawUrl;
  }
  // If not, try building one from platform + query
  else if (platform && query && platformSearchMap[platform]) {
    redirectUrl = platformSearchMap[platform](query);
  }

  // If we still don't have a valid URL, error out
  if (!redirectUrl) {
    return new NextResponse(`❌ Invalid redirect URL for gift: ${giftId}`, { status: 400 });
  }

  console.log(`[Redirecting] ${giftId} → ${redirectUrl}`);
  return NextResponse.redirect(redirectUrl);
}