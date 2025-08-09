// /lib/retailers.ts

// ------------- Allowlist -------------
export const ALLOWLIST = [
  'amazon.com',
  'etsy.com',
  'uncommongoods.com',
  'crateandbarrel.com',
  'nordstrom.com',
  'anthropologie.com',
  'food52.com',
  'thegrommet.com',
  'markandgraham.com',
  'saksfifthavenue.com',
  'williams-sonoma.com',
  'cratejoy.com',
  'cultgaia.com',
  'theline.com',
  'goop.com',
  'bliss.com',
  'fairtradewinds.net',
  'tenthousandvillages.com',
  'sokoglam.com',
  'lovevery.com',
  'packedwithpurpose.gifts',
  'masterclass.com',
  'fourseasons.com',
  'boxycharm.com',
  'giftory.com',
  'hatch.co',
  'paperlesspost.com',
] as const;

export type AllowlistedRetailer = typeof ALLOWLIST[number];

export function isAllowlisted(retailer: string): retailer is AllowlistedRetailer {
  return (ALLOWLIST as readonly string[]).includes((retailer || '').toLowerCase());
}

// ------------- URL builder -------------
export function buildRetailerLink(retailer: AllowlistedRetailer, query: string, idHint?: string) {
  const r = retailer.toLowerCase() as AllowlistedRetailer;

  if (r === 'amazon.com') {
    if (idHint && /^[A-Z0-9]{10}$/.test(idHint)) {
      return `/api/go?u=${encodeURIComponent(`https://www.amazon.com/dp/${idHint}`)}&r=${r}`;
    }
    return `/api/go?u=${encodeURIComponent(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`)}&r=${r}`;
  }

  if (r === 'etsy.com') {
    return `/api/go?u=${encodeURIComponent(`https://www.etsy.com/search?q=${encodeURIComponent(query)}`)}&r=${r}`;
  }

  if (r === 'nordstrom.com') {
    return `/api/go?u=${encodeURIComponent(
      `https://www.nordstrom.com/s?origin=keywordsearch&keyword=${encodeURIComponent(query)}`
    )}&r=${r}`;
  }

  if (r === 'markandgraham.com') {
    return `/api/go?u=${encodeURIComponent(`https://www.markandgraham.com/search?q=${encodeURIComponent(query)}`)}&r=${r}`;
  }

  if (r === 'crateandbarrel.com') {
    return `/api/go?u=${encodeURIComponent(`https://www.crateandbarrel.com/search?q=${encodeURIComponent(query)}`)}&r=${r}`;
  }

  if (r === 'anthropologie.com') {
    return `/api/go?u=${encodeURIComponent(`https://www.anthropologie.com/search?q=${encodeURIComponent(query)}`)}&r=${r}`;
  }

  // Generic fallback
  return `/api/go?u=${encodeURIComponent(`https://${r}/search?q=${encodeURIComponent(query)}`)}&r=${r}`;
}

// ------------- Retailer logo helper -------------
// Point these to files you place in /public/retailers/*
export function retailerLogo(retailer: string): string {
  const r = (retailer || '').toLowerCase();
  const map: Record<string, string> = {
    'amazon.com': '/retailers/amazon.svg',
    'etsy.com': '/retailers/etsy.svg',
    'uncommongoods.com': '/retailers/uncommongoods.svg',
    'crateandbarrel.com': '/retailers/crateandbarrel.svg',
    'nordstrom.com': '/retailers/nordstrom.svg',
    'anthropologie.com': '/retailers/anthropologie.svg',
    'markandgraham.com': '/retailers/markandgraham.svg',
    'cratejoy.com': '/retailers/cratejoy.svg',
  };
  return map[r] ?? '/retailers/generic-store.svg';
}
