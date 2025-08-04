cat <<'EOF' > app/page.tsx
export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Clockwork Gifts Concierge</h1>
      <p>Welcome. Public demo and GPT concierge coming soon.</p>
      <p><a href="/start">Start Demo</a></p>
      <p><a href="/api/health">Health Check</a></p>
      <p><a href="/api/go?giftId=test">Test Affiliate Link</a></p>
    </main>
  );
}
EOF
