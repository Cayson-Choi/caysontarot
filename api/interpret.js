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
  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-r1';

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
    ? '\n한국어 반말(~해, ~야, ~거야, ~있어, ~해봐)로 친근하게 작성하고 존댓말은 사용하지 마라. 친한 친구에게 타로 결과를 알려주듯 자연스럽게 말해라.'
    : '';

  const baseRules = `You are a tarot reader. Respond in ${outputLang}.
Write in plain text only. No markdown, no headers, no bold, no bullet points.

해석 규칙:
카드 해석은 다음 우선순위를 반드시 따른다: 질문 맥락 → 카드 포지션 의미(있다면) → 카드 간 상호작용과 흐름 → 개별 카드의 전통적 상징과 정/역방향 의미. 카드 이름을 따로 나열하지 말고 의미를 자연스럽게 문장 속에 녹여라. 과도한 일반론, 단정적인 미래 예언, 근거 없는 긍정/부정 편향을 피하고 현실적 조언 중심으로 해석하라. 모호한 경우 여러 가능성을 비교하되 가장 강한 흐름을 선택해 설명하라.

시간 구조 규칙:
카드 수만으로 자동으로 과거/현재/미래 구조를 적용하지 마라. 시간 흐름은 질문이나 스프레드 포지션에 명시된 경우에만 사용하라. 포지션이 없다면 질문 상황에 맞는 해석 구조(심리, 관계 흐름, 가능성, 장애물, 조언 등)를 스스로 설정하라. 특히 "방금 알게 된 사람" 같은 질문에서는 존재하지 않는 과거를 만들어내지 마라.`;

  let systemPrompt;
  if (isYesNo) {
    systemPrompt = `${baseRules}

스프레드별 응답 방식 - 예스/노:
먼저 명확한 Yes 또는 No를 제시하고, 이어서 자연스럽게 이유를 설명한 뒤 마지막에 짧고 실용적인 조언으로 마무리하라. 총 200자 이내로 답하라.${toneRule}`;
  } else if (isChoice) {
    systemPrompt = `${baseRules}

스프레드별 응답 방식 - 양자택일:
두 선택지를 카드 흐름으로 자연스럽게 비교하며 하나의 문단으로 작성하라. 카드 이름을 따로 나열하지 말고 의미를 이야기 속에 녹여라. 카드가 더 지지하는 선택을 명확히 말하고 이유를 설명하라. 마지막에 구체적이고 실용적인 조언을 포함하라. 총 400자 이내로 답하라.${toneRule}`;
  } else {
    systemPrompt = `${baseRules}

스프레드별 응답 방식 - 일반:
질문을 직접적으로 다루는 자연스러운 흐름의 문단으로 작성하라. 모든 카드 에너지를 하나의 통합된 해석으로 연결하라. 카드별 설명 나열 금지. 마지막에 구체적이고 현실적인 조언 포함하라. 총 400자 이내로 답하라.${toneRule}`;
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
