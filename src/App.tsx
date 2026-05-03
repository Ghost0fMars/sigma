/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState, type ComponentType, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  Clapperboard,
  Download,
  Edit3,
  FileText,
  GripVertical,
  Info,
  LayoutDashboard,
  Menu,
  Plus,
  Save,
  Trash2,
  Wand2,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Project, Scene, SceneType, Step } from './types';

const STORAGE_KEY = 'scriptflow_project';

const DEFAULT_PROJECT: Project = {
  title: 'Sans titre',
  logline: '',
  synopsis: '',
  developedSynopsis: '',
  scenes: [],
  treatment: '',
  screenplay: '',
  notes: '',
};

const STEP_ORDER: Step[] = ['synopsis', 'developedSynopsis', 'board', 'treatment', 'screenplay'];

const steps: { id: Step; label: string; icon: ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'synopsis', label: 'Synopsis', icon: BookOpen },
  { id: 'developedSynopsis', label: 'Synopsis développé', icon: FileText },
  { id: 'board', label: 'Scène à scène', icon: LayoutDashboard },
  { id: 'treatment', label: 'Traitement', icon: Edit3 },
  { id: 'screenplay', label: 'Scénario', icon: Clapperboard },
];

function normalizeProject(value: unknown): Project {
  if (!value || typeof value !== 'object') {
    return DEFAULT_PROJECT;
  }

  const project = value as Partial<Project>;
  return {
    ...DEFAULT_PROJECT,
    ...project,
    scenes: Array.isArray(project.scenes) ? project.scenes : [],
  };
}

