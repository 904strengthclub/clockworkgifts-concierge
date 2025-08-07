'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StartPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [recipientName, setRecipientName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [occasionType, setOccasionType] = useState('');
  const [hobbiesStyle, setHobbiesStyle] = useState('');
  const [budgetRange, setBudgetRange] = useState('');

  const questions = [
    {
      prompt: "What’s the recipient’s name?",
      value: recipientName,
      setValue: setRecipientName,
      type: 'text',
    },
    {
      prompt: "What’s your relationship to them? (e.g., wife, boyfriend, friend, child)",
      value: relationship,
      setValue: setRelationship,
      type: 'text',
    },
    {
      prompt: "What kind of occasion is this for? (birthday, anniversary, promotion, etc.)",
      value: occasionType,
      setValue: setOccasionType,
      type: 'text',
    },
    {
      prompt: "What are their hobbies, interests, or general gift style?",
      value: hobbiesStyle,
      setValue: setHobbiesStyle,
      type: 'text',
    },
    {
      prompt: "What’s your gift budget?",
      value: budgetRange,
      setValue: setBudgetRange,
      type: 'number',
    },
  ];

  const handleSubmit = async () => {
    const surveySummary = {
      recipient_name: recipientName,
      relationship,
      occasion_type: occasionType,
      hobbies_style: hobbiesStyle,
      budget_range: budgetRange,
    };

    const res = await fetch('/api/generate-suggestions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ surveySummary })
    });

    const suggestions = await res.json();
    console.log('Received suggestions from API:', suggestions); // ✅ DEBUG LINE

    if (suggestions && Array.isArray(suggestions)) {
      localStorage.setItem('clockwork_suggestions', JSON.stringify(suggestions));
      router.push('/results');
    } else {
      alert('No suggestions returned. Please try again.');
    }
  };

  const current = questions[step];

  return (
    <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Clockwork Gifts Concierge</h1>
      <p>{current.prompt}</p>
      <input
        type={current.type}
        value={current.value}
        onChange={(e) => current.setValue(e.target.value)}
        style={{ padding: 8, fontSize: 16, width: '100%', marginBottom: 16 }}
      />
      <button
        onClick={() => {
          if (step < questions.length - 1) {
            setStep(step + 1);
          } else {
            handleSubmit();
          }
        }}
        style={{ padding: '10px 20px', fontSize: 16 }}
      >
        {step < questions.length - 1 ? 'Next' : 'Submit'}
      </button>
    </main>
  );
}
