export default function Disclaimer() {
  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Disclaimer</h1>
      <div className="space-y-4 text-gray-800">
        <p><strong>Beta Software.</strong> Clockwork Gifts is in beta. Results may contain mistakes or out-of-date information. Verify details (price, availability, shipping) on the retailer site before purchasing.</p>
        <p><strong>Affiliate Links.</strong> Some outbound links are affiliate links. If you purchase through these links, we may earn a commission at no extra cost to you.</p>
        <p><strong>No Endorsement.</strong> Retailer names are provided for discovery. We are not affiliated with, endorsed by, or sponsored by the retailers unless explicitly stated.</p>
        <p><strong>Privacy.</strong> We do not sell personal information. Basic analytics may be used to improve suggestions. Do not enter sensitive data.</p>
        <p>Questions? Email <a href="mailto:support@clockworkgifts.com" className="underline">support@clockworkgifts.com</a>.</p>
      </div>
    </main>
  );
}
