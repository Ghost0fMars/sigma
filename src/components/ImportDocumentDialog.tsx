import { useState } from 'react';
import { FileText, RefreshCw, Upload, Wand2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-[#393E46]">{label}</span>
      {children}
    </label>
  );
}

const DOCUMENT_TYPES = [
  { value: 'idee',           label: 'Idée / Note libre',    description: 'Une idée brute, quelques lignes de concept.' },
  { value: 'note_intention', label: "Note d'intention",     description: 'Vision artistique et direction du projet.' },
  { value: 'synopsis',       label: 'Synopsis',             description: "Résumé court de l'histoire (1-4 paragraphes)." },
  { value: 'traitement',     label: 'Traitement',           description: 'Récit au présent décrivant les séquences.' },
  { value: 'scenario',       label: 'Scénario',             description: 'Format professionnel INT./EXT. avec dialogues.' },
] as const;

export function ImportDocumentDialog({
  open, isLoading, onClose, onImport,
}: {
  open: boolean; isLoading: boolean;
  onClose: () => void;
  onImport: (documentType: string, content: string) => Promise<void>;
}) {
  const [documentType, setDocumentType] = useState<string>('idee');
  const [content, setContent] = useState('');
  const selectedType = DOCUMENT_TYPES.find((t) => t.value === documentType);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setContent(typeof ev.target?.result === 'string' ? ev.target.result : '');
    reader.readAsText(file, 'utf-8');
    e.target.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen && !isLoading) onClose(); }}>
      <DialogContent className="max-w-2xl border-[#393E46] bg-[#EEEEEE] p-0 text-[#222831]">
        <DialogHeader className="border-b border-[#393E46] px-6 py-5">
          <DialogTitle className="flex items-center gap-3 font-serif text-2xl italic">
            <div className="flex size-9 items-center justify-center rounded bg-[#FFD369] text-black">
              <Upload size={16} />
            </div>
            Importer un document
          </DialogTitle>
          <p className="mt-1 text-sm text-[#393E46]">
            L'IA analyse votre document et reconstruit un projet complet : scène à scène, synopsis, traitement et scénario.
          </p>
        </DialogHeader>

        <div className="space-y-5 px-6 py-5">
          <Field label="Type de document">
            <Select value={documentType} onValueChange={setDocumentType} disabled={isLoading}>
              <SelectTrigger className="h-10 rounded border-[#393E46] bg-[#FFFFFF] text-sm"><SelectValue /></SelectTrigger>
              <SelectContent className="border-[#393E46] bg-[#EEEEEE] text-[#222831]">
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value} className="text-sm focus:bg-[#FFD369]/20">{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType && <p className="mt-1.5 text-[11px] text-[#393E46]/70">{selectedType.description}</p>}
          </Field>

          <Field label="Contenu du document">
            <Textarea
              placeholder="Collez ici votre texte, ou utilisez le bouton ci-dessous pour charger un fichier .txt ou .fountain..."
              className="h-56 resize-none rounded border-[#393E46] bg-[#FFFFFF] p-3 font-serif text-sm leading-relaxed text-[#393E46] focus-visible:ring-[#FFD369]"
              value={content} onChange={(e) => setContent(e.target.value)} disabled={isLoading} />
          </Field>

          <div className="flex items-center gap-3">
            <label className={cn('cursor-pointer', isLoading && 'pointer-events-none opacity-50')}>
              <input type="file" accept=".txt,.fountain,.md,.fdx" className="sr-only"
                onChange={handleFileUpload} disabled={isLoading} />
              <span className="inline-flex items-center gap-2 rounded border border-[#393E46] bg-[#FFFFFF] px-3 py-1.5 text-xs font-medium text-[#222831] hover:bg-[#EEEEEE]">
                <FileText size={13} />Charger un fichier
              </span>
            </label>
            {content.trim() && (
              <span className="text-[11px] text-[#393E46]/60">
                {content.trim().split(/\s+/).filter(Boolean).length} mots
              </span>
            )}
          </div>
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-[#393E46] bg-[#EEEEEE] px-6 py-4">
          <Button variant="ghost" className="text-xs text-[#393E46] hover:text-[#222831]" onClick={onClose} disabled={isLoading}>
            Annuler
          </Button>
          <Button onClick={() => content.trim() && onImport(documentType, content.trim())}
            disabled={!content.trim() || isLoading}
            className="bg-[#FFD369] px-6 font-bold text-black hover:bg-[#FFD369]/90 disabled:opacity-50">
            {isLoading ? (
              <><RefreshCw size={14} className="mr-2 animate-spin" />Reconstruction en cours…</>
            ) : (
              <><Wand2 size={14} className="mr-2" />Analyser et reconstruire</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
