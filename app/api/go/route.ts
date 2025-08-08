import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const giftId = searchParams.get('giftId') || 'UnknownGift';
  const baseUrl = searchParams.get('url'); // Optional, may be undefined
  const platform = searchParams.get('platform'); // e.g., "uncommongoods.com"
  const query = searchParams.get('query'); // e.g., "personalized cheese board"

  // Determine the final destination URL
  let finalUrl: string | null = null;

  if (baseUrl && baseUrl !== 'undefined' && baseUrl.startsWith('http')) {
    finalUrl = baseUrl;
  } else if (platform && query) {
    const encodedQuery = encodeURIComponent(`site:${platform} ${query}`);
    finalUrl = `https://www.google.com/search?q=${encodedQuery}`;
  }

  if (!finalUrl) {
    return NextResponse.json(
      { error: 'Missing or invalid URL and fallback search parameters.' },
      { status: 400 }
    );
  }

  // Optional: log or track outbound redirect
  console.log(`[Redirecting] Gift ID: ${giftId} → ${finalUrl}`);

  return NextResponse.redirect(finalUrl, 302);
}
