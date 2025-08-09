'use client';

import { useEffect, useState } from 'react';

type GiftSuggestion = {
  name: string;
  estimated_price: string;
  store_or_brand: string;     // retailer domain (e.g., "amazon.com")
  description: string;        // reason text
  image_url?: string;         // retailer badge path (stable)
  suggested_platform?: string;
  search_query?: string;
  url?: string;               // server-built redirect URL via /api/go
  one_liner?: string;         // optional short pitch
};

export default function ResultsPage() {
  const [suggestions, setSuggestions] = useState<GiftSuggestion[] | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('clockwork_suggestions');
      if (stored) {
        const parsed: GiftSuggestion[] = JSON.parse(stored);
        setSuggestions(parsed);
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
  }, []);

  if (suggestions === null) {
    return (
      <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Gift Suggestions</h1>
        <p>Loading suggestions...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Gift Suggestions</h1>

      {/* Start over button */}
      <div style={{ margin: '12px 0 24px' }}>
        <button
          onClick={() => {
            try { localStorage.removeItem('clockwork_suggestions'); } catch {}
            window.location.href = '/start';
          }}
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #d1d5db',
            background: '#fff',
            cursor: 'pointer',
          }}
        >
          Start over
        </button>
      </div>

      {suggestions.length === 0 ? (
        <p>No suggestions yet. Try running the form again.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 16 }}>
          {suggestions.map((gift, i) => {
            // Prefer the server-built URL; otherwise build a safe fallback
            const href =
              gift.url ||
              `/api/go?u=${encodeURIComponent(
                gift.suggested_platform
                  ? `https://${gift.suggested_platform}/search?q=${encodeURIComponent(gift.search_query || gift.name)}`
                  : `https://www.google.com/search?q=${encodeURIComponent(
                      `site:${gift.store_or_brand} ${gift.search_query || gift.name}`
                    )}`
              )}&r=${encodeURIComponent(gift.suggested_platform || gift.store_or_brand)}`;

            return (
              <li
                key={`${gift.name}-${i}`}
                style={{
                  border: '1px solid #e5e7eb',
                  borderRadius: 12,
                  padding: 16,
                  display: 'grid',
                  gridTemplateColumns: '80px 1fr',
                  gap: 16,
                  alignItems: 'center',
                }}
              >
                <div style={{ width: 80, height: 80, display: 'grid', placeItems: 'center' }}>
                  {gift.image_url ? (
                    <img
                      src={gift.image_url}
                      alt={gift.store_or_brand || 'Retailer'}
                      style={{ maxWidth: '100%', maxHeight: 60, objectFit: 'contain' }}
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        background: '#f3f4f6',
                      }}
                    />
                  )}
                </div>

                <div>
                  <h3 style={{ margin: '0 0 6px' }}>{gift.name}</h3>
                  {gift.one_liner && (
                    <p style={{ margin: '0 0 6px', fontStyle: 'italic', color: '#374151' }}>
                      {gift.one_liner}
                    </p>
                  )}
                  <p style={{ margin: '0 0 8px', color: '#374151' }}>{gift.description}</p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 14, color: '#4b5563' }}>
                    <span><strong>Price:</strong> {gift.estimated_price}</span>
                    <span>•</span>
                    <span><strong>Store:</strong> {gift.store_or_brand}</span>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        display: 'inline-block',
                        padding: '10px 14px',
                        borderRadius: 10,
                        background: 'black',
                        color: 'white',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                    >
                      View Gift
                    </a>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
