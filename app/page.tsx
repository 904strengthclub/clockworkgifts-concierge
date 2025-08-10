'use client';

import { useState } from 'react';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | 'ok' | 'err'>(null);

  async function submitEarly(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setDone(null);
    try {
      const res = await fetch('/api/early-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) throw new Error('bad status');
      setDone('ok');
      setEmail('');
      setName('');
    } catch {
      setDone('err');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">
      {/* Top bar */}
      <header className="max-w-6xl mx-auto flex items-center justify-between px-4 py-4">
        <div className="text-lg font-semibold">Clockwork Gifts</div>
        <span className="text-xs font-semibold bg-gray-900 text-white px-2 py-1 rounded-full">BETA</span>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 py-10 md:py-16 grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
            The smartest way to find the perfect gift
          </h1>
          <p className="mt-4 text-lg text-gray-700">
            We’re testing our AI-powered gift engine—future updates will include <strong>stored recipient profiles</strong> and <strong>reminders</strong> so you’ll never forget a gift again.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/start"><Button size="lg">Try the Beta</Button></Link>
            <Link href="/disclaimer"><Button size="lg" variant="outline">Read Disclaimer</Button></Link>
            <a href="#early-list"><Button size="lg" variant="soft">Join Early List</Button></a>
          </div>
        </div>

        {/* Playful inline SVG illustration */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <svg viewBox="0 0 520 300" className="w-full h-auto">
            <defs>
              <linearGradient id="g1" x1="0" x2="1">
                <stop offset="0%" stopColor="#f5f5f5" />
                <stop offset="100%" stopColor="#e5e7eb" />
              </linearGradient>
            </defs>
            <rect x="0" y="0" width="520" height="300" fill="url(#g1)" rx="16" />
            {/* phone */}
            <rect x="300" y="40" width="160" height="220" rx="24" fill="#111827" />
            <rect x="305" y="55" width="150" height="190" rx="18" fill="#fff" />
            <circle cx="380" cy="47" r="3" fill="#4b5563" />
            {/* little gift cards */}
            <g transform="translate(40,50)">
              <rect width="120" height="70" rx="12" fill="#ffffff" stroke="#e5e7eb" />
              <rect x="10" y="10" width="40" height="30" rx="6" fill="#111827" />
              <rect x="60" y="12" width="50" height="8" rx="4" fill="#9ca3af" />
              <rect x="60" y="26" width="70" height="6" rx="3" fill="#d1d5db" />
              <rect x="60" y="38" width="56" height="6" rx="3" fill="#e5e7eb" />
            </g>
            <g transform="translate(60,140) rotate(-6)">
              <rect width="140" height="80" rx="12" fill="#ffffff" stroke="#e5e7eb" />
              <rect x="12" y="12" width="42" height="32" rx="6" fill="#111827" />
              <rect x="62" y="15" width="58" height="9" rx="4" fill="#9ca3af" />
              <rect x="62" y="32" width="74" height="7" rx="3" fill="#d1d5db" />
              <rect x="62" y="46" width="60" height="7" rx="3" fill="#e5e7eb" />
            </g>
            {/* floating gift icons */}
            <g transform="translate(410,90)">
              <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#f59e0b" />
              <rect x="-6" y="-20" width="12" height="8" rx="2" fill="#f59e0b" />
              <line x1="-6" y1="-20" x2="-6" y2="12" stroke="#fff" strokeWidth="2"/>
              <line x1="-12" y1="0" x2="12" y2="0" stroke="#fff" strokeWidth="2"/>
            </g>
            <g transform="translate(350,160) rotate(10)">
              <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#6366f1" />
              <rect x="-6" y="-20" width="12" height="8" rx="2" fill="#6366f1" />
              <line x1="-6" y1="-20" x2="-6" y2="12" stroke="#fff" strokeWidth="2"/>
              <line x1="-12" y1="0" x2="12" y2="0" stroke="#fff" strokeWidth="2"/>
            </g>
            <g transform="translate(470,200) rotate(-8)">
              <rect x="-12" y="-12" width="24" height="24" rx="4" fill="#10b981" />
              <rect x="-6" y="-20" width="12" height="8" rx="2" fill="#10b981" />
              <line x1="-6" y1="-20" x2="-6" y2="12" stroke="#fff" strokeWidth="2"/>
              <line x1="-12" y1="0" x2="12" y2="0" stroke="#fff" strokeWidth="2"/>
            </g>
          </svg>
        </div>
      </section>

      {/* What works today */}
      <section className="max-w-6xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
          <h2 className="text-2xl font-semibold">What works today (Beta)</h2>
          <ul className="mt-4 space-y-2 text-gray-700">
            <li>✓ Answer a few thoughtful questions</li>
            <li>✓ Get 5 curated ideas in your budget</li>
            <li>✓ Click to buy from trusted retailers (Amazon to start)</li>
          </ul>
          <div className="mt-6">
            <Link href="/start"><Button size="md">Try the Beta →</Button></Link>
          </div>
        </div>
      </section>

      {/* Coming soon */}
      <section className="max-w-6xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            <h3 className="text-xl font-semibold">Coming soon</h3>
            <ul className="mt-3 space-y-2 text-gray-700">
              <li>• Stored recipient profiles</li>
              <li>• Occasion & gift history</li>
              <li>• Reminders</li>
              <li>• Last-minute gift mode</li>
              <li>• Budget planning</li>
            </ul>
          </div>

          {/* Early list form */}
          <div id="early-list" className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            <h3 className="text-xl font-semibold">Join the early list</h3>
            <p className="mt-2 text-gray-700">Get updates as we roll out profiles and reminders.</p>

            <form onSubmit={submitEarly} className="mt-4 space-y-3">
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3"
              />
              <input
                type="email"
                placeholder="Email (required)"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3"
              />
              <Button type="submit" size="md" disabled={busy}>
                {busy ? 'Saving…' : 'Join Early Access'}
              </Button>

              {done === 'ok' && <p className="text-green-600 text-sm">Thanks! You’re on the list.</p>}
              {done === 'err' && <p className="text-red-600 text-sm">Something went wrong. Please try again.</p>}
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-10 py-8 bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-600">© {new Date().getFullYear()} Clockwork Gifts</p>
          <div className="flex gap-4 text-sm">
            <Link href="/disclaimer" className="text-gray-700 underline">Disclaimer</Link>
            <a href="mailto:support@clockworkgifts.com" className="text-gray-700 underline">Contact</a>
            <span className="text-gray-400">We may earn a commission from affiliate links.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
