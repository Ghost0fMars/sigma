import { isCue, isSlug, stripMd } from '../lib/importDocument';

// Mise en page lecture : séquences en gras, répliques (nom, didascalie, texte) centrées.
export function ScreenplayView({ text }: { text: string }) {
  let inDialogue = false;
  return (
    <div>
      {text.split('\n').map((raw, i) => {
        const l = stripMd(raw);
        if (!l) { inDialogue = false; return <div key={i} className="h-4" />; }
        if (isSlug(l)) { inDialogue = false; return <p key={i} className="mt-6 mb-2 font-bold uppercase">{l.replace(/^\./, '')}</p>; }
        if (!inDialogue && isCue(l)) { inDialogue = true; return <p key={i} className="mt-4 text-center font-bold uppercase">{l}</p>; }
        if (inDialogue) {
          const paren = /^\(.*\)$/.test(l);
          return <p key={i} className={`mx-auto max-w-[28rem] text-center ${paren ? 'italic' : ''}`}>{l}</p>;
        }
        return <p key={i}>{l}</p>;
      })}
    </div>
  );
}

export type LineKind = 'slug' | 'cue' | 'paren' | 'dialogue' | 'action';

const KINDS: { kind: LineKind; label: string; hint: string }[] = [
  { kind: 'slug', label: 'Séquence', hint: 'Titre de séquence (INT./EXT.)' },
  { kind: 'action', label: 'Description', hint: 'Description / action' },
  { kind: 'cue', label: 'Personnage', hint: 'Nom du personnage' },
  { kind: 'paren', label: 'Didascalie', hint: 'Didascalie entre parenthèses' },
  { kind: 'dialogue', label: 'Dialogue', hint: 'Réplique (rattachée au personnage)' },
];

/** Applique un type de ligne aux lignes touchées par la sélection ; renvoie le texte et le curseur final. */
export function tagLines(text: string, start: number, end: number, kind: LineKind) {
  const lines = text.split('\n');
  const first = text.slice(0, start).split('\n').length - 1;
  const last = text.slice(0, end).split('\n').length - 1;
  const out: string[] = [];
  let caretLine = 0;
  lines.forEach((raw, i) => {
    if (i < first || i > last || !raw.trim()) { out.push(raw); return; }
    let l = stripMd(raw).replace(/^\./, '').trim();
    if (kind !== 'paren') l = l.replace(/^\((.*)\)$/, '$1');
    if (kind === 'slug') { l = l.toUpperCase(); if (!isSlug(l)) l = `INT. ${l}`; }
    else if (kind === 'cue') l = l.toUpperCase().replace(/[.!?…:;]+$/, '');
    else if (kind === 'paren') l = `(${l.replace(/^\((.*)\)$/, '$1')})`;
    // Séquence, personnage et description ouvrent un bloc ; la réplique se colle au bloc précédent.
    if (kind === 'dialogue') { while (out.length && !out[out.length - 1].trim()) out.pop(); }
    else if (kind !== 'paren' && out.length && out[out.length - 1].trim()) out.push('');
    out.push(l);
    caretLine = out.length - 1;
  });
  const caret = out.slice(0, caretLine + 1).join('\n').length;
  return { text: out.join('\n'), caret };
}

export function ScreenplayToolbar({ onTag }: { onTag: (kind: LineKind) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {KINDS.map(({ kind, label, hint }) => (
        <button key={kind} type="button" title={hint}
          onMouseDown={(e) => e.preventDefault()} onClick={() => onTag(kind)}
          className="rounded border border-black/40 px-2 py-1 text-[11px] uppercase tracking-widest hover:bg-black hover:text-white">
          {label}
        </button>
      ))}
    </div>
  );
}
