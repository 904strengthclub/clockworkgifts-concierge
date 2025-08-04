// app/api/conversational/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

type Suggestion = {
  title: string;
  reason: string;
  giftId: string;
  priceEstimate: string;
};

// Firebase admin init (only if service account is present)
let db: ReturnType<typeof getFirestore> | null = null;
if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  try {
    if (!getApps().length) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT as string);
      initializeApp({
        credential: cert(serviceAccount as any),
      } as any);
    }
    db = getFirestore();
  } catch (e) {
    // swallow; downstream code can still run in demo mode
    console.warn('Firebase init failed:', (e as any).message || e);
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Simple stub for gift engine; replace with real logic or import
async function runGiftEngine(description: string): Promise<Suggestion[]> {
  return [
    {
      title: 'Cozy Throw Blanket',
      reason: 'Matches the cozy evenings vibe you described.',
      giftId: 'cozy-blanket-1',
      priceEstimate: '$45',
    },
    {
      title: 'Artisanal Candle Set',
      reason: 'She likes candles and ambience; this set elevates that.',
      giftId: 'candle-set-2',
      priceEstimate: '$30',
    },
    {
      title: 'Premium Journal',
      reason: 'For someone who journals, a high-quality notebook feels thoughtful.',
      giftId: 'journal-3',
      priceEstimate: '$25',
    },
  ];
}

function safeParseSuggestions(raw: string): Suggestion[] {
  // Try to extract JSON first
  try {
    const parsed = JSON.parse(raw);
    if (parsed && Array.isArray(parsed.suggestions)) {
      return parsed.suggestions.map((s: any) => ({
        title: String(s.title || '').slice(0, 100),
        reason: String(s.reason || ''),
        giftId: String(s.giftId || 'unknown'),
        priceEstimate: String(s.priceEstimate || ''),
      }));
    }
  } catch {
    // fallthrough
  }

  // Fallback: wrap the entire assistant content as one suggestion
  return [
    {
      title: raw.slice(0, 80),
      reason: raw,
      giftId: 'fallback-1',
      priceEstimate: 'TBD',
    },
  ];
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({} as any));
  const { mode = 'demo', message = '', conversationHistory = [] } = body;

  // Build system prompt
  let systemPrompt: string;
  if (mode === 'demo') {
    systemPrompt = `
You are the Clockwork Gifts Concierge in demo mode. The user will describe who they're shopping for in free text.
Return exactly a JSON object with a key "suggestions" whose value is an array of 3 to 5 gift suggestions. 
Each suggestion must include:
- title (short name)
- reason (why it fits)
- giftId (unique string)
- priceEstimate (string, e.g. "$50")

Example output (no extra explanation):
{
  "suggestions":[
    {
      "title":"Cozy Throw Blanket",
      "reason":"They love cozy evenings and snuggling up.",
      "giftId":"cozy-blanket-1",
      "priceEstimate":"$50"
    },
    {
      "title":"Artisanal Candle Set",
      "reason":"Matches their love of candles and ambiance.",
      "giftId":"candle-set-2",
      "priceEstimate":"$35"
    }
  ]
}
`;
  } else {
    // full mode: include existing profile context if available
    let profileSummary = '';
    if (db && body.recipientId && body.userId) {
      try {
        const snap = await db
          .collection('users')
          .doc(body.userId)
          .collection('recipients')
          .doc(body.recipientId)
          .get();
        if (snap.exists) {
          profileSummary = JSON.stringify(snap.data());
        }
      } catch {
        // ignore
      }
    }
    systemPrompt = `
You are the Clockwork Gifts Concierge. Use the recipient profile context to refine understanding: ${profileSummary}.
The user will provide additional input. Suggest 3-5 gift ideas tailored to their preferences, occasion, and constraints.
Return a JSON object in the same shape as demo mode, plus any clarifying questions if needed.
`;
  }

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: message },
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4',
      messages,
      temperature: 0.7,
      max_tokens: 700,
    });

    const assistantMessage = response.choices?.[0]?.message;
    const rawContent: string = assistantMessage?.content || '';

    // Parse suggestions
    let suggestions: Suggestion[] = safeParseSuggestions(rawContent);

    // If in demo mode and no valid structured suggestions, optionally supplement via stubbed engine
    if (mode === 'demo' && suggestions.length === 1 && suggestions[0].giftId === 'fallback-1') {
      const supplemental = await runGiftEngine(message);
      suggestions = supplemental;
    }

    return NextResponse.json({
      assistant: { content: rawContent },
      suggestions,
    });
  } catch (err: any) {
    console.error('Chat endpoint error:', err);
    return NextResponse.json(
      { error: err.message || 'Unknown error from OpenAI' },
      { status: 500 }
    );
  }
}
