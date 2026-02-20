import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Dev-only API plugin that mimics the Vercel serverless function
function devApiPlugin() {
  return {
    name: 'dev-api',
    configureServer(server) {
      server.middlewares.use('/api/interpret', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end(JSON.stringify({ error: 'Method not allowed' }));
          return;
        }

        // Parse body
        let body = '';
        for await (const chunk of req) body += chunk;
        const { cards, spread, question, lang } = JSON.parse(body);

        if (!cards || !Array.isArray(cards) || cards.length === 0) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Cards are required' }));
          return;
        }

        const apiKey = process.env.OPENROUTER_API_KEY;
        const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat';

        if (!apiKey) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: 'API key not configured' }));
          return;
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
            res.statusCode = 502;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'AI service error' }));
            return;
          }

          const data = await response.json();
          let text = data.choices?.[0]?.message?.content || '';

          // Remove DeepSeek R1 <think> tags
          text = text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ reading: text }));
        } catch (err) {
          console.error('Interpret error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal server error' }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // Make .env vars available to server middleware via process.env
  Object.assign(process.env, env);

  return {
    plugins: [
      react(),
      tailwindcss(),
      devApiPlugin(),
    ],
  };
});
