'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function StartPage() {
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState([
    { from: 'bot', text: "Hey there! I'm your Clockwork gift concierge. Who are we shopping for today?" },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [recipientName, setRecipientName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [occasionType, setOccasionType] = useState('');
  const [hobbiesStyle, setHobbiesStyle] = useState('');
  const [budgetRange, setBudgetRange] = useState('');

  const questions = [
    {
      prompt: "What’s the recipient’s name?",
      setter: setRecipientName,
    },
    {
      prompt: "What’s your relationship to them? (e.g., wife, boyfriend, friend, child)",
      setter: setRelationship,
    },
    {
      prompt: "What kind of occasion is this for? (birthday, anniversary, promotion, etc.)",
      setter: setOccasionType,
    },
    {
      prompt: "What are their hobbies, interests, or general gift style?",
      setter: setHobbiesStyle,
    },
    {
      prompt: "What’s your gift budget?",
      setter: setBudgetRange,
    },
  ];

  const handleNext = () => {
    const currentQ = questions[step];
    currentQ.setter(inputValue);
    setMessages(prev => [...prev, { from: 'user', text: inputValue }]);

    if (step < questions.length - 1) {
      const nextQ = questions[step + 1];
      setTimeout(() => {
        setMessages(prev => [...prev, { from: 'bot', text: nextQ.prompt }]);
        setStep(step + 1);
        setInputValue('');
      }, 500);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setMessages(prev => [...prev, { from: 'bot', text: 'Finding the perfect gift ideas for you...' }]);

    const surveySummary = {
      recipient_name: recipientName,
      relationship,
      occasion_type: occasionType,
      hobbies_style: hobbiesStyle,
      budget_range: budgetRange,
    };

    try {
      const res = await fetch('/api/generate-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveySummary }),
      });

      const suggestions = await res.json();
      if (suggestions && Array.isArray(suggestions)) {
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
  };

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
