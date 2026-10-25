import { isCue, isSlug, stripMd } from './importDocument';

export type LineType = 'blank' | 'slug' | 'cue' | 'paren' | 'dialogue' | 'action';

/** Classe chaque ligne du scénario (partagé par la vue de lecture et l'export .docx). */
export function classifyScreenplay(text: string): { type: LineType; text: string }[] {
  let inDialogue = false;
  return text.split('\n').map((raw) => {
    const l = stripMd(raw);
    if (!l) { inDialogue = false; return { type: 'blank', text: '' }; }
    if (isSlug(l)) { inDialogue = false; return { type: 'slug', text: l.replace(/^\./, '') }; }
    if (!inDialogue && isCue(l)) { inDialogue = true; return { type: 'cue', text: l }; }
    if (inDialogue) return { type: /^\(.*\)$/.test(l) ? 'paren' : 'dialogue', text: l };
    return { type: 'action', text: l };
  });
}

const TIMES = 'JOUR|NUIT|SOIR|MATIN|AUBE|CR[ÉE]PUSCULE|APR[ÈE]S-MIDI|MIDI|CONTINU|PLUS TARD|LE LENDEMAIN';
const PREFIX_RE = /^(INT|EXT|I\/E)(?:\s*\.?\s*\/\s*(INT|EXT))?(?=[\s.\-–—:/]|$)\s*[.\-–—:]?\s*/;

/** « Int-jour cour » / « bureau jour » → « INT. COUR - JOUR » / « INT. BUREAU - JOUR ». */
export function normalizeSlug(line: string): string {
  let s = line.toUpperCase().trim();
  const m = PREFIX_RE.exec(s);
  const prefix = m ? `${m[1]}.${m[2] ? `/${m[2]}.` : ''}` : 'INT.';
  if (m) s = s.slice(m[0].length);
  const parts = s.split(/\s*[–—]\s*|\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  let time = '';
  if (parts.length > 1 && new RegExp(`^(${TIMES})$`).test(parts[parts.length - 1])) time = parts.pop()!;
  s = parts.join(' – ');
  if (!time) {
    const head = new RegExp(String.raw`^(${TIMES})(?:\s+(.*))?$`).exec(s);
    const tail = new RegExp(String.raw`^(.*?)\s+(${TIMES})$`).exec(s);
    if (head) { time = head[1]; s = head[2] ?? ''; } else if (tail) { s = tail[1]; time = tail[2]; }
  }
  return [prefix, s, time && '-', time].filter(Boolean).join(' ');
}
