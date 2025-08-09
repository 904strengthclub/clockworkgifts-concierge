// /lib/affiliateHelpers.ts
import { isAllowlisted, buildRetailerLink, retailerLogo } from '@/lib/retailers';

// Shape your results page expects
export interface LegacySuggestion {
  name: string;
  estimated_price: string;
  store_or_brand: string;     // retailer domain (e.g., "amazon.com")
  description: string;
  image_url?: string;         // we’ll default to a generic placeholder
  suggested_platform?: string;// retailer domain (same as store_or_brand)
  search_query?: string;      // human-searchable terms
  one_liner?: string;
  id_hint?: string;
  url?: string;               // final CTA via /api/go
}

/**
 * Ensure each suggestion has:
 * - deterministic, affiliate-safe `url` (built server-side)
 * - stable `image_url` (generic placeholder)
 * - normalized retailer domain
 */
export async function appendAffiliateLinks(
  suggestions: LegacySuggestion[]
): Promise<LegacySuggestion[]> {
  return suggestions.map((s) => {
    const retailerRaw =
      (s.suggested_platform || s.store_or_brand || '').toLowerCase().trim();

    const safeRetailer =
      isAllowlisted(retailerRaw) ? retailerRaw : (s.store_or_brand || '').toLowerCase().trim();

    // Build URL deterministically; never trust model URLs
    const url = isAllowlisted(safeRetailer)
      ? buildRetailerLink(safeRetailer, s.search_query || s.name, s.id_hint)
      : `/api/go?u=${encodeURIComponent(
          `https://www.google.com/search?q=site:${safeRetailer || 'amazon.com'}+${encodeURIComponent(
            s.search_query || s.name
          )}`
        )}&r=${encodeURIComponent(safeRetailer || 'amazon.com')}`;

    // Always use our generic placeholder to avoid trademark/logo issues
    const img = retailerLogo(); // <-- no args now

    return {
      ...s,
      store_or_brand: safeRetailer || s.store_or_brand,
      suggested_platform: safeRetailer || s.suggested_platform,
      image_url: img,
      url,
    };
  });
}
