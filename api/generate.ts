
import { DRAMATURGICAL_REFERENCES } from './_dramaturgical-system.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';

function extractOutputText(response: any): string {
  if (typeof response.output_text === 'string') {
    return response.output_text;
  }

  const chunks: string[] = [];
  for (const item of response.output ?? []) {
    for (const content of item.content ?? []) {
      if (typeof content.text === 'string') {
        chunks.push(content.text);
      }
    }
  }

  return chunks.join('\n').trim();
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
  }

  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const enrichedPrompt = `${DRAMATURGICAL_REFERENCES}\n\n${prompt}`;

  const openaiResponse = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5',
      input: enrichedPrompt,
    }),
  });

  const data = await openaiResponse.json();
  if (!openaiResponse.ok) {
    return res.status(openaiResponse.status).json({
      error: data.error?.message || 'OpenAI request failed',
    });
  }

  return res.status(200).json({ text: extractOutputText(data) });
}
