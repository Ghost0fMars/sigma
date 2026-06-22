import { Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import type { ReactNode } from 'react';
import { Scene, SceneType } from '../types';
import { vtLabel, ctLabel } from '../lib/dramaturgical';

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-[#393E46]">{label}</span>
      {children}
    </label>
  );
}

export function SceneDialog({
  scene, onClose, onChange, onSave,
}: {
  scene: Scene; onClose: () => void;
  onChange: (s: Scene) => void; onSave: (s: Scene) => void;
}) {
  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col overflow-hidden rounded-lg border-[#393E46] bg-[#EEEEEE] p-0 shadow-2xl sm:w-[min(92vw,1040px)] sm:max-w-none lg:w-[min(86vw,1120px)]"
      >
        <DialogHeader className="flex-row items-center justify-between border-b border-[#393E46] bg-[#EEEEEE] p-4 sm:p-6">
          <DialogTitle className="text-xs font-bold uppercase tracking-widest text-[#222831]">Détails de la scène</DialogTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            className="shrink-0 text-[#393E46] hover:text-[#222831]"
            onClick={onClose}
            aria-label="Fermer l'aperçu"
          >
            <X size={18} />
          </Button>
        </DialogHeader>

        <div className="grid min-h-0 flex-1 gap-5 overflow-y-auto p-4 sm:gap-6 sm:p-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:p-8">
          <div className="grid gap-5 sm:gap-6">
          <div className="grid gap-5 sm:grid-cols-[minmax(0,1fr)_240px] sm:gap-6">
            <Field label="Titre">
              <Input value={scene.title} onChange={(e) => onChange({ ...scene, title: e.target.value })}
                className="h-10 rounded border-[#393E46] bg-[#FFFFFF] text-sm" />
            </Field>
            <Field label="Type de séquence">
              <Select value={scene.type} onValueChange={(v: SceneType) => onChange({ ...scene, type: v })}>
                <SelectTrigger className="h-10 rounded border-[#393E46] bg-[#FFFFFF] text-sm"><SelectValue /></SelectTrigger>
                <SelectContent className="border-[#393E46] bg-[#EEEEEE] text-[#222831]">
                  {Object.values(SceneType).map((t) => (
                    <SelectItem key={t} value={t} className="text-sm focus:bg-[#EEEEEE]">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Information spatiale et temporelle">
            <Input value={scene.indications} onChange={(e) => onChange({ ...scene, indications: e.target.value })}
              className="h-10 rounded border-[#393E46] bg-[#FFFFFF] font-mono text-sm" placeholder="ex: INT. SALON - NUIT" />
          </Field>

          <Field label="Description littéraire">
            <Textarea value={scene.description} onChange={(e) => onChange({ ...scene, description: e.target.value })}
              className="h-36 resize-none rounded border-[#393E46] bg-[#FFFFFF] p-3 font-serif text-sm italic leading-relaxed text-[#393E46] lg:h-44"
              placeholder="Le héros découvre la vérité sur son passé..." />
          </Field>

          <Field label="Information dramatique clé">
            <Textarea value={scene.dramaticInfo} onChange={(e) => onChange({ ...scene, dramaticInfo: e.target.value })}
              className="h-32 resize-none rounded border-[#393E46] bg-[#FFFFFF] p-3 font-serif text-sm italic leading-relaxed text-[#393E46] lg:h-40"
              placeholder="Révélation, décision, retournement, dette dramatique..." />
          </Field>

          </div>

          <div className="grid content-start gap-5 rounded border border-[#393E46]/30 bg-[#FFFFFF] p-4 sm:grid-cols-2 lg:grid-cols-1 lg:p-5">
            <div className="space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-[#393E46]">
                V(t) — Valeur de l'acte : {scene.vt >= 0 ? '+' : ''}{scene.vt ?? 0} ({vtLabel(scene.vt ?? 0)})
              </span>
              <p className="text-[10px] text-[#393E46]/60">De −2 (effondrement) à +2 (climax)</p>
              <input type="range" min="-2" max="2" step="0.5" value={scene.vt ?? 0}
                onChange={(e) => onChange({ ...scene, vt: parseFloat(e.target.value) })}
                className="w-full accent-[#FFD369]" />
              <div className="flex justify-between font-mono text-[9px] text-[#393E46]/50">
                <span>−2</span><span>0</span><span>+2</span>
              </div>
            </div>
            <div className="space-y-2">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-[#393E46]">
                C(t) — Pression contextuelle : {((scene.ct ?? 0.5) * 100).toFixed(0)}% ({ctLabel(scene.ct ?? 0.5)})
              </span>
              <p className="text-[10px] text-[#393E46]/60">De 0 (nulle) à 1 (maximale)</p>
              <input type="range" min="0" max="1" step="0.1" value={scene.ct ?? 0.5}
                onChange={(e) => onChange({ ...scene, ct: parseFloat(e.target.value) })}
                className="w-full accent-[#FFD369]" />
              <div className="flex justify-between font-mono text-[9px] text-[#393E46]/50">
                <span>Faible</span><span>Modérée</span><span>Maximale</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="shrink-0 items-center justify-between border-t border-[#393E46] bg-[#EEEEEE] p-4 sm:flex-row sm:p-6">
          <span className="hidden font-mono text-[10px] text-[#393E46] sm:inline">ID: {scene.id}</span>
          <div className="flex w-full gap-2 sm:w-auto">
            <Button variant="ghost" className="text-xs text-[#393E46] hover:text-[#222831]" onClick={onClose}>Annuler</Button>
            <Button onClick={() => onSave(scene)} className="flex-1 bg-[#FFD369] px-6 font-bold text-black hover:bg-[#FFD369]/90 sm:flex-none">
              <Save size={14} className="mr-2" />Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
