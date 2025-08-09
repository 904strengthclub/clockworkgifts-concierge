// /app/(legal)/disclaimer/page.tsx
import { Button } from '@/components/ui/Button';

export default function Disclaimer() {
  return (
    <main className="min-h-screen p-6 grid place-items-center">
      <div className="max-w-3xl w-full space-y-4">
        <h1 className="text-2xl font-bold">Disclaimer</h1>
        <div className="space-y-4 text-gray-800">
          <p><strong>Beta Software.</strong> Results may contain mistakes or be out of date. Verify details on Amazon.</p>
          <p><strong>Affiliate Links.</strong> We use Amazon Associates links. We may earn a commission at no extra cost to you.</p>
          <p><strong>No Endorsement.</strong> We are not affiliated with or endorsed by Amazon beyond its affiliate program.</p>
          <p><strong>Privacy.</strong> We don’t sell personal info. Basic analytics may be used to improve suggestions. Don’t enter sensitive data.</p>
        </div>
        <div className="flex gap-3 pt-2">
          <Button href="mailto:support@clockworkgifts.com" className="bg-white text-gray-800 border border-gray-300">
            Email Support
          </Button>
          <Button href="/">Back to Home</Button>
        </div>
      </div>
    </main>
  );
}
