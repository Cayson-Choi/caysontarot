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
    ? '\n한국어 반말(~해, ~야, ~거야, ~있어, ~해봐)로 친근하게 작성하세요. 존댓말은 사용하지 마세요. 친한 친구에게 타로 결과를 알려주듯 편하게 말하세요.'
    : '';

  const reversedRule = hasReversed ? ' Cards marked [Reversed] should be interpreted with their reversed meaning.' : '';

  let systemPrompt;
  if (isYesNo) {
    systemPrompt = `You are a tarot reader. Respond in ${outputLang}.
Write in plain text only. No markdown, no headers, no bold, no bullet points.
First give a clear Yes or No answer, then explain why in a natural flowing paragraph. End with brief practical advice.
Write 3-4 sentences.${reversedRule}${toneRule}`;
  } else if (isChoice) {
    systemPrompt = `You are a tarot reader. Respond in ${outputLang}.
Write in plain text only. No markdown, no headers, no bold, no bullet points.
Write a natural flowing paragraph that compares both choices through the cards. Weave the card meanings naturally into the text without listing card names separately. Clearly indicate which choice the cards favor and why. End with specific, practical advice.
Write 5-7 sentences.${reversedRule}${toneRule}`;
  } else {
    systemPrompt = `You are a tarot reader. Respond in ${outputLang}.
Write in plain text only. No markdown, no headers, no bold, no bullet points.
Write a natural flowing paragraph that directly addresses the question. Weave all card meanings naturally into the text without listing each card separately. Connect the cards' energies together into one cohesive interpretation. End with specific, practical advice.
Write 5-7 sentences.${reversedRule}${toneRule}`;
  }

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
