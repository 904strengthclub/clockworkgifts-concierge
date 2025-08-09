// /lib/retailers.ts

export const ALLOWLIST: string[] = ['amazon.com'];

export function isAllowlisted(retailer: string): boolean {
  return ALLOWLIST.includes((retailer || '').toLowerCase());
}

/**
 * Amazon-only link builder.
 * - If we have an ASIN → /dp/ASIN
 * - Else → /s?k=<query>
 * Always routed through /api/go so the tag is appended consistently.
 */
export function buildRetailerLink(retailer: string, query: string, idHint?: string): string {
  const r = (retailer || '').toLowerCase();
  const isASIN = idHint && /^[A-Z0-9]{10}$/.test(idHint);

  if (r !== 'amazon.com') {
    // Force Amazon for MVP
    const q = encodeURIComponent(query || '');
    return `/api/go?u=${encodeURIComponent(`https://www.amazon.com/s?k=${q}`)}&r=amazon.com`;
  }

  if (isASIN) {
    return `/api/go?u=${encodeURIComponent(`https://www.amazon.com/dp/${idHint}`)}&r=amazon.com`;
  }

  const q = encodeURIComponent(query || '');
  return `/api/go?u=${encodeURIComponent(`https://www.amazon.com/s?k=${q}`)}&r=amazon.com`;
}

// Placeholder (we’re not showing brand logos in beta)
export function retailerLogo(): string {
  return '/retailers/generic-store.svg';
}
