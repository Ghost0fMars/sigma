/**
 * Import déterministe d'un document .md / .txt / .fountain.
 * Aucun appel IA : le scénario et TOUTES les scènes sont repris tels quels.
 * Deux formats reconnus :
 *   - l'export Markdown de SIGMA (asMarkdown) : projet restauré à l'identique ;
 *   - un scénario (INT./EXT., Fountain, Markdown, intitulés « INT – LIEU – JOUR »).
 */
import { Project, Scene, SceneType } from '../types';
import { DEFAULT_PROJECT, createScene } from './dramaturgical';

export type ParsedImport = { kind: 'sigma' | 'screenplay'; project: Project };

// ── Utilitaires ─────────────────────────────────────────────────────────────

const PLACEHOLDERS = new Set([
  'À compléter.', 'Aucune scène.', 'Aucune note.',
  'Non renseigné', 'Non renseignée', 'Description à compléter.',
]);
const clean = (s: string) => (PLACEHOLDERS.has(s.trim()) ? '' : s.trim());
const normalize = (s: string) => s.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
// « LYCÉE LÉONELLA » → « Lycée Léonella » ; les petits mots et les élisions restent en minuscules.
const SMALL_WORD = /^(de|du|des|la|le|les|un|une|et|à|au|aux|en|sur|dans|chez|sous|par|pour|d|l)$/;
const titleCase = (s: string) => (s !== s.toUpperCase() ? s
  : s.toLowerCase().replace(/(?<![\p{L}’'-])\p{L}+/gu, (w, off: number) => (off > 0 && SMALL_WORD.test(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))));

// ── Export Markdown de SIGMA ────────────────────────────────────────────────

const SIGMA_HEADINGS: [keyof Project, string][] = [
  ['logline', 'Logline'],
  ['synopsis', 'Synopsis'],
  ['developedSynopsis', 'Synopsis d[ée]velopp[ée]'],
  ['scenes', 'Sc[èe]ne [àa] sc[èe]ne'],
  ['treatment', 'Traitement'],
  ['screenplay', 'Sc[ée]nario'],
  ['notes', 'Notes'],
];

function parseSigmaScenes(block: string): Scene[] {
  return block.split(/^### /m).slice(1).map((part, i) => {
    const [head, ...rest] = part.split('\n');
    const body = rest.join('\n');
    const field = (label: string) => new RegExp(`^- ${label}\\s*:[ \\t]*(.*)$`, 'mi').exec(body)?.[1]?.trim() ?? '';
    const num = (label: string) => { const n = parseFloat(field(label).replace(',', '.')); return Number.isFinite(n) ? n : undefined; };
    const type = field('Type');
    const description = body.split('\n')
      .filter((l) => !/^- (Indications|Type|Information dramatique|Valeur V\(t\)|Pression C\(t\)|Durée)\s*:/i.test(l))
      .join('\n').trim();
    return createScene(i, {
      title: head.replace(/^\d+\.\s*/, '').trim() || `Scène ${i + 1}`,
      indications: clean(field('Indications')) || 'INT. LIEU - JOUR',
      dramaticInfo: clean(field('Information dramatique')),
      description: clean(description),
      type: Object.values(SceneType).includes(type as SceneType) ? (type as SceneType) : SceneType.OTHER,
      vt: Math.max(-2, Math.min(2, num('Valeur V\\(t\\)') ?? 0)),
      ct: Math.max(0, Math.min(1, num('Pression C\\(t\\)') ?? 0.5)),
      duration: num('Durée'),
    });
  });
}

function parseSigmaMarkdown(text: string): Project | null {
  const title = /^# (.+)$/m.exec(text)?.[1]?.trim();
  if (!title) return null;
  const found: { key: keyof Project; start: number; bodyStart: number }[] = [];
  let from = 0;
  for (const [key, heading] of SIGMA_HEADINGS) {
    const m = new RegExp(`^## ${heading}[ \\t]*\\n`, 'm').exec(text.slice(from));
    if (!m) continue;
    found.push({ key, start: from + m.index, bodyStart: from + m.index + m[0].length });
    from = from + m.index + m[0].length;
  }
  // Un export SIGMA contient au minimum le scène à scène et un autre bloc.
  if (!found.some((f) => f.key === 'scenes') || found.length < 3) return null;

  const project: Project = { ...DEFAULT_PROJECT, title, scenes: [] };
  found.forEach((f, i) => {
    const body = text.slice(f.bodyStart, found[i + 1]?.start ?? text.length).trim();
    if (f.key === 'scenes') project.scenes = parseSigmaScenes(body);
    else Object.assign(project, { [f.key]: clean(body) });
  });
  return project;
}

// ── Scénario (INT./EXT., Fountain, Markdown) ────────────────────────────────

// INT / EXT / INT./EXT. / EXT/INT / I/E suivis d'un séparateur (point, tiret, tiret cadratin…).
const SLUG_RE = /^(?:INT|EXT|I\/E)(?:\s*[./]\s*(?:INT|EXT))?\s*\.?\s*(?:[–—:-]|\s)\s*\S/i;
const FORCED_SLUG_RE = /^\.(?!\.)\S/;
const TRANSITION_RE = /^(FIN|ELLIPSE|NOIR|FONDU.*|COUPE.*|CUT TO:?|FADE (IN|OUT).*|G[ÉE]N[ÉE]RIQUE.*|SUPER.*|FLASH-?BACK.*|RETOUR.*)$/i;
const TIME_RE = /^(JOUR|NUIT|SOIR|MATIN|AUBE|CR[ÉE]PUSCULE|APR[ÈE]S-MIDI|MIDI|CONTINU|PLUS TARD|LE LENDEMAIN|DAY|NIGHT|EVENING|MORNING|DAWN|DUSK|LATER|CONTINUOUS)\b/i;

/** Retire la décoration Markdown (titres, gras, échappements, numérotation). */
function stripMd(line: string): string {
  return line
    .replace(/^\s{0,3}#{1,6}\s+/, '')
    .replace(/^\s*>\s?/, '')
    .replace(/\\([.\-–—*_#[\]()!>])/g, '$1')
    .replace(/^(\*{1,3}|_{1,3})(.*?)\1\s*$/, '$2')
    .replace(/^\d+[A-Z]?\s*[.)]\s+(?=(?:INT|EXT|I\/E))/i, '')
    .trim();
}

const isSlug = (l: string) => l.length > 0 && l.length <= 160 && (SLUG_RE.test(l) || FORCED_SLUG_RE.test(l));

const isCue = (l: string) =>
  l.length >= 2 && l.length <= 45 && /[A-ZÀ-ÖØ-Þ]{2}/.test(l)
  && l === l.toUpperCase() && !/[.!?…:;]$/.test(l) && !TRANSITION_RE.test(l) && !isSlug(l);

function placeOf(slug: string): string {
  const body = slug.replace(/^\./, '')
    .replace(/^(?:INT|EXT|I\/E)(?:\s*[./]\s*(?:INT|EXT))?\s*\.?\s*[–—:-]?\s*/i, '');
  const parts = body.split(/\s*[–—]\s*|\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  if (parts.length > 1 && TIME_RE.test(parts[parts.length - 1])) parts.pop();
  return titleCase(parts.join(' – ') || body);
}

/** Résumé d'une scène : les premières phrases d'action (hors répliques). */
function summarize(lines: string[]): string {
  const action: string[] = [];
  const dialogue: string[] = [];
  let inDialogue = false;
  for (const raw of lines) {
    const l = stripMd(raw);
    if (!l) { inDialogue = false; continue; }
    if (!inDialogue && isCue(l)) { inDialogue = true; continue; }
    if (inDialogue) { if (!/^\(.*\)$/.test(l)) dialogue.push(l); continue; }
    action.push(l);
  }
  const text = (action.length ? action : dialogue.slice(0, 2)).join(' ');
  let out = '';
  for (const sentence of text.split(/(?<=[.!?…])\s+/)) {
    if (out && (out + ' ' + sentence).length > 380) break;
    out = out ? `${out} ${sentence}` : sentence;
  }
  return out.slice(0, 480);
}

function parseScreenplay(text: string): Project | null {
  const lines = text.split('\n');
  const preamble: string[] = [];
  const raws: { slug: string; lines: string[] }[] = [];
  for (const line of lines) {
    const c = stripMd(line);
    if (isSlug(c)) raws.push({ slug: c.replace(/^\./, ''), lines: [] });
    else (raws.length ? raws[raws.length - 1].lines : preamble).push(line);
  }
  if (raws.length === 0) return null;

  const rawTitle =
    preamble.map((l) => /^title\s*:\s*(.+)$/i.exec(l.trim())?.[1]).find(Boolean)
    ?? preamble.map((l) => /^#\s+(.+)$/.exec(l)?.[1]).find(Boolean)
    ?? preamble.map(stripMd).find((l) => l.length > 0 && l.length <= 80);

  return {
    ...DEFAULT_PROJECT,
    title: rawTitle ? titleCase(stripMd(rawTitle)) : 'Projet importé',
    screenplay: text.trim(),
    scenes: raws.map((r, i) => createScene(i, {
      title: placeOf(r.slug),
      indications: r.slug,
      description: summarize(r.lines),
    })),
  };
}

// ── Point d'entrée ──────────────────────────────────────────────────────────

/**
 * Renvoie le projet restauré, ou null si le texte n'est ni un export SIGMA ni un
 * scénario (l'appelant retombe alors sur la reconstruction par l'IA).
 * Un scénario n'est repris tel quel que si le type choisi est « scénario »
 * ou si au moins 3 intitulés de scène sont détectés.
 */
export function parseImportedDocument(content: string, documentType: string): ParsedImport | null {
  const text = normalize(content);
  const sigma = parseSigmaMarkdown(text);
  if (sigma) return { kind: 'sigma', project: sigma };
  const screenplay = parseScreenplay(text);
  if (screenplay && (documentType === 'scenario' || screenplay.scenes.length >= 3)) {
    return { kind: 'screenplay', project: screenplay };
  }
  return null;
}

// ── Enrichissement IA (facultatif, après l'import) ──────────────────────────

/** Plan compact envoyé à l'IA : numéro, intitulé de scène, résumé. */
export function scenePlanDigest(scenes: Scene[]): string {
  return scenes.map((s, i) => `${i + 1}. ${s.indications} — ${s.description.slice(0, 220)}`).join('\n');
}

const isUntouched = (s: Scene) => s.type === SceneType.OTHER && s.vt === 0 && !s.dramaticInfo;

/** Complète les champs encore vides : n'écrase jamais ce que l'auteur a déjà saisi. */
export function mergeEnrichment(project: Project, raw: any): Project {
  const str = (v: unknown, fallback: string) => (fallback.trim() ? fallback : typeof v === 'string' ? v.trim() : fallback);
  const byIndex = new Map<number, any>(
    (Array.isArray(raw?.scenes) ? raw.scenes : [])
      .filter((s: any) => Number.isInteger(s?.index))
      .map((s: any) => [s.index, s]),
  );
  return {
    ...project,
    logline: str(raw?.logline, project.logline),
    synopsis: str(raw?.synopsis, project.synopsis),
    developedSynopsis: str(raw?.developedSynopsis, project.developedSynopsis),
    treatment: str(raw?.treatment, project.treatment),
    notes: str(raw?.notes, project.notes),
    scenes: project.scenes.map((s, i) => {
      const a = byIndex.get(i + 1);
      if (!a || !isUntouched(s)) return s;
      return {
        ...s,
        type: Object.values(SceneType).includes(a.type) ? a.type : s.type,
        vt: typeof a.vt === 'number' ? Math.max(-2, Math.min(2, a.vt)) : s.vt,
        ct: typeof a.ct === 'number' ? Math.max(0, Math.min(1, a.ct)) : s.ct,
        dramaticInfo: typeof a.dramaticInfo === 'string' ? a.dramaticInfo.trim() : s.dramaticInfo,
      };
    }),
  };
}
