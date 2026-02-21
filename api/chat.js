export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cards, spread, question, reading, messages, lang } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Messages are required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-v3.2';

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const isKo = lang === 'ko';

  const cardList = (cards || [])
    .map((c, i) => {
      const name = `${c.nameEn} (${c.nameKo})`;
      const orientation = c.reversed ? ' [Reversed]' : '';
      const pos = c.position || `Card ${i + 1}`;
      return `- Position [${pos}]: ${name}${orientation}`;
    })
    .join('\n');

  let systemPrompt;

  if (isKo) {
    systemPrompt = `You are a tarot reader having a follow-up conversation. You MUST respond in Korean only.
Write in plain text only. No markdown, no headers, no bold, no bullet points.
한국어 반말(~해, ~야, ~거야, ~있어, ~해봐)로 친근하게 작성하고 존댓말은 사용하지 마라.

이전 타로 리딩 맥락:
사용자 질문: ${question || '일반 리딩'}
스프레드: ${spread || 'Free Layout'}
${cardList}

이전 해석:
${reading || '(없음)'}

위 카드와 해석을 맥락으로 유지하면서 사용자의 후속 질문에 답하라. 200자 이내로 간결하게 답하라.`;
  } else {
    systemPrompt = `You are a tarot reader having a follow-up conversation. You MUST respond in English only.
Write in plain text only. No markdown, no headers, no bold, no bullet points.
Use a warm, friendly, casual tone as if talking to a close friend.

Previous tarot reading context:
User question: ${question || 'General reading'}
Spread: ${spread || 'Free Layout'}
${cardList}

Previous interpretation:
${reading || '(none)'}

Keep the above cards and interpretation as context while answering the user's follow-up questions. Keep responses concise, under 200 words.`;
  }

  // Build conversation: system + message history
  const chatMessages = [
    { role: 'system', content: systemPrompt },
    ...messages.map((m) => ({ role: m.role, content: m.content })),
  ];

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: chatMessages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('OpenRouter error:', errText);
      return res.status(502).json({ error: 'AI service error' });
    }

    const data = await response.json();
    let text = data.choices?.[0]?.message?.content || '';

    // Remove DeepSeek R1 <think> tags
    text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

    // Remove markdown symbols
    text = text.replace(/#{1,6}\s?/g, '');
    text = text.replace(/\*{1,2}([^*]+)\*{1,2}/g, '$1');
    text = text.replace(/^[-•]\s+/gm, '');
    text = text.trim();

    return res.status(200).json({ reply: text });
  } catch (err) {
    console.error('Chat error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
