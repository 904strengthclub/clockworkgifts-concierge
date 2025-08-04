// app/api/go/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const productUrl = 'https://www.amazon.com/dp/B08N5WRWNW';
  const affiliateTag = process.env.AMAZON_ASSOCIATE_ID || 'clockworkgift-20';
  const url = new URL(productUrl);
  url.searchParams.set('tag', affiliateTag);
  return NextResponse.redirect(url.toString());
}
