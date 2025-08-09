// /lib/retailers.ts

// Keep this simple and boring for tonight’s beta:
export const ALLOWLIST: string[] = [
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
];

export function isAllowlisted(retailer: string): boolean {
  return ALLOWLIST.includes((retailer || '').toLowerCase());
}

// Deterministic URL builder — NEVER trust model URLs
export function buildRetailerLink(retailer: string, query: string, idHint?: string): string {
  const r = (retailer || '').toLowerCase();

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
  if (r === 'uncommongoods.com') {
    return `/api/go?u=${encodeURIComponent(`https://www.uncommongoods.com/search?keywords=${encodeURIComponent(query)}`)}&r=${r}`;
  }
  if (r === 'crateandbarrel.com') {
    return `/api/go?u=${encodeURIComponent(`https://www.crateandbarrel.com/search?q=${encodeURIComponent(query)}`)}&r=${r}`;
  }
  if (r === 'williams-sonoma.com') {
    return `/api/go?u=${encodeURIComponent(`https://www.williams-sonoma.com/search?q=${encodeURIComponent(query)}`)}&r=${r}`;
  }
  if (r === 'anthropologie.com') {
    return `/api/go?u=${encodeURIComponent(`https://www.anthropologie.com/search?q=${encodeURIComponent(query)}`)}&r=${r}`;
  }
  if (r === 'food52.com') {
    return `/api/go?u=${encodeURIComponent(`https://food52.com/shop/search?q=${encodeURIComponent(query)}`)}&r=${r}`;
  }

  // Generic fallback
  return `/api/go?u=${encodeURIComponent(`https://${r}/search?q=${encodeURIComponent(query)}`)}&r=${r}`;
}

// For beta, avoid brand logos—use a generic placeholder icon path or ignore in UI
export function retailerLogo(): string {
  return '/retailers/generic-store.svg';
}
