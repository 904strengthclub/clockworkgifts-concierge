// /lib/retailers.ts
export const ALLOWLIST: string[] = ['amazon.com'];
export function isAllowlisted(r: string) { return ALLOWLIST.includes((r || '').toLowerCase()); }
export function buildRetailerLink(retailer: string, query: string, idHint?: string) {
  const r = (retailer || '').toLowerCase();
  const isASIN = idHint && /^[A-Z0-9]{10}$/.test(idHint);
  if (r !== 'amazon.com') {
    return `/api/go?u=${encodeURIComponent(`https://www.amazon.com/s?k=${encodeURIComponent(query || '')}`)}&r=amazon.com`;
  }
  if (isASIN) return `/api/go?u=${encodeURIComponent(`https://www.amazon.com/dp/${idHint}`)}&r=amazon.com`;
  return `/api/go?u=${encodeURIComponent(`https://www.amazon.com/s?k=${encodeURIComponent(query || '')}`)}&r=amazon.com`;
}
export function retailerLogo() { return '/retailers/generic-store.svg'; }
