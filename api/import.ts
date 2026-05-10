
import { DRAMATURGICAL_REFERENCES, SCENE_TYPES_LIST } from './_dramaturgical-system';

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

const TYPE_LABELS: Record<string, string> = {
  scenario: 'un scénario (format professionnel)',
  note_intention: "une note d'intention",
  synopsis: 'un synopsis',
  traitement: 'un traitement',
  idee: 'une idée ou note libre',
};

const TYPE_INSTRUCTIONS: Record<string, string> = {
  scenario: `- Extrait chaque scène identifiable du scénario (intitulés INT./EXT. ou changements de lieu/temps) et remplis les champs dramatiques
- Génère le synopsis (2-4 paragraphes) et le synopsis développé (500-800 mots) à partir du scénario
- Génère le traitement (récit au présent) depuis les scènes extraites
- Conserve le scénario original dans le champ screenplay (reproduit fidèlement)`,

  note_intention: `- La note d'intention exprime la vision artistique : utilise-la pour orienter TOUT le projet
- Génère un logline percutant, un synopsis, un synopsis développé, un scène à scène complet et un traitement
- Le champ screenplay peut être vide`,

  synopsis: `- Le synopsis d'entrée va dans le champ synopsis (conserve-le fidèlement)
- Développe le synopsis en synopsis développé plus riche (500-800 mots)
- Génère un scène à scène structuré (8-12 scènes) et un traitement au présent
- Le champ screenplay peut être vide`,

  traitement: `- Extrait les grandes séquences du traitement comme autant de scènes individuelles
- Génère le synopsis (2-4 paragraphes) et le synopsis développé depuis le traitement
- Conserve le traitement original dans le champ treatment (reproduit fidèlement)
- Le champ screenplay peut être vide`,

  idee: `- C'est une idée brute : sois créatif et développe-la entièrement
- Génère un logline, synopsis, synopsis développé, scène à scène complet et traitement complets
- Le champ screenplay peut être vide`,
};

const SCENE_TYPES = SCENE_TYPES_LIST;

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY is not configured' });
  }

  const { documentType, content, title } = req.body ?? {};
  if (!content || typeof content !== 'string') {
    return res.status(400).json({ error: 'Missing content' });
  }

  const typeLabel = TYPE_LABELS[documentType] ?? 'un document';
  const instruction = TYPE_INSTRUCTIONS[documentType] ?? TYPE_INSTRUCTIONS.idee;
  const titleHint = title ? ` (titre suggéré : "${title}")` : '';

  const prompt = `Tu es script-doctor expert en dramaturgie. Un auteur t'envoie ${typeLabel}. Analyse-le et reconstruis un projet Sigma complet.

${DRAMATURGICAL_REFERENCES}

Instructions spécifiques pour ce type de document :
${instruction}

Règles générales :
- Extrais ou invente un titre pertinent${titleHint}
- Identifie d'abord le mythos dominant (Frye) pour calibrer la dynamique S(t)
- Génère entre 8 et 14 scènes structurées selon la courbe dramatique S(t) = ∫ [V(t)·P(t|τ)]·C(t) dt
- V(t) : valeur de l'acte de -2 (effondrement total) à +2 (climax positif)
- C(t) : pression contextuelle de 0 (nulle) à 1 (maximale)
- La courbe S(t) doit progresser de façon cohérente avec des tensions et détentes dramatiques
- Utilise uniquement ces types de scènes : ${SCENE_TYPES}
- Rédige TOUT en français
- Dans le champ "notes", identifie le mythos Frye, la faiblesse/besoin Truby, et l'étape Campbell dominante

Réponds UNIQUEMENT en JSON valide, sans aucun commentaire ni balise markdown :
{
  "title": "string",
  "logline": "string (1 phrase accrocheuse)",
  "synopsis": "string (2-4 paragraphes)",
  "developedSynopsis": "string (500 à 800 mots)",
  "scenes": [
    {
      "title": "string",
      "indications": "string (ex: INT. SALON - NUIT)",
      "description": "string (description littéraire de la scène, 2-4 phrases)",
      "dramaticInfo": "string (information dramatique clé : révélation, décision, retournement...)",
      "type": "string (l'un des types autorisés ci-dessus)",
      "vt": number,
      "ct": number
    }
  ],
  "treatment": "string (traitement cinématographique au présent de l'indicatif)",
  "screenplay": "string (scénario professionnel ou chaîne vide selon le type)",
  "notes": "string (analyse dramaturgique : mythos Frye, faiblesse/besoin Truby, étape Campbell, observations sur S(t))"
}

Document à analyser :
---
${content.slice(0, 14000)}
---`;

  const openaiResponse = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || 'gpt-5',
      input: prompt,
    }),
  });

  const data = await openaiResponse.json();
  if (!openaiResponse.ok) {
    return res.status(openaiResponse.status).json({
      error: data.error?.message || 'OpenAI request failed',
    });
  }

  const rawText = extractOutputText(data);
  const jsonText = rawText
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();

  try {
    const projectData = JSON.parse(jsonText);
    return res.status(200).json({ project: projectData });
  } catch {
    return res.status(500).json({
      error: 'Impossible de parser la réponse IA en projet valide.',
      raw: rawText.slice(0, 500),
    });
  }
}
