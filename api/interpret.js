export const maxDuration = 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { cards, spread, question, lang } = req.body;

  if (!cards || !Array.isArray(cards) || cards.length === 0) {
    return res.status(400).json({ error: 'Cards are required' });
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  const isKo = lang === 'ko';
  const outputLang = isKo ? 'Korean' : 'English';

  const cardList = cards
    .map((c, i) => {
      const name = `${c.nameEn} (${c.nameKo})`;
      const pos = c.position || `Card ${i + 1}`;
      return `- Position [${pos}]: ${name}`;
    })
    .join('\n');

  const systemPrompt = `You are a Rider-Waite tarot master. Respond in ${outputLang} using markdown.

Structure:
1. **Each card**: meaning by position (2-3 sentences each)
2. **Card interactions**: how they connect and overall energy flow
3. **Advice**: specific, actionable guidance (no vague platitudes)

Rules: Use **bold** for card names. Use ## headers. Be concise and specific.`;

  const userMessage = `${spread || 'Free Layout'} | ${question || 'General reading'}
${cardList}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1500,
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

    return res.status(200).json({ reading: text });
  } catch (err) {
    console.error('Interpret error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
