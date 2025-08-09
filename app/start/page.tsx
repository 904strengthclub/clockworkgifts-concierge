'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ChatMsg = { from: 'bot' | 'user'; text: string };

export default function StartPage() {
  const router = useRouter();

  // chat flow state
  const [step, setStep] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: 'bot', text: "Hey there! I'm your Clockwork gift concierge. Who are we shopping for today?" },
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // form fields (match API keys)
  const [name, setName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [date, setDate] = useState<string>(''); // YYYY-MM-DD
  const [budgetRange, setBudgetRange] = useState<string>(''); // free text to show user
  const [targetBudget, setTargetBudget] = useState<number | null>(null); // numeric for server banding

  // question script
  const questions = [
    { prompt: "What’s the recipient’s name?", setter: setName, key: 'name' as const },
    {
      prompt: "What’s your relationship to them? (e.g., wife, boyfriend, friend, child)",
      setter: setRelationship,
      key: 'relationship' as const,
    },
    {
      prompt: "What kind of occasion is this for? (birthday, anniversary, promotion, etc.)",
      setter: setOccasion,
      key: 'occasion' as const,
    },
    {
      prompt: "When is the occasion? (YYYY-MM-DD)",
      setter: setDate,
      key: 'date' as const,
    },
    {
      prompt: "What’s your target budget in USD? (e.g., 300)",
      setter: setBudgetRange,
      key: 'budget_range' as const,
    },
  ] as const;

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessages(prev => [...prev, { from: 'bot', text: 'Finding the perfect gift ideas for you...' }]);

    const surveySummary = {
      name,
      relationship,
      occasion,
      date,
      budget_range: budgetRange || (targetBudget ? `$${targetBudget}` : ''),
      target_budget_usd: targetBudget ?? null,
    };

    try {
      const res = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveySummary }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const suggestions = await res.json();
      if (Array.isArray(suggestions) && suggestions.length > 0) {
        localStorage.setItem('clockwork_suggestions', JSON.stringify(suggestions));
        router.push('/results');
      } else {
        throw new Error('No valid suggestions returned.');
      }
    } catch (err) {
      console.error('Error submitting survey:', err);
      setMessages(prev => [...prev, { from: 'bot', text: 'Oops! Something went wrong. Please try again.' }]);
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    const currentQ = questions[step];
    const value = inputValue.trim();
    if (!value) return;

    // validate date format
    if (currentQ.key === 'date') {
      const isoLike = /^\d{4}-\d{2}-\d{2}$/;
      if (!isoLike.test(value)) {
        setMessages(prev => [
          ...prev,
          { from: 'bot', text: "Could you format the date like YYYY-MM-DD? (e.g., 2025-12-15)" },
        ]);
        setInputValue('');
        return;
      }
    }

    // validate + parse budget number
    if (currentQ.key === 'budget_range') {
      const num = Number(value.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(num) || num <= 0) {
        setMessages(prev => [...prev, { from: 'bot', text: 'Please enter a positive number like 300.' }]);
        setInputValue('');
        return;
      }
      setTargetBudget(Math.round(num));
    }

    // commit answer
    currentQ.setter(value);
    setMessages(prev => [...prev, { from: 'user', text: value }]);

    // next step or submit
    if (step < questions.length - 1) {
      const nextQ = questions[step + 1];
      setTimeout(() => {
        setMessages(prev => [...prev, { from: 'bot', text: nextQ.prompt }]);
        setStep(s => s + 1);
        setInputValue('');
      }, 300);
    } else {
      handleSubmit();
    }
  }

  return (
    <main className="max-w-xl mx-auto p-6 font-sans">
      <h1 className="text-2xl font-bold mb-6">Clockwork Gifts Concierge</h1>

      <div className="space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded-md max-w-[75%] ${
              msg.from === 'bot' ? 'bg-gray-200 text-left' : 'bg-blue-100 text-right ml-auto'
            }`}
          >
            {msg.text}
          </div>
        ))}

        {!isSubmitting && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (inputValue.trim()) handleNext();
            }}
            className="flex gap-2 mt-4"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="flex-1 border border-gray-300 p-2 rounded-md"
              placeholder="Type your answer..."
              disabled={isSubmitting}
            />
            <button
              type="submit"
              className="bg-black text-white px-4 py-2 rounded-md"
              disabled={isSubmitting}
            >
              Send
            </button>
          </form>
        )}

        {isSubmitting && (
          <div className="text-center mt-6">
            <p className="text-lg font-medium">Finding gift ideas…</p>
            <div className="mt-4 animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-800 mx-auto" />
          </div>
        )}
      </div>
    </main>
  );
}
