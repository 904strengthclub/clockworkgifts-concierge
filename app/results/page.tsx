// /app/results/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Button from '@/components/Button';

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

  if (suggestions === null) {
    return (
      <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
        <h1>Gift Suggestions</h1>
        <p>Loading suggestions...</p>
      </main>
    );
  }

  return (
    <main className="p-10 font-sans">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">Gift Suggestions</h1>
        <div className="ml-auto">
          <Button
            onClick={() => { try { localStorage.removeItem('clockwork_suggestions'); } catch {} window.location.href = '/start'; }}
          >
            Start over
          </Button>
        </div>
      </div>

      {suggestions.length === 0 ? (
        <p className="mt-6">No suggestions yet. Try running the form again.</p>
      ) : (
        <>
          <ul className="mt-6 grid gap-4">
            {suggestions.map((gift, i) => {
              const href =
                gift.url ||
                `/api/go?u=${encodeURIComponent(
                  `https://www.amazon.com/s?k=${encodeURIComponent(gift.search_query || gift.name)}`
                )}&r=amazon.com`;

              return (
                <li key={`${gift.name}-${i}`} className="border border-gray-200 rounded-xl p-4 grid grid-cols-[80px,1fr] gap-4 items-center">
                  <div className="w-20 h-20 grid place-items-center">
                    <div className="w-[60px] h-[60px] rounded-md bg-gray-100" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">{gift.name}</h3>
                    {gift.one_liner && <p className="italic text-gray-700 mb-1">{gift.one_liner}</p>}
                    <p className="text-gray-700 mb-2">{gift.description}</p>
                    <div className="flex gap-3 text-sm text-gray-600 flex-wrap">
                      <span><strong>Price:</strong> {gift.estimated_price}</span>
                      <span>•</span>
                      <span><strong>Store:</strong> Amazon</span>
                    </div>
                    <div className="mt-3">
                      <Button href={href}>View on Amazon</Button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-3 mt-4">
            <Button onClick={loadMore} disabled={loadsLeft <= 0 || loadingMore} className={loadsLeft <= 0 ? 'opacity-50' : ''}>
              {loadingMore ? 'Loading…' : `Load 5 more ideas (${loadsLeft} left)`}
            </Button>
          </div>
        </>
      )}
    </main>
  );
}
