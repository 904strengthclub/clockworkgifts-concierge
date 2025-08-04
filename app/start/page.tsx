// app/start/page.tsx
'use client';

import React, { useState } from 'react';

export default function StartPage() {
  const [text, setText] = useState('');
  const handle = () => alert('Stub: ' + text);

  return (
    <div style={{ padding: 40, maxWidth: 600, margin: '0 auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Demo Concierge</h1>
      <p>Type a quick description of the gift recipient:</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        style={{ width: '100%', marginBottom: 12 }}
        placeholder="She loves cozy mornings and candles..."
      />
      <button onClick={handle} style={{ padding: '10px 16px' }}>
        Get Ideas
      </button>
    </div>
  );
}
