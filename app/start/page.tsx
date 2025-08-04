'use client';

import React, { useState } from 'react';

type Suggestion = {
  title: string;
  reason: string;
  giftId: string;
  priceEstimate: string;
};

export default function StartPage() {
  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setSuggestions([]);
    try {
      const res = await fetch('/api/conversational/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'demo',
          message: text,
          conversationHistory: [],
        }),
      });
      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Chat API error: ${res.status} ${body}`);
      }
      const data = await res.json();
      if (Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      } else if (data.assistant?.content) {
        setSuggestions([
          {
            title: data.assistant.content.slice(0, 80),
            reason: data.assistant.content,
            giftId: 'fallback',
            priceEstimate: 'TBD',
          },
        ]);
      } else {
        setError('No suggestions returned.');
      }
    } catch (e: any) {
      setError(e.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Demo Concierge</h1>
      <p>Describe who you're shopping for:</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        style={{ width: '100%', marginBottom: 12 }}
        placeholder="Her birthday is coming up and she loves camping and hiking."
      />
      <button onClick={handleSubmit} style={{ padding: '10px 16px' }} disabled={loading}>
        {loading ? 'Thinking...' : 'Get Ideas'}
      </button>

      {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}

      {suggestions.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <h2>Suggestions</h2>
          {suggestions.map((s) => (
            <div
              key={s.giftId}
              style={{
                border: '1px solid #ccc',
                padding: 12,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <strong>{s.title}</strong>
              <p style={{ margin: '6px 0' }}>{s.reason}</p>
              <p style={{ margin: '4px 0', fontSize: '0.9em' }}>Est. Price: {s.priceEstimate}</p>
              <div style={{ display: 'flex', gap: 8 }}>
                <a href={`/api/go?giftId=${encodeURIComponent(s.giftId)}`} target="_blank" rel="noopener noreferrer">
                  <button>Shop now</button>
                </a>
                <button onClick={() => alert('Saved: ' + s.title)}>Save</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
