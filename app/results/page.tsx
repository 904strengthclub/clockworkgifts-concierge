'use client';

import { useEffect, useState } from 'react';

interface GiftSuggestion {
  name: string;
  estimated_price: string;
  store_or_brand: string;
  description: string;
  image_url: string;
  base_purchase_url?: string;
  suggested_platform?: string;
  search_query?: string;
}

export default function ResultsPage() {
  const [suggestions, setSuggestions] = useState<GiftSuggestion[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('clockwork_suggestions');
    if (stored) {
      setSuggestions(JSON.parse(stored));
    }
  }, []);

  return (
    <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Gift Suggestions</h1>
      {suggestions.length === 0 ? (
        <p>Loading suggestions...</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {suggestions.map((gift, index) => {
            const goUrl = `/api/go?giftId=${encodeURIComponent(gift.name)}&platform=${encodeURIComponent(
              gift.suggested_platform || ''
            )}&query=${encodeURIComponent(gift.search_query || '')}&url=${encodeURIComponent(
              gift.base_purchase_url || ''
            )}`;

            return (
              <li key={index} style={{ marginBottom: 24 }}>
                <h3>{gift.name}</h3>
                {gift.image_url && (
                  <img src={gift.image_url} alt={gift.name} style={{ maxWidth: 200 }} />
                )}
                <p>{gift.description}</p>
                <p>
                  <strong>Price:</strong> {gift.estimated_price}
                </p>
                <p>
                  <strong>Store:</strong> {gift.store_or_brand}
                </p>
                <a href={goUrl} target="_blank" rel="noopener noreferrer">
                  View Gift
                </a>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
