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

  const isYesNo = spread && (spread === '예스/노' || spread === 'Yes / No');
  const isChoice = spread && (spread === '양자택일' || spread === 'Either/Or');

  const hasReversed = cards.some((c) => c.reversed);

  const cardList = cards
    .map((c, i) => {
      const name = `${c.nameEn} (${c.nameKo})`;
      const orientation = c.reversed ? ' [Reversed]' : '';
      const pos = c.position || `Card ${i + 1}`;
      return `- Position [${pos}]: ${name}${orientation}`;
    })
    .join('\n');

  const toneRule = isKo
    ? '\nTone: 반드시 존댓말(~합니다, ~입니다, ~하세요)로만 작성하세요. 반말(~해, ~야, ~거야)은 절대 사용하지 마세요. 처음부터 끝까지 일관된 존댓말을 유지하세요.'
    : '';

  let structureGuide;
  if (isYesNo) {
    structureGuide = `Structure:
1. **Yes or No**: Give a clear Yes/No answer first based on the card's energy
2. **Card meaning**: Explain why this card points to that answer (2-3 sentences)
3. **Advice**: specific, actionable guidance`;
  } else if (isChoice) {
    structureGuide = `Structure:
1. **Choice A**: Interpret the first card representing Choice A (2-3 sentences)
2. **Choice B**: Interpret the second card representing Choice B (2-3 sentences)
3. **Comparison**: Compare both paths and which choice the cards favor
4. **Advice**: specific, actionable guidance on making this decision`;
  } else {
    structureGuide = `Structure:
1. **Each card**: meaning by position (2-3 sentences each)
2. **Card interactions**: how they connect and overall energy flow
3. **Advice**: specific, actionable guidance (no vague platitudes)`;
  }

  const systemPrompt = `You are a Rider-Waite tarot master. Respond in ${outputLang} using markdown.

${structureGuide}

Rules: Use **bold** for card names. Use ## headers. Be concise and specific.${hasReversed ? ' Cards marked [Reversed] should be interpreted with their reversed meaning.' : ''}${toneRule}`;

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
