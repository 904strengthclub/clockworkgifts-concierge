// /app/api/go/route.ts
import { NextResponse } from 'next/server';

const TAGS: Record<string, string | undefined> = {
  "amazon.com": "clockworkgift-20",
  // add others here if you have them
};

const ALLOW = new Set(Object.keys(TAGS).concat([
  // allow click-through even without a tag
  "etsy.com",
  "uncommongoods.com",
  "crateandbarrel.com",
  "nordstrom.com",
  "anthropologie.com",
  "food52.com",
  "thegrommet.com",
  "markandgraham.com",
  "saksfifthavenue.com",
  "williams-sonoma.com",
  "cratejoy.com",
  "cultgaia.com",
  "theline.com",
  "goop.com",
  "bliss.com",
  "fairtradewinds.net",
  "tenthousandvillages.com",
  "sokoglam.com",
  "lovevery.com",
  "packedwithpurpose.gifts",
  "masterclass.com",
  "fourseasons.com",
  "boxycharm.com",
  "giftory.com",
  "hatch.co",
  "paperlesspost.com",
]));

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = searchParams.get('u'); // destination (encoded)
  const r = searchParams.get('r'); // retailer domain
  if (!u || !r || !ALLOW.has(r)) {
    return NextResponse.redirect('https://clockworkgifts.com/disclaimer');
  }

  const url = new URL(decodeURIComponent(u));

  // Attach affiliate tags where we have them
  if (r === 'amazon.com') {
    if (!url.searchParams.get('tag')) {
      url.searchParams.set('tag', TAGS['amazon.com']!);
    }
  }

  // (Optional) You can add a quick HEAD check + fallback to site search here if desired.

  return NextResponse.redirect(url.toString(), 302);
}
