import { Save } from 'lucide-react';
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
      <DialogContent className="max-w-2xl overflow-hidden rounded-lg border-[#393E46] bg-[#EEEEEE] p-0 shadow-2xl">
        <DialogHeader className="border-b border-[#393E46] bg-[#EEEEEE] p-6">
          <DialogTitle className="text-xs font-bold uppercase tracking-widest text-[#222831]">Détails de la scène</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6 p-6 sm:p-8">
          <div className="grid gap-6 sm:grid-cols-2">
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
              className="h-28 resize-none rounded border-[#393E46] bg-[#FFFFFF] p-3 font-serif text-sm italic leading-relaxed text-[#393E46]"
              placeholder="Le héros découvre la vérité sur son passé..." />
          </Field>

          <Field label="Information dramatique clé">
            <Textarea value={scene.dramaticInfo} onChange={(e) => onChange({ ...scene, dramaticInfo: e.target.value })}
              className="h-24 resize-none rounded border-[#393E46] bg-[#FFFFFF] p-3 font-serif text-sm italic leading-relaxed text-[#393E46]"
              placeholder="Révélation, décision, retournement, dette dramatique..." />
          </Field>

          <div className="grid gap-4 rounded border border-[#393E46]/30 bg-[#FFFFFF] p-4 sm:grid-cols-2">
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

        <DialogFooter className="flex items-center justify-between border-t border-[#393E46] bg-[#EEEEEE] p-6">
          <span className="hidden font-mono text-[10px] text-[#393E46] sm:inline">ID: {scene.id}</span>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-xs text-[#393E46] hover:text-[#222831]" onClick={onClose}>Annuler</Button>
            <Button onClick={() => onSave(scene)} className="bg-[#FFD369] px-6 font-bold text-black hover:bg-[#FFD369]/90">
              <Save size={14} className="mr-2" />Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
