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
