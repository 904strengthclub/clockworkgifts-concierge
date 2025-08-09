// /app/(legal)/disclaimer/page.tsx
import Button from '@/components/Button';

export default function Disclaimer() {
  return (
    <main className="min-h-screen p-6 grid place-items-center">
      <div className="max-w-3xl w-full space-y-4">
        <h1 className="text-2xl font-bold">Disclaimer</h1>
        <div className="space-y-4 text-gray-800">
          <p><strong>Beta Software.</strong> Clockwork Gifts is in beta. Results may contain mistakes or out-of-date information. Verify details (price, availability, shipping) on Amazon.</p>
          <p><strong>Affiliate Links.</strong> We use Amazon Associates links. If you purchase through these links, we may earn a commission at no extra cost to you.</p>
          <p><strong>No Endorsement.</strong> Retailer names are provided for discovery. We are not affiliated with, endorsed by, or sponsored by Amazon beyond its affiliate program.</p>
          <p><strong>Privacy.</strong> We do not sell personal information. Basic analytics may be used to improve suggestions. Do not enter sensitive data.</p>
          <p>Questions? Email <a href="mailto:support@clockworkgifts.com" className="underline">support@clockworkgifts.com</a>.</p>
        </div>
        <div className="pt-2">
          <Button href="/">Back to Home</Button>
        </div>
      </div>
    </main>
  );
}
