
import { DRAMATURGICAL_REFERENCES } from './_dramaturgical-system.js';
import { chatCompletion, getAlbertApiKey, sendAlbertError } from './_albert.js';

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    getAlbertApiKey();
  } catch (err) {
    return sendAlbertError(res, err);
  }

  const { prompt } = req.body ?? {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing prompt' });
  }

  const enrichedPrompt = `${DRAMATURGICAL_REFERENCES}\n\n${prompt}`;

  try {
    const text = await chatCompletion([{ role: 'user', content: enrichedPrompt }]);
    return res.status(200).json({ text });
  } catch (err) {
    return sendAlbertError(res, err);
  }
}
