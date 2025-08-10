// app/api/early-signup/route.ts
export const runtime = 'nodejs'; // firebase-admin requires Node runtime

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { name, email } = await req.json();

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const doc = {
      name: typeof name === 'string' ? name.trim() : '',
      email: email.trim().toLowerCase(),
      timestamp: new Date().toISOString(),
      source: 'homepage',
    };

    await db.collection('early_access_signups').add(doc);

    // Optional success log:
    // console.log('EARLY_SIGNUP', { email: doc.email, ts: doc.timestamp });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('early-signup error:', err);
    return NextResponse.json({ error: 'Failed to save signup' }, { status: 500 });
  }
}
