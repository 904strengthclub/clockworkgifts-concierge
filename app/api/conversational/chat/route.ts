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

// Firebase admin init if available
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
    console.warn('Firebase init failed:', (e as any).message || e);
  }
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Stubbed fallback gift engine
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
      reason: 'She likes candles and ambiance; this set elevates that.',
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
    // ignore
  }

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
  const { mode = 'demo', message = '', conversationHistory = [], userId, recipientId } = body;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: 'Missing OPENAI_API_KEY' }, { status: 500 });
  }

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
    let profileSummary = '';
    if (db && userId && recipientId) {
      try {
        const snap = await db
          .collection('users')
          .doc(userId)
          .collection('recipients')
          .doc(recipientId)
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
Return a JSON object in the same shape as demo mode.
`;
  }

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: message },
  ];

  // Prefer the cheaper model first
  const modelCandidates = ['gpt-3.5-turbo', 'gpt-4-0613', 'gpt-4'];
  let response: any = null;
  let usedModel = '';
  let suggestions: Suggestion[] = [];
  let rawContent = '';
  let fallbackDueToQuota = false;

  for (const model of modelCandidates) {
    try {
      response = await openai.chat.completions.create({
        model,
        messages,
        temperature: 0.7,
        max_tokens: 600, // reduced to conserve tokens/cost
      });
      usedModel = model;
      break;
    } catch (e: any) {
      const msg = e.toString();
      // On quota/429, break and fallback to stub
      if (e.status === 429 || msg.toLowerCase().includes('quota')) {
        fallbackDueToQuota = true;
        break;
      }
      // If model not available, try next
      if (
        msg.toLowerCase().includes('does not exist') ||
        msg.toLowerCase().includes('you do not have access')
      ) {
        continue;
      }
      // other error: bail
      lastError: any = e;
      break;
    }
  }

  if (fallbackDueToQuota) {
    suggestions = await runGiftEngine(message);
    return NextResponse.json({
      assistant: { content: 'Quota exceeded; returning fallback suggestions.' },
      suggestions,
      usedModel: 'fallback-stub',
      note: 'OpenAI quota limit hit, using static engine.',
    });
  }

  if (!response) {
    return NextResponse.json(
      { error: 'No model succeeded or unexpected error', usedModel },
      { status: 500 }
    );
  }

  const assistantMessage = response.choices?.[0]?.message;
  rawContent = assistantMessage?.content || '';

  // Parse structured suggestions
  suggestions = safeParseSuggestions(rawContent);

  // If demo and fallback only, supplement with stubbed engine
  if (mode === 'demo' && suggestions.length === 1 && suggestions[0].giftId === 'fallback-1') {
    const supplemental = await runGiftEngine(message);
    suggestions = supplemental;
  }

  return NextResponse.json({
    assistant: { content: rawContent },
    suggestions,
    usedModel,
  });
}

export {}; // ensure module context
