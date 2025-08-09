// /app/page.tsx
import Button from '@/components/Button';

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold">Clockwork Gifts (Beta)</h1>
        <p className="text-gray-700">
          We’re beta testing a fast, AI-powered Amazon gift concierge. Answer a few questions,
          and we’ll return 5 ideas you can buy right now.
        </p>
        <div className="inline-flex gap-3 justify-center">
          <Button href="/start">Start Demo</Button>
          <Button href="/disclaimer" className="bg-white text-gray-800 border border-gray-300">Read Disclaimer</Button>
        </div>
        <p className="text-xs text-gray-500">
          Thanks for helping us test—expect occasional rough edges while we tune results.
        </p>
      </div>
    </main>
  );
}
