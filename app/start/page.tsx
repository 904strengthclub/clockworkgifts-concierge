'use client';

import { useState } from 'react';

export default function StartDemo() {
  const [step, setStep] = useState(0);
  const [responses, setResponses] = useState({
    recipient_name: '',
    relationship: '',
    occasion_type: '',
    hobbies_style: '',
    budget_range: '',
  });
  const [currentInput, setCurrentInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);

  const questions = [
    { key: 'recipient_name', label: 'What’s the recipient’s name?' },
    { key: 'relationship', label: 'What’s your relationship to them?' },
    { key: 'occasion_type', label: 'What kind of occasion is this for?' },
    { key: 'hobbies_style', label: 'What are their hobbies, interests, or gift style?' },
    {
      key: 'budget_range',
      label: 'What’s your gift budget?',
      options: ['under $50', '$50–$100', '$100–$500', '$500+'],
    },
  ];

  const handleSubmitInput = () => {
    const key = questions[step].key;
    setResponses(prev => ({ ...prev, [key]: currentInput }));
    setCurrentInput('');
    setStep(prev => prev + 1);
  };

  const handleOptionClick = (option: string) => {
    const key = questions[step].key;
    setResponses(prev => ({ ...prev, [key]: option }));
    setStep(prev => prev + 1);
  };

  const handleGenerate = async () => {
    setLoading(true);
    const res = await fetch('/api/generate-suggestions', {
      method: 'POST',
      body: JSON.stringify({ surveySummary: responses }),
    });
    const data = await res.json();
    setResults(data);
    setLoading(false);
  };

  return (
    <main style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Clockwork Gift Concierge</h1>

      {step < questions.length && (
        <>
          <p>{questions[step].label}</p>
          {questions[step].options ? (
            questions[step].options.map(option => (
              <button
                key={option}
                style={{ display: 'block', margin: '10px 0' }}
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </button>
            ))
          ) : (
            <>
              <input
                type="text"
                value={currentInput}
                onChange={e => setCurrentInput(e.target.value)}
                placeholder="Type your answer..."
                style={{ padding: 8, width: '100%', maxWidth: 300 }}
              />
              <br />
              <button onClick={handleSubmitInput} style={{ marginTop: 10 }}>
                Next
              </button>
            </>
          )}
        </>
      )}

      {step === questions.length && !loading && results.length === 0 && (
        <button onClick={handleGenerate} style={{ marginTop: 20 }}>
          Generate Gift Ideas
        </button>
      )}

      {loading && <p>Generating gift ideas...</p>}

      {results.length > 0 && (
        <>
          <h2>Gift Suggestions</h2>
          <ul>
            {results.map((gift, idx) => (
              <li key={idx} style={{ marginBottom: 20 }}>
                <strong>{gift.name}</strong> — {gift.estimated_price}
                <br />
                <em>{gift.store_or_brand}</em>
                <p>{gift.description}</p>
                {gift.image_url && (
                  <img
                    src={gift.image_url}
                    alt={gift.name}
                    style={{ maxWidth: 200, borderRadius: 8 }}
                  />
                )}
                <br />
                <a
                  href={`/api/go?giftId=${encodeURIComponent(gift.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Gift
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
