export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  const k = 'clockwork_session_id';
  let v = localStorage.getItem(k);
  if (!v) {
    v = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
    localStorage.setItem(k, v);
  }
  return v;
}
