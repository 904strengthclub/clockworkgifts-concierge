cat <<'EOF' > app/api/conversational/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function POST(req: NextRequest) {
  const { mode, message, conversationHistory = [] } = await req.json();

  const systemPrompt =
    mode === 'demo'
      ? 'You are the Clockwork Gifts Concierge in demo mode. Provide 3-5 gift suggestions based on free-text input. Do not persist anything.'
      : 'You are the Clockwork Gifts Concierge with full context. Refine profile, ask clarifying questions, and suggest gifts.';

  const messages: any[] = [
    { role: 'system', content: systemPrompt },
    ...conversationHistory,
    { role: 'user', content: message },
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages,
    temperature: 0.7,
    max_tokens: 600,
  });

  return NextResponse.json({ assistant: response.choices[0].message });
}
EOF
