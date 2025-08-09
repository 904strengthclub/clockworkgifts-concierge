import Button from '@/components/ui/Button';

export default function Home() {
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold">Clockwork Gifts (Beta)</h1>
        <p className="text-gray-700">
          Starting with a smart Amazon search concierge. Answer a few questions, get 5 buyable picks.
          More retailers are coming soon.
        </p>
        <div className="inline-flex gap-3 justify-center">
          <Button href="/start" size="lg">Start Demo</Button>
          <Button href="/disclaimer" variant="outline" size="lg">Read Disclaimer</Button>
        </div>
        <p className="text-xs text-gray-500">Thanks for helping us test—expect a few rough edges.</p>
      </div>
    </main>
  );
}
