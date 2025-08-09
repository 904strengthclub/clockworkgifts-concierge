// lib/affiliateHelpers.ts

/**
 * Map a single budget into a +0% / -20% price band.
 */
export function mapBudgetToPriceBand(budget: number) {
  const b = Number(budget);
  const max = Math.max(1, Math.floor(b));          // no over-budget
  const min = Math.max(0, Math.floor(b * 0.8));    // -20%
  return { min, max };
}

/**
 * Build an Amazon search URL from a keyword + price band.
 * Adds both low/high-price AND rh=p_36 (cents) to be extra sticky.
 */
export function buildAmazonSearchLink(keyword: string, minPrice?: number, maxPrice?: number) {
  const q = encodeURIComponent((keyword || '').trim());
  let url = `https://www.amazon.com/s?k=${q}`;

  if (typeof minPrice === 'number' && typeof maxPrice === 'number') {
    const minCents = Math.max(0, Math.floor(minPrice * 100));
    const maxCents = Math.max(0, Math.floor(maxPrice * 100));
    // Visible filter chips
    url += `&low-price=${minPrice}&high-price=${maxPrice}`;
    // Internal price filter (very reliable)
    url += `&rh=p_36%3A${minCents}-${maxCents}`;
  }
  return url;
}

/**
 * Append affiliate tag and preserve price filters.
 * Returns a full /api/go redirector URL (so your tag is always applied server-side).
 */
export function toAffiliateRedirectUrl(amazonUrl: string) {
  const encoded = encodeURIComponent(amazonUrl);
  return `/api/go?u=${encoded}&r=amazon.com`;
}
