// app/api/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const missing: string[] = [];
  if (!process.env.OPENAI_API_KEY) missing.push('OPENAI_API_KEY');
  if (!process.env.FIREBASE_SERVICE_ACCOUNT) missing.push('FIREBASE_SERVICE_ACCOUNT');
  if (!process.env.AMAZON_ASSOCIATE_ID) missing.push('AMAZON_ASSOCIATE_ID');

  if (missing.length) {
    return NextResponse.json({ ok: false, missing }, { status: 500 });
  }
  return NextResponse.json({ ok: true, message: 'Secrets present' });
}
