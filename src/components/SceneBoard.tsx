import { useState } from 'react';
import { Edit3, GripVertical, LayoutDashboard, Lightbulb, Plus, Trash2, Undo2, Wand2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Scene } from '../types';
import { computeIntegrale, vtLabel, ctLabel, getSceneColor } from '../lib/dramaturgical';
import { SuggestionPanel } from './SuggestionPanel';

export function SceneBoard({
  scenes, isAiLoading, isAnalysisLoading, suggestions, canUndo,
  onAiAssist, onAiAnalyze, onUndoAiAssist, onAddScene, onEditScene, onRemoveScene, onReorderScenes,
}: {
  scenes: Scene[]; isAiLoading: boolean; isAnalysisLoading: boolean; suggestions?: string; canUndo?: boolean;
  onAiAssist: () => void; onAiAnalyze: () => void; onUndoAiAssist?: () => void; onAddScene: () => void;
  onEditScene: (s: Scene) => void; onRemoveScene: (id: string) => void;
  onReorderScenes: (s: Scene[]) => void;
}) {
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<string | null>(null);

  const moveScene = (targetId: string) => {
    if (!draggedSceneId || draggedSceneId === targetId) return;
    const from = scenes.findIndex((s) => s.id === draggedSceneId);
    const to   = scenes.findIndex((s) => s.id === targetId);
    if (from < 0 || to < 0) return;
    const next = [...scenes];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onReorderScenes(next);
  };

  const scenesWithSt = computeIntegrale(scenes);
  const maxSt = Math.max(...scenesWithSt.map((s) => s.st ?? 0), 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-lg border border-[#393E46] bg-[#EEEEEE] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <span className="text-xs font-semibold uppercase tracking-widest text-[#393E46]">Tableau de séquences</span>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="bg-[#393E46] text-[#FFFFFF]">{scenes.length} scènes</Badge>
            <Badge className="bg-[#393E46] text-[#FFFFFF]">{Math.round(scenes.length * 1.5)} min estimées</Badge>
          </div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {canUndo && (
            <Button variant="ghost" className="text-xs uppercase tracking-widest text-[#393E46] hover:text-[#222831]"
              onClick={onUndoAiAssist} disabled={isAiLoading || isAnalysisLoading}>
              <Undo2 size={14} className="mr-2" />
              Annuler
            </Button>
          )}
          <Button variant="ghost" className="text-xs uppercase tracking-widest text-[#393E46] hover:text-[#222831]"
            onClick={onAiAnalyze} disabled={isAnalysisLoading || isAiLoading}>
            <Lightbulb size={14} className={cn('mr-2', isAnalysisLoading && 'animate-pulse')} />
            {isAnalysisLoading ? 'Analyse...' : 'Pistes IA'}
          </Button>
          <Button variant="ghost" className="text-xs uppercase tracking-widest text-[#393E46] hover:text-[#222831]"
            onClick={onAiAssist} disabled={isAiLoading || isAnalysisLoading}>
            <Wand2 size={14} className={cn('mr-2', isAiLoading && 'animate-spin')} />
            Générer
          </Button>
          <Button onClick={onAddScene} className="bg-[#FFD369] px-4 font-bold text-black hover:bg-[#FFD369]/90">
            <Plus size={16} className="mr-2" />Nouvelle scène
          </Button>
        </div>
      </div>

      {scenes.length > 1 && (
        <div className="rounded-lg border border-[#393E46] bg-[#EEEEEE] p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#393E46]">Intégrale dramatique S(t)</span>
            <span className="text-[10px] text-[#393E46]/60">— charge narrative accumulée</span>
          </div>
          <div className="relative h-20 w-full">
            <svg viewBox={`0 0 ${scenes.length * 60} 80`} className="h-full w-full" preserveAspectRatio="none">
              <line x1="0" y1="70" x2={scenes.length * 60} y2="70" stroke="#393E46" strokeWidth="0.5" strokeOpacity="0.3" />
              <polyline fill="none" stroke="#FFD369" strokeWidth="2" strokeLinejoin="round"
                points={scenesWithSt.map((s, i) => {
                  const x = i * 60 + 30;
                  const y = 70 - ((s.st ?? 0) / maxSt) * 60;
                  return `${x},${y}`;
                }).join(' ')} />
              {scenesWithSt.map((s, i) => {
                const x = i * 60 + 30;
                const y = 70 - ((s.st ?? 0) / maxSt) * 60;
                return (
                  <g key={s.id}>
                    <circle cx={x} cy={y} r="3" fill="#FFD369" stroke="#393E46" strokeWidth="1" />
                    <text x={x} y={76} textAnchor="middle" fontSize="6" fill="#393E46" opacity="0.6">{i + 1}</text>
                  </g>
                );
              })}
            </svg>
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-[#393E46]/50">
            <span>S(t) = 0</span><span>S(t) max = {maxSt.toFixed(1)}</span>
          </div>
        </div>
      )}

      {suggestions && <SuggestionPanel text={suggestions} />}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={() => { setDraggedSceneId(null); setDragOverSceneId(null); }}>
        {scenesWithSt.map((scene) => (
          <div key={scene.id} draggable
            className={cn('group cursor-grab active:cursor-grabbing', draggedSceneId === scene.id && 'opacity-45')}
            onDragStart={(e) => { e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', scene.id); setDraggedSceneId(scene.id); }}
            onDragEnter={(e) => { e.preventDefault(); setDragOverSceneId(scene.id); }}
            onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
            onDragLeave={() => setDragOverSceneId((id) => (id === scene.id ? null : id))}
            onDrop={(e) => { e.preventDefault(); moveScene(scene.id); setDraggedSceneId(null); setDragOverSceneId(null); }}
            onDragEnd={() => { setDraggedSceneId(null); setDragOverSceneId(null); }}>
            <Card className={cn(
              'flex h-full min-h-52 flex-col gap-3 rounded-r border-none border-l-4 bg-[#EEEEEE] p-4 shadow-lg ring-1 ring-[#393E46]/10 transition-colors hover:bg-[#EEEEEE]',
              dragOverSceneId === scene.id && draggedSceneId !== scene.id && 'ring-2 ring-[#FFD369]/80',
              getSceneColor(scene.type),
            )}>
              <div className="flex items-start justify-between gap-3">
                <span className="font-mono text-[10px] text-[#222831]">
                  #{String(scene.order + 1).padStart(2, '0')} | {scene.indications || 'SANS LIEU'}
                </span>
                <GripVertical size={15} className="shrink-0 text-[#393E46]" />
              </div>
              <div className="min-h-0 flex-1 space-y-2">
                <Badge className="bg-[#393E46] text-[9px] uppercase tracking-wider text-[#FFFFFF]">{scene.type}</Badge>
                <h3 className="font-serif text-base italic leading-snug text-[#222831]">{scene.title}</h3>
                <p className="line-clamp-4 text-sm leading-relaxed text-[#222831]/70">
                  {scene.description || 'Aucune description de scène.'}
                </p>
              </div>
              <div className="mt-auto flex flex-col gap-2 border-t border-[#393E46]/10 pt-3">
                <span className="truncate font-serif text-[11px] italic text-[#222831]/40">
                  {scene.dramaticInfo || 'Information dramatique à définir'}
                </span>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-wrap gap-1">
                    <span className="rounded bg-[#393E46]/10 px-1.5 py-0.5 font-mono text-[9px] text-[#393E46]">
                      V(t) {scene.vt >= 0 ? '+' : ''}{scene.vt ?? 0} {vtLabel(scene.vt ?? 0)}
                    </span>
                    <span className="rounded bg-[#393E46]/10 px-1.5 py-0.5 font-mono text-[9px] text-[#393E46]">
                      C(t) {((scene.ct ?? 0.5) * 100).toFixed(0)}% {ctLabel(scene.ct ?? 0.5)}
                    </span>
                    {scene.st !== undefined && (
                      <span className="rounded bg-[#FFD369]/60 px-1.5 py-0.5 font-mono text-[9px] font-bold text-[#222831]">
                        S(t) {scene.st}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon-xs" className="text-[#393E46] hover:text-[#222831]" onClick={() => onEditScene(scene)}>
                      <Edit3 size={12} />
                    </Button>
                    <Button variant="ghost" size="icon-xs" className="text-[#393E46] hover:text-red-400" onClick={() => onRemoveScene(scene.id)}>
                      <Trash2 size={12} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        ))}
      </div>

      {scenes.length === 0 && (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-[#393E46] text-center text-[#393E46]/55">
          <LayoutDashboard size={48} strokeWidth={1} className="mb-4 opacity-30" />
          <p className="text-xs uppercase tracking-widest">Commencez la construction de votre récit</p>
          <Button variant="outline" className="mt-6 border-[#393E46] hover:border-[#FFD369] hover:text-[#222831]" onClick={onAddScene}>
            <Plus size={16} className="mr-2" />Insérer une scène
          </Button>
        </div>
      )}
    </div>
  );
}