function createScene(order: number, overrides: Partial<Scene> = {}): Scene {
  return {
    id: crypto.randomUUID(),
    order,
    title: `Scène ${order + 1}`,
    indications: 'INT. LIEU - JOUR',
    description: '',
    dramaticInfo: '',
    type: SceneType.OTHER,
    ...overrides,
  };
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function getSceneColor(type: SceneType) {
  switch (type) {
    case SceneType.CLIMAX:
      return 'border-red-500';
    case SceneType.RESOLUTION:
      return 'border-green-500';
    case SceneType.EXPOSITION:
      return 'border-amber-400';
    case SceneType.INCITING_INCIDENT:
      return 'border-orange-500';
    case SceneType.MIDPOINT:
      return 'border-blue-500';
    default:
      return 'border-[#393E46]/30';
  }
}

function asMarkdown(project: Project) {
  const scenes = project.scenes
    .map(
      (scene, index) => `### ${index + 1}. ${scene.title}

- Indications: ${scene.indications || 'Non renseigné'}
- Type: ${scene.type}
- Information dramatique: ${scene.dramaticInfo || 'Non renseignée'}

${scene.description || 'Description à compléter.'}`,
    )
    .join('\n\n');

  return `# ${project.title || 'Sans titre'}

## Logline
${project.logline || 'À compléter.'}

## Synopsis
${project.synopsis || 'À compléter.'}

## Synopsis développé
${project.developedSynopsis || 'À compléter.'}

## Scène à scène
${scenes || 'Aucune scène.'}

## Traitement
${project.treatment || 'À compléter.'}

## Scénario
${project.screenplay || 'À compléter.'}

## Notes
${project.notes || 'Aucune note.'}
`;
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function App() {
  const [project, setProject] = useState<Project>(DEFAULT_PROJECT);
  const [currentStep, setCurrentStep] = useState<Step>('synopsis');
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('Sauvegarde locale prête.');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setProject(normalizeProject(JSON.parse(saved)));
      } catch (error) {
        console.error('Failed to load project', error);
        setStatusMessage('Impossible de relire la sauvegarde locale.');
      }
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
      setStatusMessage('Sauvegardé automatiquement.');
    }
  }, [project, isLoaded]);

  const progress = useMemo(() => {
    const completed = [
      project.synopsis.trim(),
      project.developedSynopsis.trim(),
      project.scenes.length > 0 ? 'board' : '',
      project.treatment.trim(),
      project.screenplay.trim(),
    ].filter(Boolean).length;

    return Math.round((completed / STEP_ORDER.length) * 100);
  }, [project]);

  const sceneStats = useMemo(() => {
    const totalWords = project.synopsis + project.developedSynopsis + project.treatment + project.screenplay;
    const screenplayPages = Math.max(1, Math.ceil(countWords(project.screenplay) / 220));
    return {
      sceneCount: project.scenes.length,
      estimatedMinutes: Math.round(project.scenes.length * 1.5),
      wordCount: countWords(totalWords),
      screenplayPages,
    };
  }, [project]);

  const updateProject = (updates: Partial<Project>) => {
    setProject((prev) => ({ ...prev, ...updates }));
  };

  const handleAiAssist = async (stepId: Step) => {
    setIsAiLoading(true);
    setStatusMessage('Génération IA en cours...');
    try {
      const context = `Titre: ${project.title}
Logline: ${project.logline}
Synopsis: ${project.synopsis}
Synopsis développé: ${project.developedSynopsis}
Scènes: ${JSON.stringify(project.scenes)}
Traitement: ${project.treatment}`;

      const prompts: Record<Step, string> = {
        synopsis: `Tu es script-doctor. Améliore ce synopsis ou propose une base originale si le texte est vide. Réponds uniquement avec le synopsis, en français, en 2 à 4 paragraphes.\n\n${context}`,
        developedSynopsis: `Développe le synopsis en récit clair de 500 à 800 mots. Mets en valeur protagoniste, désir, obstacle, escalade, bascule centrale et résolution. Réponds uniquement avec le texte.\n\n${context}`,
        board: `Propose un scène à scène de long métrage à partir du projet. Réponds uniquement en JSON valide: un tableau de 8 à 12 objets avec title, indications, description, dramaticInfo, type. Les types autorisés sont: ${Object.values(SceneType).join(', ')}.\n\n${context}`,
        treatment: `Écris un traitement cinématographique au présent de l'indicatif à partir du scène à scène. Ton: précis, visuel, narratif. Réponds uniquement avec le traitement.\n\n${context}`,
        screenplay: `Transforme le traitement en extrait de scénario professionnel français: intitulés INT./EXT., action au présent, dialogues lisibles. Réponds uniquement avec le scénario.\n\n${context}`,
      };

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: prompts[stepId] }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'OpenAI request failed');
      }

      const newText = typeof data.text === 'string' ? data.text.trim() : '';
      if (!newText) {
        setStatusMessage("L'IA n'a pas renvoyé de contenu exploitable.");
        return;
      }

      if (stepId === 'board') {
        const jsonText = newText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '');
        const generatedScenes = JSON.parse(jsonText) as Partial<Scene>[];
        updateProject({
          scenes: generatedScenes.map((scene, index) =>
            createScene(index, {
              title: scene.title || `Scène ${index + 1}`,
              indications: scene.indications || 'INT. LIEU - JOUR',
              description: scene.description || '',
              dramaticInfo: scene.dramaticInfo || '',
              type: Object.values(SceneType).includes(scene.type as SceneType)
                ? (scene.type as SceneType)
                : SceneType.OTHER,
            }),
          ),
        });
      } else {
        updateProject({ [stepId]: newText });
      }

      setStatusMessage('Proposition IA intégrée.');
    } catch (error) {
      console.error('OpenAI Error:', error);
      setStatusMessage("La génération IA a échoué. Vérifiez OPENAI_API_KEY dans Vercel ou .env.local.");
    } finally {
      setIsAiLoading(false);
    }
  };

  const addScene = () => {
    const newScene = createScene(project.scenes.length);
    updateProject({ scenes: [...project.scenes, newScene] });
    setEditingScene(newScene);
  };

  const removeScene = (id: string) => {
    updateProject({ scenes: project.scenes.filter((scene) => scene.id !== id).map((scene, index) => ({ ...scene, order: index })) });
  };

  const saveScene = (scene: Scene) => {
    updateProject({
      scenes: project.scenes.map((item) => (item.id === scene.id ? scene : item)),
    });
    setEditingScene(null);
  };

  const reorderScenes = (newOrder: Scene[]) => {
    updateProject({ scenes: newOrder.map((scene, index) => ({ ...scene, order: index })) });
  };

  const resetProject = () => {
    const confirmed = window.confirm('Effacer ce projet localement ? Cette action ne peut pas être annulée.');
    if (!confirmed) {
      return;
    }
    localStorage.removeItem(STORAGE_KEY);
    setProject(DEFAULT_PROJECT);
    setStatusMessage('Projet réinitialisé.');
  };

  const exportProject = () => {
    const slug = (project.title || 'sigma').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    downloadText(`${slug || 'sigma'}.md`, asMarkdown(project));
    setStatusMessage('Export Markdown téléchargé.');
  };

  if (!isLoaded) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#222831] selection:bg-[#FFD369] selection:text-black">
      <header className="sticky top-0 z-50 border-b border-[#393E46] bg-[#FFFFFF]/90 px-4 py-3 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded bg-[#FFD369] text-black">
              <Clapperboard size={20} />
            </div>
            <div className="min-w-0">
              <h1 className="truncate font-serif text-xl italic tracking-wide">Sigma</h1>
              <p className="text-[10px] font-medium uppercase tracking-widest text-[#222831]/40">
                Assistant de dramaturgie
              </p>
            </div>
          </div>

          <nav className="hidden items-center md:flex">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => setCurrentStep(step.id)}
                  className={cn(
                    'flex h-11 items-center gap-2 border-b-2 px-4 text-sm font-medium transition-colors',
                    isActive
                      ? 'border-[#FFD369] bg-[#FFD369] text-[#222831]'
                      : 'border-transparent text-[#222831]/55 hover:text-[#222831]',
                  )}
                >
                  <span className="text-[10px] opacity-50">{index + 1}.</span>
                  <Icon size={14} />
                  {step.label}
                </button>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon-sm" className="md:hidden" onClick={() => setIsMobileNavOpen((value) => !value)}>
              <Menu size={17} />
            </Button>
            <Button variant="ghost" size="sm" className="hidden text-[#222831]/45 hover:text-[#222831] sm:inline-flex" onClick={resetProject}>
              Effacer
            </Button>
            <Button variant="outline" size="sm" className="border-[#393E46] text-xs uppercase tracking-widest" onClick={exportProject}>
              <Download size={14} className="mr-2" />
              Exporter
            </Button>
          </div>
        </div>

        {isMobileNavOpen && (
          <div className="mx-auto mt-3 grid max-w-7xl grid-cols-1 gap-2 md:hidden">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => {
                  setCurrentStep(step.id);
                  setIsMobileNavOpen(false);
                }}
                className={cn(
                  'rounded border border-[#393E46] px-3 py-2 text-left text-sm',
                  currentStep === step.id && 'border-[#FFD369] bg-[#FFD369] text-[#222831]',
                )}
              >
                {step.label}
              </button>
            ))}
          </div>
        )}
      </header>

      <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-6">
        <aside className="space-y-4">
          <Card className="border-[#393E46] bg-[#EEEEEE] p-4">
            <div className="space-y-3">
              <Input
                value={project.title}
                onChange={(event) => updateProject({ title: event.target.value })}
                className="h-10 border-[#393E46] bg-[#FFFFFF] font-serif text-lg italic"
                placeholder="Titre du projet"
              />
              <Textarea
                value={project.logline}
                onChange={(event) => updateProject({ logline: event.target.value })}
                className="h-24 resize-none border-[#393E46] bg-[#FFFFFF] text-sm leading-relaxed"
                placeholder="Logline: protagoniste, désir, obstacle, enjeu."
              />
            </div>
          </Card>

          <Card className="border-[#393E46] bg-[#EEEEEE] p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#393E46]">Progression</span>
              <span className="font-mono text-xs text-[#222831]">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-[#FFFFFF]">
              <div className="h-full bg-[#FFD369]" style={{ width: `${progress}%` }} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
              <Metric label="Scènes" value={sceneStats.sceneCount} />
              <Metric label="Minutes" value={sceneStats.estimatedMinutes} />
              <Metric label="Mots" value={sceneStats.wordCount} />
              <Metric label="Pages" value={sceneStats.screenplayPages} />
            </div>
          </Card>

          <Card className="border-[#393E46] bg-[#EEEEEE] p-4">
            <label className="text-[10px] font-bold uppercase tracking-widest text-[#393E46]">Notes de travail</label>
            <Textarea
              value={project.notes}
              onChange={(event) => updateProject({ notes: event.target.value })}
              className="mt-3 h-40 resize-none border-[#393E46] bg-[#FFFFFF] text-sm"
              placeholder="Questions, pistes de réécriture, références..."
            />
          </Card>
        </aside>

        <section className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              {currentStep === 'synopsis' && (
                <StepContent
                  title="Synopsis"
                  description="Le coeur de votre histoire résumé en quelques paragraphes."
                  onAiAssist={() => handleAiAssist('synopsis')}
                  isAiLoading={isAiLoading}
                >
                  <Textarea
                    placeholder="Une phrase simple suffit pour commencer: quelqu'un veut quelque chose, mais..."
                    className="min-h-[420px] resize-none border-none bg-transparent p-0 text-lg leading-relaxed shadow-none focus-visible:ring-0"
                    value={project.synopsis}
                    onChange={(event) => updateProject({ synopsis: event.target.value })}
                  />
                </StepContent>
              )}

              {currentStep === 'developedSynopsis' && (
                <StepContent
                  title="Synopsis développé"
                  description="Approfondissez l'intrigue, les personnages et les arcs dramatiques."
                  onAiAssist={() => handleAiAssist('developedSynopsis')}
                  isAiLoading={isAiLoading}
                >
                  <Textarea
                    placeholder="Décrivez l'évolution de l'intrigue en détail..."
                    className="min-h-[520px] resize-none border-none bg-transparent p-0 text-lg leading-relaxed shadow-none focus-visible:ring-0"
                    value={project.developedSynopsis}
                    onChange={(event) => updateProject({ developedSynopsis: event.target.value })}
                  />
                </StepContent>
              )}

              {currentStep === 'board' && (
                <SceneBoard
                  scenes={project.scenes}
                  isAiLoading={isAiLoading}
                  onAiAssist={() => handleAiAssist('board')}
                  onAddScene={addScene}
                  onEditScene={setEditingScene}
                  onRemoveScene={removeScene}
                  onReorderScenes={reorderScenes}
                />
              )}

              {currentStep === 'treatment' && (
                <StepContent
                  title="Traitement"
                  description="Narratif au présent de l'indicatif. Donnez vie aux actions, au rythme et aux nuances."
                  onAiAssist={() => handleAiAssist('treatment')}
                  isAiLoading={isAiLoading}
                >
                  <Textarea
                    placeholder="Jean entre dans la pièce. Il sent la tension monter..."
                    className="min-h-[520px] resize-none border-none bg-transparent p-0 text-lg leading-relaxed shadow-none focus-visible:ring-0"
                    value={project.treatment}
                    onChange={(event) => updateProject({ treatment: event.target.value })}
                  />
                </StepContent>
              )}

              {currentStep === 'screenplay' && (
                <StepContent
                  title="Scénario"
                  description="Version au format de lecture: séquences, action, dialogues."
                  onAiAssist={() => handleAiAssist('screenplay')}
                  isAiLoading={isAiLoading}
                >
                  <div className="mx-auto min-h-[760px] max-w-3xl rounded-sm bg-white p-6 font-mono text-[15px] leading-tight text-black shadow-2xl sm:p-12">
                    <Textarea
                      placeholder={'INT. BUREAU - JOUR\n\nJEAN est assis à son bureau...'}
                      className="min-h-[680px] resize-none whitespace-pre-wrap border-none bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
                      value={project.screenplay}
                      onChange={(event) => updateProject({ screenplay: event.target.value })}
                    />
                  </div>
                </StepContent>
              )}
            </motion.div>
          </AnimatePresence>
        </section>
      </main>

      {editingScene && (
        <SceneDialog
          scene={editingScene}
          onClose={() => setEditingScene(null)}
          onChange={setEditingScene}
          onSave={saveScene}
        />
      )}

      <footer className="mx-auto mb-6 mt-4 flex max-w-7xl items-center justify-center gap-2 px-6 text-center text-[10px] uppercase tracking-widest text-[#222831]/35">
        <Info size={10} />
        {statusMessage}
      </footer>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border border-[#393E46] bg-[#FFFFFF] p-2">
      <div className="font-mono text-lg text-[#222831]">{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-[#393E46]">{label}</div>
    </div>
  );
}

function StepContent({
  title,
  description,
  children,
  onAiAssist,
  isAiLoading,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onAiAssist?: () => void;
  isAiLoading?: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#393E46] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl italic text-[#222831]">{title}</h2>
          <p className="mt-1 text-sm text-[#393E46]">{description}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full border-[#393E46] text-xs uppercase tracking-widest text-[#393E46] hover:bg-[#393E46] hover:text-[#FFFFFF] sm:w-auto"
          onClick={onAiAssist}
          disabled={isAiLoading}
        >
          <Wand2 size={14} className={cn('mr-2', isAiLoading && 'animate-spin')} />
          {isAiLoading ? 'Génération...' : 'Assistant IA'}
        </Button>
      </div>

      <div className="min-h-[500px] rounded-lg border border-[#393E46] bg-[#EEEEEE] p-5 shadow-2xl sm:p-10">
        {children}
      </div>
    </div>
  );
}

function SceneBoard({
  scenes,
  isAiLoading,
  onAiAssist,
  onAddScene,
  onEditScene,
  onRemoveScene,
  onReorderScenes,
}: {
  scenes: Scene[];
  isAiLoading: boolean;
  onAiAssist: () => void;
  onAddScene: () => void;
  onEditScene: (scene: Scene) => void;
  onRemoveScene: (id: string) => void;
  onReorderScenes: (scenes: Scene[]) => void;
}) {
  const [draggedSceneId, setDraggedSceneId] = useState<string | null>(null);
  const [dragOverSceneId, setDragOverSceneId] = useState<string | null>(null);

  const moveScene = (targetId: string) => {
    if (!draggedSceneId || draggedSceneId === targetId) {
      return;
    }

    const fromIndex = scenes.findIndex((scene) => scene.id === draggedSceneId);
    const toIndex = scenes.findIndex((scene) => scene.id === targetId);
    if (fromIndex < 0 || toIndex < 0) {
      return;
    }

    const nextScenes = [...scenes];
    const [movedScene] = nextScenes.splice(fromIndex, 1);
    nextScenes.splice(toIndex, 0, movedScene);
    onReorderScenes(nextScenes);
  };

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
          <Button variant="ghost" className="text-xs uppercase tracking-widest text-[#393E46] hover:text-[#222831]" onClick={onAiAssist} disabled={isAiLoading}>
            <Wand2 size={14} className={cn('mr-2', isAiLoading && 'animate-spin')} />
            Suggestions IA
          </Button>
          <Button onClick={onAddScene} className="bg-[#FFD369] px-4 font-bold text-black hover:bg-[#FFD369]/90">
            <Plus size={16} className="mr-2" />
            Nouvelle scène
          </Button>
        </div>
      </div>

      <div
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
        onDragOver={(event) => event.preventDefault()}
        onDrop={() => {
          setDraggedSceneId(null);
          setDragOverSceneId(null);
        }}
      >
        {scenes.map((scene) => (
          <div
            key={scene.id}
            draggable
            className={cn(
              'group cursor-grab active:cursor-grabbing',
              draggedSceneId === scene.id && 'opacity-45',
            )}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = 'move';
              event.dataTransfer.setData('text/plain', scene.id);
              setDraggedSceneId(scene.id);
            }}
            onDragEnter={(event) => {
              event.preventDefault();
              setDragOverSceneId(scene.id);
            }}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = 'move';
            }}
            onDragLeave={() => setDragOverSceneId((id) => (id === scene.id ? null : id))}
            onDrop={(event) => {
              event.preventDefault();
              moveScene(scene.id);
              setDraggedSceneId(null);
              setDragOverSceneId(null);
            }}
            onDragEnd={() => {
              setDraggedSceneId(null);
              setDragOverSceneId(null);
            }}
          >
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

              <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#393E46]/10 pt-3">
                <span className="truncate font-serif text-[11px] italic text-[#222831]/40">
                  {scene.dramaticInfo || 'Information dramatique à définir'}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon-xs" className="text-[#393E46] hover:text-[#222831]" onClick={() => onEditScene(scene)}>
                    <Edit3 size={12} />
                  </Button>
                  <Button variant="ghost" size="icon-xs" className="text-[#393E46] hover:text-red-400" onClick={() => onRemoveScene(scene.id)}>
                    <Trash2 size={12} />
                  </Button>
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
            <Plus size={16} className="mr-2" />
            Insérer une scène
          </Button>
        </div>
      )}
    </div>
  );
}

