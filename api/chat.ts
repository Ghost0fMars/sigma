
import { DRAMATURGICAL_REFERENCES } from './_dramaturgical-system.js';

const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses';
const OPENAI_EMBED_URL  = 'https://api.openai.com/v1/embeddings';
const EMBED_MODEL       = 'text-embedding-3-small';

const SYSTEM_PROMPT = `Tu es un script-doctor expert en dramaturgie cinématographique et consultant créatif. Tu travailles directement avec l'auteur sur son projet en cours.

Ton rôle :
- Analyser les forces et faiblesses dramaturgiques du projet
- Identifier les problèmes de structure, de rythme, de cohérence des personnages
- Proposer des pistes de réécriture concrètes et actionnables
- Expliquer les principes narratifs en te référant explicitement aux théories ci-dessous
- Utiliser les notions de l'intégrale dramatique : V(t) valeur de l'acte, C(t) pression contextuelle, S(t) charge dramatique accumulée
- Quand tu identifies un problème, cite le cadre théorique pertinent (ex: "selon McKee, cette scène manque de bascule de valeur dramatique...")

Style : direct, bienveillant, professionnel. Sois précis et concret. Évite les généralités. Réponds toujours en français.

Si l'auteur parle d'une scène spécifique, réfère-toi à son titre et son numéro. Si tu pointes un problème, propose toujours au moins une piste de résolution.

${DRAMATURGICAL_REFERENCES}`;

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

// ---------- RAG : récupère les passages du corpus les plus proches de la requête ----------
async function retrieveCorpusChunks(query: string, apiKey: string): Promise<string> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return '';

  try {
    // 1. Embed la requête
    const embedRes = await fetch(OPENAI_EMBED_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: EMBED_MODEL, input: query }),
    });
    if (!embedRes.ok) return '';
    const embedData = await embedRes.json() as { data: { embedding: number[] }[] };
    const embedding = embedData.data[0].embedding;

    // 2. Recherche vectorielle dans Supabase
    const searchRes = await fetch(`${supabaseUrl}/rest/v1/rpc/search_narratology`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query_embedding: embedding, match_count: 5, min_similarity: 0.5 }),
    });
    if (!searchRes.ok) return '';
    const chunks = await searchRes.json() as { author: string; title: string; content: string }[];
    if (!Array.isArray(chunks) || chunks.length === 0) return '';

    // 3. Formate les passages récupérés
    const formatted = chunks
      .map(c => `[${c.author} — ${c.title}]\n${c.content}`)
      .join('\n\n---\n\n');

    return `\n\n===== CORPUS NARRATOLOGIQUE (passages pertinents) =====\n\n${formatted}\n\n=====`;
  } catch {
    return '';
  }
}

function buildProjectContext(project: any): string {
  if (!project || typeof project !== 'object') return 'Aucun projet chargé.';

  const sceneList = Array.isArray(project.scenes) && project.scenes.length > 0
    ? project.scenes
        .map((s: any, i: number) =>
          `Scène ${i + 1} — ${s.title || 'Sans titre'}
  Type: ${s.type || 'Autre'} | V(t): ${s.vt ?? 0} | C(t): ${s.ct ?? 0.5}
  Indications: ${s.indications || 'Non renseignées'}
  Description: ${s.description || 'Vide'}
  Information dramatique: ${s.dramaticInfo || 'Vide'}`,
        )
        .join('\n\n')
    : 'Aucune scène définie.';

  const parts = [
    `TITRE : ${project.title || 'Sans titre'}`,
    project.logline ? `LOGLINE : ${project.logline}` : null,
    project.synopsis ? `SYNOPSIS :\n${project.synopsis}` : null,
    project.developedSynopsis ? `SYNOPSIS DÉVELOPPÉ :\n${project.developedSynopsis}` : null,
    `SCÈNE À SCÈNE :\n${sceneList}`,
    project.treatment ? `TRAITEMENT :\n${project.treatment.slice(0, 3000)}${project.treatment.length > 3000 ? '\n[…tronqué]' : ''}` : null,
    project.screenplay ? `SCÉNARIO (extrait) :\n${project.screenplay.slice(0, 2000)}${project.screenplay.length > 2000 ? '\n[…tronqué]' : ''}` : null,
    project.notes ? `NOTES DE L'AUTEUR :\n${project.notes}` : null,
  ].filter(Boolean);

  return parts.join('\n\n---\n\n');
}

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
  }

  const { messages, project } = req.body ?? {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'Missing messages' });
  }

  const projectContext = buildProjectContext(project);

  const sanitizedMessages = messages
    .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m: any) => ({ role: m.role, content: m.content }));

  const lastUserMessage = [...sanitizedMessages].reverse().find((m: any) => m.role === 'user')?.content ?? '';
  const corpusContext = lastUserMessage ? await retrieveCorpusChunks(lastUserMessage, apiKey) : '';

  const instructions = `${SYSTEM_PROMPT}\n\n===== PROJET EN COURS =====\n\n${projectContext}${corpusContext}`;

  let openaiResponse: Response;
  let data: any;
  try {
    openaiResponse = await fetch(OPENAI_RESPONSES_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-5',
        instructions,
        input: sanitizedMessages,
        max_output_tokens: 1200,
      }),
    });
    data = await openaiResponse.json();
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to reach OpenAI' });
  }

  if (!openaiResponse.ok) {
    return res.status(openaiResponse.status).json({
      error: data.error?.message || 'OpenAI request failed',
    });
  }

  const reply = extractOutputText(data);
  return res.status(200).json({ reply });
}
