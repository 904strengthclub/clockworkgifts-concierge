'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';

type ChatMsg = { from: 'bot' | 'user'; text: string };

export default function StartPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { from: 'bot', text: "Hey! I’m your Clockwork gift concierge. Who are you buying this for? (e.g., my wife, son, coworker)" },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [botTyping, setBotTyping] = useState(false);

  // New survey fields
  const [relationship, setRelationship] = useState('');
  const [about, setAbout] = useState('');
  const [smileScene, setSmileScene] = useState('');
  const [talkHours, setTalkHours] = useState('');
  const [budget, setBudget] = useState<number | null>(null);

  const questions = [
    {
      prompt: "Who are you buying this for? (e.g., my wife, son, coworker)",
      setter: (v: string) => setRelationship(v),
      key: 'relationship' as const,
      type: 'text' as const,
    },
    {
      prompt: "Tell us a little about them—hobbies, interests, or anything that would help us choose the perfect gift.",
      setter: (v: string) => setAbout(v),
      key: 'about' as const,
      type: 'textarea' as const,
    },
    {
      prompt: "When you picture them smiling, what are they doing?",
      setter: (v: string) => setSmileScene(v),
      key: 'smile_scene' as const,
      type: 'textarea' as const,
    },
    {
      prompt: "What’s something they could talk about for hours without getting bored?",
      setter: (v: string) => setTalkHours(v),
      key: 'talk_hours' as const,
      type: 'textarea' as const,
    },
    {
      prompt: "What’s your gift budget? (numbers only, e.g., 300)",
      setter: (v: string) => {
        const n = Number((v || '').toString().replace(/[^\d.]/g, ''));
        setBudget(Number.isFinite(n) && n > 0 ? Math.round(n) : null);
      },
      key: 'budget' as const,
      type: 'number' as const,
    },
  ] as const;

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  useEffect(() => {
    if (questions[step].type === 'textarea' && textareaRef.current) {
      textareaRef.current.style.height = '0px';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 12 + 'px';
    }
  }, [inputValue, step]);

  function nextBot(line: string) {
    setBotTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { from: 'bot', text: line }]);
      setBotTyping(false);
    }, 300);
  }

  function validateAndCommit(val: string) {
    const q = questions[step];

    if (q.key === 'budget') {
      const n = Number(val.replace(/[^\d.]/g, ''));
      if (!Number.isFinite(n) || n <= 0) {
        setMessages(prev => [...prev, { from: 'bot', text: 'Please enter a positive number like 300.' }]);
        setInputValue('');
        return false;
      }
      setBudget(Math.round(n));
    }

    q.setter(val);
    setMessages(prev => [...prev, { from: 'user', text: val }]);
    return true;
  }

  function handleNext() {
    const val = inputValue.trim();
    if (!val) return;
    if (!validateAndCommit(val)) return;

    if (step < questions.length - 1) {
      setStep(s => s + 1);
      setInputValue('');
      nextBot(questions[step + 1].prompt);
    } else {
      handleSubmit();
    }
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    setMessages(prev => [...prev, { from: 'bot', text: 'Finding gift ideas…' }]);

    const surveySummary = {
      relationship,
      about,
      smile_scene: smileScene,
      talk_hours: talkHours,
      budget: budget ?? undefined, // number
    };

    try {
      const res = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveySummary }),
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const suggestions = await res.json();
      if (!Array.isArray(suggestions) || suggestions.length === 0) throw new Error('No valid suggestions.');

      localStorage.setItem('clockwork_suggestions', JSON.stringify(suggestions));
      localStorage.setItem('clockwork_last_form', JSON.stringify(surveySummary));
      router.push('/results');
    } catch (e) {
      setMessages(prev => [...prev, { from: 'bot', text: 'Hit a snag. Tap Send again in a few seconds.' }]);
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-4">
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
              onSubmit={(e) => { e.preventDefault(); if (inputValue.trim()) handleNext(); }}
              className="flex gap-2 mt-4 items-end"
            >
              {questions[step].type === 'textarea' ? (
                <textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 w-full border border-gray-300 p-3 rounded-lg resize-none overflow-hidden"
                  placeholder="Type your answer…"
                  rows={4}
                />
              ) : (
                <input
                  type={questions[step].key === 'budget' ? 'number' : 'text'}
                  inputMode={questions[step].key === 'budget' ? 'numeric' : 'text'}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="flex-1 border border-gray-300 p-3 rounded-lg"
                  placeholder={questions[step].key === 'budget' ? 'e.g., 300' : 'Type your answer…'}
                />
              )}
              <Button type="submit" size="md">Send</Button>
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
