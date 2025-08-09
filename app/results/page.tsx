'use client';

import { useEffect, useState } from 'react';

type GiftSuggestion = {
  name: string;
  estimated_price: string;
  store_or_brand: string;
  description: string;
  image_url?: string;
  suggested_platform?: string;
  search_query?: string;
  url?: string;
  one_liner?: string;
};

export default function ResultsPage() {
  const [suggestions, setSuggestions] = useState<GiftSuggestion[] | null>(null);
  const [seen, setSeen] = useState<string[]>([]);
  const [loadsLeft, setLoadsLeft] = useState(2);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('clockwork_suggestions');
      if (stored) {
        const parsed: GiftSuggestion[] = JSON.parse(stored);
        setSuggestions(parsed);
        setSeen(parsed.map(s => s.name));
      } else {
        setSuggestions([]);
      }
    } catch {
      setSuggestions([]);
    }
  }, []);

  async function loadMore() {
    if (loadsLeft <= 0 || loadingMore) return;
    setLoadingMore(true);
    try {
      const formStored = localStorage.getItem('clockwork_last_form');
      const surveySummary = formStored ? JSON.parse(formStored) : null;
      const res = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveySummary, seenGiftNames: seen }),
      });
      if (!res.ok) throw new Error('API error');
      const more = await res.json();
      if (Array.isArray(more) && more.length) {
        setSuggestions(prev => (prev ? [...prev, ...more] : more));
        setSeen(prev => [...prev, ...more.map((m: GiftSuggestion) => m.name)]);
        setLoadsLeft(n => n - 1);
      }
    } catch (e) {
      console.warn('Load more failed:', e);
    } finally {
      setLoadingMore(false);
    }
  }

  function feedback(vote: 'up' | 'down') {
    console.log('feedback', vote);
    // TODO: send to /api/feedback with current session id
  }

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

      <div style={{ margin: '12px 0 24px' }}>
        <button
          onClick={() => { try { localStorage.removeItem('clockwork_suggestions'); } catch {} window.location.href = '/start'; }}
          style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer' }}
        >
          Start over
        </button>
      </div>

      {suggestions.length === 0 ? (
        <p>No suggestions yet. Try running the form again.</p>
      ) : (
        <>
          <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: 16 }}>
            {suggestions.map((gift, i) => {
              const href =
                gift.url ||
                `/api/go?u=${encodeURIComponent(
                  gift.suggested_platform
                    ? `https://${gift.suggested_platform}/search?q=${encodeURIComponent(gift.search_query || gift.name)}`
                    : `https://www.google.com/search?q=${encodeURIComponent(`site:${gift.store_or_brand} ${gift.search_query || gift.name}`)}`
                )}&r=${encodeURIComponent(gift.suggested_platform || gift.store_or_brand)}`;

              return (
                <li key={`${gift.name}-${i}`}
                    style={{ border: '1px solid #e5e7eb', borderRadius: 12, padding: 16, display: 'grid', gridTemplateColumns: '80px 1fr', gap: 16, alignItems: 'center' }}>
                  <div style={{ width: 80, height: 80, display: 'grid', placeItems: 'center' }}>
                    <div style={{ width: 60, height: 60, borderRadius: 8, background: '#f3f4f6' }} />
                  </div>
                  <div>
                    <h3 style={{ margin: '0 0 6px' }}>{gift.name}</h3>
                    {gift.one_liner && <p style={{ margin: '0 0 6px', fontStyle: 'italic', color: '#374151' }}>{gift.one_liner}</p>}
                    <p style={{ margin: '0 0 8px', color: '#374151' }}>{gift.description}</p>
                    <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', fontSize: 14, color: '#4b5563' }}>
                      <span><strong>Price:</strong> {gift.estimated_price}</span>
                      <span>•</span>
                      <span><strong>Store:</strong> {gift.store_or_brand}</span>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      <a href={href} target="_blank" rel="noopener noreferrer"
                         style={{ display: 'inline-block', padding: '10px 14px', borderRadius: 10, background: 'black', color: 'white', textDecoration: 'none', fontWeight: 600 }}>
                        View Gift
                      </a>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 16 }}>
            <button
              onClick={loadMore}
              disabled={loadsLeft <= 0 || loadingMore}
              style={{ padding: '10px 14px', borderRadius: 10, border: '1px solid #d1d5db', background: '#fff', cursor: loadsLeft <= 0 ? 'not-allowed' : 'pointer' }}
            >
              {loadingMore ? 'Loading…' : `Load 5 more ideas (${loadsLeft} left)`}
            </button>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <button onClick={() => feedback('up')} title="Helpful" style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '6px 10px', background: '#fff' }}>👍</button>
              <button onClick={() => feedback('down')} title="Not helpful" style={{ border: '1px solid #d1d5db', borderRadius: 8, padding: '6px 10px', background: '#fff' }}>👎</button>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
