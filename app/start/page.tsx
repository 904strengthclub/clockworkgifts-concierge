'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type ChatMsg = { from: 'bot' | 'user'; text: string };

export default function StartPage() {
  const router = useRouter();

  // chat & flow state
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: 'bot', text: "Hey! I’m your Clockwork gift concierge. Who are we shopping for?" },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [botTyping, setBotTyping] = useState(false);

  // collected form fields (match API keys/expectations)
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [occasion, setOccasion] = useState('');
  const [date, setDate] = useState('');        // MM-DD
  const [about, setAbout] = useState('');      // hobbies/personality
  const [budgetDisplay, setBudgetDisplay] = useState(''); // raw input (string)
  const [targetBudget, setTargetBudget] = useState<number | null>(null); // numeric for server

  // script of questions
  const questions = [
    { prompt: "What’s the recipient’s name?", setter: setName, key: 'name' as const, type: 'text' as const },
    { prompt: "Your relationship to them? (e.g., wife, boyfriend, friend, child)", setter: setRelationship, key: 'relationship' as const, type: 'text' as const },
    { prompt: "What’s the occasion? (birthday, anniversary, promotion, etc.)", setter: setOccasion, key: 'occasion' as const, type: 'text' as const },
    { prompt: "When is it? (MM-DD)", setter: setDate, key: 'date' as const, type: 'text' as const },
    { prompt: "Tell me about them—hobbies, passions, vibe. Anything that helps.", setter: setAbout, key: 'about' as const, type: 'textarea' as const },
    { prompt: "Target budget in USD (numbers only, e.g., 300).", setter: setBudgetDisplay, key: 'budget' as const, type: 'number' as const },
  ] as const;

  // auto-grow textarea for the “about” step
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (questions[step].type === 'textarea' && textareaRef.current) {
      textareaRef.current.style.height = '0px';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [inputValue, step]);

  function nextBot(line: string) {
    setBotTyping(true);
    setTimeout(() => {
      setMessages((prev) => [...prev, { from: 'bot', text: line }]);
      setBotTyping(false);
    }, 350);
  }

  function validateAndCommit(val: string) {
    const q = questions[step];

    if (q.key === 'date') {
      if (!/^\d{2}-\d{2}$/.test(val)) {
        setMessages((prev) => [...prev, { from: 'bot', text: 'Format as MM-DD (e.g., 12-15).' }]);
        setInputValue('');
        return false;
      }
    }

    if (q.key === 'budget') {
      const num = Number(val.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(num) || num <= 0) {
        setMessages((prev) => [...prev, { from: 'bot', text: 'Please enter a positive number like 300.' }]);
        setInputValue('');
        return false;
      }
      setTargetBudget(Math.round(num));
    }

    // commit answer
    q.setter(val);
    setMessages((prev) => [...prev, { from: 'user', text: val }]);
    return true;
  }

  function handleNext() {
    const val = inputValue.trim();
    if (!val) return;

    if (!validateAndCommit(val)) return;

    // advance or submit
    if (step < questions.length - 1) {
      setStep((s) => s + 1);
      setInputValue('');
      nextBot(questions[step + 1].prompt);
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessages((prev) => [...prev, { from: 'bot', text: 'Finding gift ideas…' }]);

    // build the payload the API expects
    const surveySummary = {
      name,
      relationship,
      occasion,
      date, // MM-DD; server converts to ISO year internally for context
      about,
      budget_range: budgetDisplay || (targetBudget ? `$${targetBudget}` : ''),
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
      if (!Array.isArray(suggestions) || suggestions.length === 0) {
        throw new Error('No valid suggestions.');
      }

      // Persist suggestions for /results
      localStorage.setItem('clockwork_suggestions', JSON.stringify(suggestions));
      // Persist last form for “Load 5 more” follow-up calls on /results
      localStorage.setItem('clockwork_last_form', JSON.stringify(surveySummary));

      router.push('/results');
    } catch (err) {
      console.error('Submit error:', err);
      setMessages((prev) => [
        ...prev,
        { from: 'bot', text: 'Hit a snag. Tap Send again in a few seconds.' },
      ]);
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        <h1 className="text-2xl font-bold mb-4 text-center">Clockwork Gifts Concierge</h1>

        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
          <div className="space-y-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-lg max-w-[80%] ${
                  m.from === 'bot' ? 'bg-gray-100 text-left' : 'bg-blue-100 text-right ml-auto'
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
              className="flex gap-2 mt-4 items-end"
            >
              {questions[step].type === 'textarea' ? (
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 border border-gray-300 p-3 rounded-lg resize-none overflow-hidden"
                  placeholder="Type your answer…"
                  rows={3}
                />
              ) : (
                <input
                  type={questions[step].key === 'budget' ? 'number' : 'text'}
                  inputMode={questions[step].key === 'budget' ? 'numeric' : 'text'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 border border-gray-300 p-3 rounded-lg"
                  placeholder={questions[step].key === 'date' ? 'MM-DD' : 'Type your answer…'}
                />
              )}
              <button
                type="submit"
                className="bg-black text-white px-4 py-2 rounded-lg"
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
