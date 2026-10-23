
import { DRAMATURGICAL_REFERENCES } from './_dramaturgical-system.js';
import { loadCorpus, searchCorpus } from './_corpus.js';
import { chatCompletion, embed, getAlbertApiKey, sendAlbertError } from './_albert.js';

const DEFAULT_MAX_OUTPUT_TOKENS = 8000;

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

function getMaxOutputTokens(): number {
  const configured = Number(process.env.ALBERT_MAX_OUTPUT_TOKENS);
  return Number.isFinite(configured) && configured > 0
    ? configured
    : DEFAULT_MAX_OUTPUT_TOKENS;
}

// ---------- RAG : récupère les passages du corpus les plus proches de la requête ----------
async function retrieveCorpusChunks(query: string): Promise<string> {
  if (!loadCorpus()) return '';

  try {
    // 1. Embed la requête
    const [embedding] = await embed([query]);

    // 2. Recherche vectorielle dans le corpus local
    const chunks = searchCorpus(embedding, 5, 0.5);
    if (chunks.length === 0) return '';

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

  try {
    getAlbertApiKey();
  } catch (err) {
    return sendAlbertError(res, err);
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
  const corpusContext = lastUserMessage ? await retrieveCorpusChunks(lastUserMessage) : '';

  const instructions = `${SYSTEM_PROMPT}\n\n===== PROJET EN COURS =====\n\n${projectContext}${corpusContext}`;

  try {
    const reply = await chatCompletion(
      [{ role: 'system', content: instructions }, ...sanitizedMessages],
      { maxTokens: getMaxOutputTokens() },
    );
    return res.status(200).json({ reply });
  } catch (err) {
    return sendAlbertError(res, err);
  }
}
