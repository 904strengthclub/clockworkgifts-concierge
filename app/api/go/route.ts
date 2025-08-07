// /app/api/go/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SUPPORTED_DOMAINS: Record<string, (url: URL) => string> = {
  'amazon.com': (url) => {
    const tag = process.env.AMAZON_ASSOCIATE_ID || 'clockworkgift-20';
    url.searchParams.set('tag', tag);
    return url.toString();
  },
  'williams-sonoma.com': (url) => {
    url.searchParams.set('cm_mmc', 'affiliate--clockworkgift-20');
    return url.toString();
  },
  'uncommongoods.com': (url) => {
    url.searchParams.set('utm_source', 'affiliate');
    url.searchParams.set('utm_medium', 'clockworkgift-20');
    return url.toString();
  },
};

export async function GET(req: NextRequest) {
  const rawUrl = req.nextUrl.searchParams.get('url');

  if (!rawUrl) {
    return NextResponse.json({ error: 'Missing "url" parameter' }, { status: 400 });
  }

  try {
    const url = new URL(rawUrl);
    const domain = url.hostname.replace('www.', '');

    const handler = Object.entries(SUPPORTED_DOMAINS).find(([supportedDomain]) =>
      domain.endsWith(supportedDomain)
    );

    const affiliateUrl = handler ? handler[1](url) : url.toString();
    return NextResponse.redirect(affiliateUrl);
  } catch (err) {
    console.error('❌ Invalid redirect URL:', rawUrl, err);
    return NextResponse.json({ error: 'Invalid URL provided' }, { status: 400 });
  }
}
