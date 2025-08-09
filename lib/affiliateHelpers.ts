// /lib/affiliateHelpers.ts
import { isAllowlisted, buildRetailerLink, retailerLogo } from '@/lib/retailers';

// The "legacy" shape your UI expects on /results
export interface LegacySuggestion {
  name: string;
  estimated_price: string;
  store_or_brand: string;     // retailer domain (e.g., "amazon.com")
  description: string;
  image_url?: string;         // we'll default to retailer badge if missing
  suggested_platform?: string;// retailer domain (same as store_or_brand in our pipeline)
  search_query?: string;      // human-searchable terms
  one_liner?: string;
  id_hint?: string;
  url?: string;               // final CTA link via /api/go
}

/**
 * Ensures each suggestion has:
 * - a deterministic, affiliateable `url` built server-side
 * - a stable `image_url` (retailer badge) if missing
 * - retailer domain constrained to your allowlist
 */
export async function appendAffiliateLinks(
  suggestions: LegacySuggestion[]
): Promise<LegacySuggestion[]> {
  return suggestions.map((s) => {
    const retailer =
      (s.suggested_platform || s.store_or_brand || '').toLowerCase().trim();

    const safeRetailer = isAllowlisted(retailer) ? retailer : (s.store_or_brand || '').toLowerCase().trim();

    // Build URL deterministically (never trust model URLs)
    const url = isAllowlisted(safeRetailer)
      ? buildRetailerLink(safeRetailer as any, s.search_query || s.name, s.id_hint)
      : `/api/go?u=${encodeURIComponent(
          `https://www.google.com/search?q=site:${safeRetailer || 'amazon.com'}+${encodeURIComponent(
            s.search_query || s.name
          )}`
        )}&r=${encodeURIComponent(safeRetailer || 'amazon.com')}`;

    // Ensure we always have a stable image (retailer badge)
    const img = s.image_url && s.image_url.length > 0
      ? s.image_url
      : retailerLogo(safeRetailer || 'generic');

    return {
      ...s,
      store_or_brand: safeRetailer || s.store_or_brand,
      suggested_platform: safeRetailer || s.suggested_platform,
      image_url: img,
      url,
    };
  });
}
