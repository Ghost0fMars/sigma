import type { ReactNode } from 'react';
import { stripMd } from '../lib/importDocument';
import { classifyScreenplay, normalizeSlug } from '../lib/screenplayLines';

// Mise en page lecture : séquences en gras, répliques (nom, didascalie, texte) centrées.
export function ScreenplayView({ text }: { text: string }) {
  return (
    <div>
      {classifyScreenplay(text).map(({ type, text: l }, i) => {
        switch (type) {
          case 'blank': return <div key={i} className="h-4" />;
          case 'slug': return <p key={i} className="mt-6 mb-2 font-bold uppercase">{l}</p>;
          case 'cue': return <p key={i} className="mt-4 text-center font-bold uppercase">{l}</p>;
          case 'paren': return <p key={i} className="mx-auto max-w-[28rem] text-center italic">{l}</p>;
          case 'dialogue': return <p key={i} className="mx-auto max-w-[28rem] text-center">{l}</p>;
          default: return <p key={i}>{l}</p>;
        }
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
    if (kind === 'slug') l = normalizeSlug(l);
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

const PANEL_BTN = 'w-full rounded border border-black/40 px-2 py-1.5 text-left text-[11px] uppercase tracking-widest hover:bg-black hover:text-white disabled:pointer-events-none disabled:opacity-40';

function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#393E46]">{title}</h3>
      {children}
    </section>
  );
}

/** Panneau latéral : style de ligne, affichage, import des scènes, export. */
export function ScreenplayPanel({ editing, hasText, hasScenes, onTag, onToggleEdit, onImportScenes, onExport }: {
  editing: boolean; hasText: boolean; hasScenes: boolean;
  onTag: (kind: LineKind) => void; onToggleEdit: () => void; onImportScenes: () => void; onExport: () => void;
}) {
  return (
    <aside className="w-full shrink-0 space-y-5 rounded-lg border border-[#393E46] bg-white p-4 text-black lg:sticky lg:top-4 lg:w-56 lg:self-start">
      <PanelSection title="Style de la ligne">
        {KINDS.map(({ kind, label, hint }) => (
          <button key={kind} type="button" title={editing ? hint : 'Passez en édition pour typer une ligne'} disabled={!editing}
            onMouseDown={(e) => e.preventDefault()} onClick={() => onTag(kind)} className={PANEL_BTN}>{label}</button>
        ))}
      </PanelSection>
      <PanelSection title="Affichage">
        <button type="button" onClick={onToggleEdit} className={PANEL_BTN}>{editing ? 'Mise en page' : 'Éditer le texte'}</button>
      </PanelSection>
      <PanelSection title="Scènes">
        <button type="button" onClick={onImportScenes} disabled={!hasScenes} className={PANEL_BTN}
          title="Ajoute le titre et la description de chaque scène à la fin du scénario">Importer les scènes</button>
      </PanelSection>
      <PanelSection title="Export">
        <button type="button" onClick={onExport} disabled={!hasText} className={PANEL_BTN}>Exporter .docx</button>
      </PanelSection>
    </aside>
  );
}
