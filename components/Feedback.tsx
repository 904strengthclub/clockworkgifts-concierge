'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';

export default function Feedback() {
  const [done, setDone] = useState<null | 'up' | 'down'>(null);
  const [sending, setSending] = useState(false);

  async function send(rating: 'up'|'down') {
    try {
      setSending(true);
      const suggestions = localStorage.getItem('clockwork_suggestions');
      await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating,
          location: 'results',
          suggestionsCount: suggestions ? JSON.parse(suggestions).length : 0,
        }),
      });
      setDone(rating);
    } finally {
      setSending(false);
    }
  }

  if (done) return <p className="text-sm text-gray-600 text-center">Thanks for the feedback! {done === 'up' ? '👍' : '👎'}</p>;

  return (
    <div className="flex items-center justify-center gap-3">
      <Button size="md" onClick={() => send('up')} disabled={sending}>👍</Button>
      <Button size="md" variant="outline" onClick={() => send('down')} disabled={sending}>👎</Button>
    </div>
  );
}
