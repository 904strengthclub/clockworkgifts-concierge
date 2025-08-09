// /lib/retailers.ts
export const ALLOWLIST = [
  // Add/remove as you like; Amazon included since you have an affiliate tag
  "amazon.com",
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
] as const;

export type AllowlistedRetailer = typeof ALLOWLIST[number];

export function isAllowlisted(retailer: string): retailer is AllowlistedRetailer {
  return ALLOWLIST.includes(retailer as AllowlistedRetailer);
}

// Very small, deterministic URL builder. We DO NOT trust model URLs.
export function buildRetailerLink(retailer: AllowlistedRetailer, query: string, idHint?: string) {
  // We always route via /api/go so you can attach affiliate tags and verify/fallback.
  // The /api/go route should handle appending the tag and optional HEAD-check.
  if (retailer === "amazon.com") {
    if (idHint && /^[A-Z0-9]{10}$/.test(idHint)) {
      return `/api/go?u=${encodeURIComponent(`https://www.amazon.com/dp/${idHint}`)}&r=${retailer}`;
    }
    return `/api/go?u=${encodeURIComponent(`https://www.amazon.com/s?k=${encodeURIComponent(query)}`)}&r=${retailer}`;
  }
  if (retailer === "etsy.com") {
    return `/api/go?u=${encodeURIComponent(`https://www.etsy.com/search?q=${encodeURIComponent(query)}`)}&r=${retailer}`;
  }
  // Generic fallback: site search on retailer
  return `/api/go?u=${encodeURIComponent(`https://${retailer}/search?q=${encodeURIComponent(query)}`)}&r=${retailer}`;
}

// Tiny logo map so your UI never breaks even if product images are flaky.
// Replace these with your own assets when ready.
export function retailerLogo(retailer: string): string {
  const map: Record<string, string> = {
    "amazon.com": "/retailers/amazon.svg",
    "etsy.com": "/retailers/etsy.svg",
    "uncommongoods.com": "/retailers/uncommongoods.svg",
    "crateandbarrel.com": "/retailers/crateandbarrel.svg",
    "nordstrom.com": "/retailers/nordstrom.svg",
    "anthropologie.com": "/retailers/anthropologie.svg",
  };
  // Generic fallback icon
  return map[retailer] ?? "/retailers/generic-store.svg";
}