function SceneDialog({
  scene,
  onClose,
  onChange,
  onSave,
}: {
  scene: Scene;
  onClose: () => void;
  onChange: (scene: Scene) => void;
  onSave: (scene: Scene) => void;
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
              <Input value={scene.title} onChange={(event) => onChange({ ...scene, title: event.target.value })} className="h-10 rounded border-[#393E46] bg-[#FFFFFF] text-sm" />
            </Field>
            <Field label="Type de séquence">
              <Select value={scene.type} onValueChange={(value: SceneType) => onChange({ ...scene, type: value })}>
                <SelectTrigger className="h-10 rounded border-[#393E46] bg-[#FFFFFF] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="border-[#393E46] bg-[#EEEEEE] text-[#222831]">
                  {Object.values(SceneType).map((type) => (
                    <SelectItem key={type} value={type} className="text-sm focus:bg-[#EEEEEE]">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <Field label="Information spatiale et temporelle">
            <Input value={scene.indications} onChange={(event) => onChange({ ...scene, indications: event.target.value })} className="h-10 rounded border-[#393E46] bg-[#FFFFFF] font-mono text-sm" placeholder="ex: INT. SALON - NUIT" />
          </Field>

          <Field label="Description littéraire">
            <Textarea value={scene.description} onChange={(event) => onChange({ ...scene, description: event.target.value })} className="h-28 resize-none rounded border-[#393E46] bg-[#FFFFFF] p-3 font-serif text-sm italic leading-relaxed text-[#393E46]" placeholder="Le héros découvre la vérité sur son passé..." />
          </Field>

          <Field label="Information dramatique clé">
            <Textarea value={scene.dramaticInfo} onChange={(event) => onChange({ ...scene, dramaticInfo: event.target.value })} className="h-24 resize-none rounded border-[#393E46] bg-[#FFFFFF] p-3 font-serif text-sm italic leading-relaxed text-[#393E46]" placeholder="Révélation, décision, retournement, dette dramatique..." />
          </Field>
        </div>

        <DialogFooter className="flex items-center justify-between border-t border-[#393E46] bg-[#EEEEEE] p-6">
          <span className="hidden font-mono text-[10px] text-[#393E46] sm:inline">ID: {scene.id}</span>
          <div className="flex gap-2">
            <Button variant="ghost" className="text-xs text-[#393E46] hover:text-[#222831]" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={() => onSave(scene)} className="bg-[#FFD369] px-6 font-bold text-black hover:bg-[#FFD369]/90">
              <Save size={14} className="mr-2" />
              Enregistrer
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="space-y-2">
      <span className="block text-[10px] font-bold uppercase tracking-widest text-[#393E46]">{label}</span>
      {children}
    </label>
  );
}






