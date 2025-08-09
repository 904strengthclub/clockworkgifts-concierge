export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-6">
        <h1 className="text-3xl font-bold">Clockwork Gifts (Beta)</h1>
        <p className="text-gray-700">
          We’re beta testing a fast, AI-powered gift concierge to prep for launch. Try the demo—
          we’ll ask a few questions and return 5 buyable picks that match your budget.
        </p>
        <div className="inline-flex gap-3">
          <a
            href="/start"
            className="bg-black text-white px-5 py-3 rounded-lg font-semibold"
          >
            Start Demo
          </a>
          <a
            href="/disclaimer"
            className="px-5 py-3 rounded-lg border border-gray-300 text-gray-700"
          >
            Read Disclaimer
          </a>
        </div>
        <p className="text-xs text-gray-500">
          Thanks for helping us test—expect occasional rough edges while we tune results.
        </p>
      </div>
    </main>
  );
}
