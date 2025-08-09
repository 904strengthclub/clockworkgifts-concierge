import { NextResponse } from 'next/server';

const TAGS: Record<string, string | undefined> = {
  'amazon.com': 'clockworkgift-20',
  // add more when you have them
};

const ALLOW = new Set(Object.keys(TAGS).concat([
  'etsy.com','uncommongoods.com','crateandbarrel.com','nordstrom.com','anthropologie.com',
  'food52.com','thegrommet.com','markandgraham.com','williams-sonoma.com',
  // …etc (your allowlist)
]));

async function headOk(url: string, ms = 2500) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(url, { method: 'HEAD', signal: ctl.signal, redirect: 'follow' as any });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(t);
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const u = searchParams.get('u');
  const r = (searchParams.get('r') || '').toLowerCase();
  if (!u || !r || !ALLOW.has(r)) {
    return NextResponse.redirect('https://clockworkgifts.com/disclaimer');
  }

  let dst = decodeURIComponent(u);
  try {
    const url = new URL(dst);
    // affiliate tag injection
    if (r === 'amazon.com' && !url.searchParams.has('tag')) {
      url.searchParams.set('tag', TAGS['amazon.com']!);
      dst = url.toString();
    }

    // verify; if dead, fallback to Google site query
    const ok = await headOk(dst);
    if (!ok) {
      const q = url.searchParams.get('keyword') || url.searchParams.get('q') || url.pathname.split('/').pop() || '';
      dst = `https://www.google.com/search?q=site:${r}+${encodeURIComponent(q)}`;
    }
  } catch {
    dst = `https://www.google.com/search?q=site:${r}`;
  }

  return NextResponse.redirect(dst, 302);
}
