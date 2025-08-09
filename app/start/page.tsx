'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type ChatMsg = { from: 'bot' | 'user'; text: string };

export default function StartPage() {
  const router = useRouter();

  // chat state
  const [step, setStep] = useState<number>(0);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: 'bot', text: "Hey! I’m your Clockwork gift concierge. Who are we shopping for?" },
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [botTyping, setBotTyping] = useState<boolean>(false);

  // form fields (match API keys)
  const [name, setName] = useState<string>('');
  const [relationship, setRelationship] = useState<string>('');
  const [occasion, setOccasion] = useState<string>('');
  const [date, setDate] = useState<string>(''); // MM-DD
  const [about, setAbout] = useState<string>(''); // NEW: personality/hobbies
  const [budgetRange, setBudgetRange] = useState<string>(''); // free text
  const [targetBudget, setTargetBudget] = useState<number | null>(null); // numeric

  const questions = [
    { prompt: "What’s the recipient’s name?", setter: setName, key: 'name' as const },
    { prompt: "Your relationship to them? (e.g., wife, boyfriend, friend, child)", setter: setRelationship, key: 'relationship' as const },
    { prompt: "What’s the occasion? (birthday, anniversary, promotion, etc.)", setter: setOccasion, key: 'occasion' as const },
    { prompt: "When is it? (MM-DD)", setter: setDate, key: 'date' as const },
    { prompt: "Tell me about them—hobbies, passions, vibe. Anything that helps.", setter: setAbout, key: 'about' as const },
    { prompt: "Target budget in USD (numbers only, e.g., 300). I’ll aim $0 to −15%.", setter: setBudgetRange, key: 'budget_range' as const },
  ] as const;

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessages(prev => [...prev, { from: 'bot', text: 'Finding the perfect gift ideas for you…' }]);

    const surveySummary = {
      name,
      relationship,
      occasion,
      date, // MM-DD (server will insert year)
      about, // NEW: included in prompt shaping
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
      setMessages(prev => [...prev, { from: 'bot', text: 'Hmm—hit a snag. Tap Send again in a few seconds.' }]);
      setIsSubmitting(false);
    }
  }

  function handleNext() {
    const currentQ = questions[step];
    const val = inputValue.trim();
    if (!val) return;

    if (currentQ.key === 'date') {
      const mmdd = /^\d{2}-\d{2}$/;
      if (!mmdd.test(val)) {
        setMessages(prev => [...prev, { from: 'bot', text: "Format as MM-DD (e.g., 12-15)." }]);
        setInputValue('');
        return;
      }
    }
    if (currentQ.key === 'budget_range') {
      const num = Number(val.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(num) || num <= 0) {
        setMessages(prev => [...prev, { from: 'bot', text: 'Please enter a positive number like 300.' }]);
        setInputValue('');
        return;
      }
      setTargetBudget(Math.round(num));
    }

    currentQ.setter(val);
    setMessages(prev => [...prev, { from: 'user', text: val }]);

    if (step < questions.length - 1) {
      const nextQ = questions[step + 1];
      setBotTyping(true);
      setTimeout(() => {
        setMessages(prev => [...prev, { from: 'bot', text: nextQ.prompt }]);
        setStep(s => s + 1);
        setInputValue('');
        setBotTyping(false);
      }, 350);
    } else {
      handleSubmit();
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Clockwork Gifts Concierge</h1>

        <div className="bg-white border border-gray-200 rounded-xl p-4">
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-lg max-w-[80%] ${
                  m.from === 'bot'
                    ? 'bg-gray-100 text-left'
                    : 'bg-blue-100 text-right ml-auto'
                }`}
              >
                {m.text}
              </div>
            ))}
            {botTyping && (
              <div className="px-3 py-2 rounded-lg max-w-[80%] bg-gray-100 text-left">
                <span role="img" aria-label="clock">🕒</span> thinking…
              </div>
            )}
          </div>

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
                className="flex-1 border border-gray-300 p-3 rounded-md"
                placeholder="Type your answer…"
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
      </div>
    </main>
  );
}
