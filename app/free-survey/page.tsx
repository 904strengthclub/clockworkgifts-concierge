// /app/free-survey/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function FreeSurveyPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [occasionType, setOccasionType] = useState('');
  const [occasionDate, setOccasionDate] = useState('');
  const [budget, setBudget] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !relationship || !occasionType || !occasionDate || !budget) return;
    setLoading(true);

    const summary = `Name: ${name}\nRelationship: ${relationship}\nOccasion: ${occasionType} on ${occasionDate}\nBudget: ${budget}`;

    const res = await fetch('/api/generate-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surveySummary: summary })
    });

    const suggestions = await res.json();
    localStorage.setItem('gift_suggestions', JSON.stringify(suggestions));
    router.push('/free-survey/results');
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Find the Perfect Gift in 5 Minutes</h1>
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Recipient's Name"
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <select
          value={relationship}
          onChange={e => setRelationship(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Select Relationship</option>
          <option>Husband/Wife</option>
          <option>Boyfriend/Girlfriend</option>
          <option>Friend</option>
          <option>Child</option>
          <option>Coworker</option>
          <option>Other</option>
        </select>
        <input
          list="occasion-types"
          placeholder="Occasion Type (e.g., Birthday)"
          value={occasionType}
          onChange={e => setOccasionType(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <datalist id="occasion-types">
          <option value="Birthday" />
          <option value="Anniversary" />
          <option value="Graduation" />
          <option value="Holiday" />
        </datalist>
        <input
          type="text"
          placeholder="Occasion Date (MM-DD)"
          value={occasionDate}
          onChange={e => setOccasionDate(e.target.value)}
          className="w-full border p-2 rounded"
        />
        <select
          value={budget}
          onChange={e => setBudget(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="">Select Budget</option>
          <option>Under $50</option>
          <option>$50–$100</option>
          <option>$100–$500</option>
          <option>$500+</option>
        </select>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-black text-white py-2 rounded hover:opacity-90"
        >
          {loading ? 'Finding Gifts...' : 'Find Gifts'}
        </button>
      </div>
    </div>
  );
}
