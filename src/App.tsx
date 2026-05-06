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
  FolderOpen,
  GripVertical,
  Info,
  LayoutDashboard,
  Lightbulb,
  LogOut,
  Menu,
  RefreshCw,
  ShieldCheck,
  Plus,
  Save,
  Trash2,
  Wand2,
  X,
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
import { AuthPage } from './AuthPage';
import { supabase } from './supabaseClient';

type AccessStatus = 'checking' | 'pending' | 'approved' | 'error';
type AppView = 'projects' | 'editor';

type SavedProject = {
  id: string;
  title: string;
  updatedAt: string;
  project: Project;
};

const STORAGE_KEY = 'scriptflow_project';
const PROJECTS_KEY = 'sigma_projects';
const CURRENT_PROJECT_ID_KEY = 'sigma_current_project_id';

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

function normalizeSavedProjects(value: unknown): SavedProject[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((item): item is Partial<SavedProject> => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      id: typeof item.id === 'string' ? item.id : crypto.randomUUID(),
      title: typeof item.title === 'string' && item.title.trim() ? item.title : 'Sans titre',
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
      project: normalizeProject(item.project),
    }));
}

function getUserStorageKey(key: string, userId: string) {
  return key + ':' + userId;
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
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<AppView>('editor');
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState('');
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('checking');
  const [accessMessage, setAccessMessage] = useState('');
  const [approvalRefreshKey, setApprovalRefreshKey] = useState(0);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>('synopsis');
  const [isLoaded, setIsLoaded] = useState(false);
  const [editingScene, setEditingScene] = useState<Scene | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisSuggestions, setAnalysisSuggestions] = useState<Partial<Record<Step, string>>>({});
  const [statusMessage, setStatusMessage] = useState('Sauvegarde locale prête.');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsAuthReady(true);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? '');
      setAccessStatus(user ? 'checking' : 'pending');
      setIsAuthReady(true);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user ?? null;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? '');
      setAccessStatus(user ? 'checking' : 'pending');
      setAccessMessage('');
      setProject(DEFAULT_PROJECT);
      setSavedProjects([]);
      setCurrentProjectId(null);
      setCurrentView('editor');
      setIsLoaded(false);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthReady || !userId || !supabase) {
      return;
    }

    let isCancelled = false;

    const checkApproval = async () => {
      setAccessStatus('checking');
      setAccessMessage('');

      const { data, error } = await supabase
        .from('user_access')
        .select('status')
        .eq('user_id', userId)
        .maybeSingle();

      if (isCancelled) {
        return;
      }

      if (error) {
        setAccessStatus('error');
        setAccessMessage("Impossible de vérifier l'approbation du compte. Exécutez d'abord le SQL dans Supabase.");
        return;
      }

      if (!data) {
        // Fallback pour les utilisateurs créés avant le trigger
        const { error: insertError } = await supabase.from('user_access').insert({
          user_id: userId,
          email: userEmail,
          status: 'pending',
        });

        if (isCancelled) {
          return;
        }

        if (insertError && insertError.code !== '23505') {
          setAccessStatus('error');
          setAccessMessage("Impossible de créer la demande d'accès. Vérifiez les règles RLS de la table user_access.");
          return;
        }

        setAccessStatus('pending');
        return;
      }

      setAccessStatus(data.status === 'approved' ? 'approved' : 'pending');
    };

    checkApproval();

    return () => {
      isCancelled = true;
    };
  }, [approvalRefreshKey, isAuthReady, userEmail, userId]);

  useEffect(() => {
    if (!isAuthReady || !userId || accessStatus !== 'approved') {
      return;
    }

    const projectsKey = getUserStorageKey(PROJECTS_KEY, userId);
    const currentIdKey = getUserStorageKey(CURRENT_PROJECT_ID_KEY, userId);
    const legacyKey = getUserStorageKey(STORAGE_KEY, userId);

    const applyProjects = (loadedProjects: SavedProject[]) => {
      const storedCurrentId = localStorage.getItem(currentIdKey);
      const selectedProject = loadedProjects.find((item) => item.id === storedCurrentId) ?? loadedProjects[0];

      if (selectedProject) {
        setProject(selectedProject.project);
        setCurrentProjectId(selectedProject.id);
        setCurrentView('projects');
      } else {
        const legacySaved = localStorage.getItem(legacyKey);
        if (legacySaved) {
          try {
            setProject(normalizeProject(JSON.parse(legacySaved)));
          } catch {
            setProject(DEFAULT_PROJECT);
          }
        } else {
          setProject(DEFAULT_PROJECT);
        }
        setCurrentProjectId(null);
        setCurrentView('editor');
      }

      setSavedProjects(loadedProjects);
      setIsLoaded(true);
    };

    const loadFromLocalStorage = () => {
      let loadedProjects: SavedProject[] = [];
      try {
        loadedProjects = normalizeSavedProjects(JSON.parse(localStorage.getItem(projectsKey) || '[]'));
      } catch (error) {
        console.error('Failed to load projects from localStorage', error);
        setStatusMessage('Impossible de relire la liste des projets.');
      }
      applyProjects(loadedProjects);
    };

    if (!supabase) {
      loadFromLocalStorage();
      return;
    }

    supabase
      .from('projects')
      .select('id, title, updated_at, data')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) {
          console.error('Failed to load projects from Supabase, falling back to localStorage', error);
          loadFromLocalStorage();
          return;
        }

        if (!data || data.length === 0) {
          // Supabase vide : migrer depuis localStorage si des données existent
          const local = normalizeSavedProjects(JSON.parse(localStorage.getItem(projectsKey) || '[]'));
          if (local.length > 0) {
            const rows = local.map((sp) => ({
              id: sp.id,
              user_id: userId,
              title: sp.title,
              updated_at: sp.updatedAt,
              data: sp.project,
            }));
            supabase.from('projects').upsert(rows).then(({ error: upsertError }) => {
              if (upsertError) console.error('Migration localStorage → Supabase failed', upsertError);
            });
          }
          applyProjects(local);
          return;
        }

        const loadedProjects: SavedProject[] = data.map((row) => ({
          id: row.id,
          title: row.title,
          updatedAt: row.updated_at,
          project: normalizeProject(row.data),
        }));

        // Mettre à jour le cache localStorage
        localStorage.setItem(projectsKey, JSON.stringify(loadedProjects));
        applyProjects(loadedProjects);
      });
  }, [accessStatus, isAuthReady, userId]);

  useEffect(() => {
    if (isLoaded && userId && accessStatus === 'approved') {
      localStorage.setItem(getUserStorageKey(STORAGE_KEY, userId), JSON.stringify(project));
    }
  }, [accessStatus, project, isLoaded, userId]);

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

  const persistSavedProjects = (projects: SavedProject[]) => {
    if (!userId) {
      return;
    }

    setSavedProjects(projects);
    localStorage.setItem(getUserStorageKey(PROJECTS_KEY, userId), JSON.stringify(projects));
  };

  const updateProject = (updates: Partial<Project>) => {
    setProject((prev) => ({ ...prev, ...updates }));
  };

  const saveCurrentProject = () => {
    if (!userId) {
      return;
    }

    const id = currentProjectId ?? crypto.randomUUID();
    const now = new Date().toISOString();
    const title = project.title.trim() || 'Sans titre';
    const savedProject: SavedProject = {
      id,
      title,
      updatedAt: now,
      project: { ...project, title },
    };

    const nextProjects = [savedProject, ...savedProjects.filter((item) => item.id !== id)];
    setProject(savedProject.project);
    setCurrentProjectId(id);
    persistSavedProjects(nextProjects);
    localStorage.setItem(getUserStorageKey(CURRENT_PROJECT_ID_KEY, userId), id);

    if (supabase) {
      supabase
        .from('projects')
        .upsert({ id, user_id: userId, title, updated_at: now, data: savedProject.project })
        .then(({ error }) => {
          if (error) {
            console.error('Failed to sync project to Supabase', error);
            setStatusMessage('Sauvegardé localement uniquement — synchronisation Supabase échouée.');
          } else {
            setStatusMessage('Projet sauvegardé et synchronisé.');
          }
        });
      return;
    }

    setStatusMessage('Projet sauvegardé localement.');
  };

  const openSavedProject = (savedProject: SavedProject) => {
    if (!userId) {
      return;
    }

    setProject(savedProject.project);
    setCurrentProjectId(savedProject.id);
    setCurrentStep('synopsis');
    setCurrentView('editor');
    setAnalysisSuggestions({});
    localStorage.setItem(getUserStorageKey(CURRENT_PROJECT_ID_KEY, userId), savedProject.id);
    setStatusMessage('Projet ouvert.');
  };

  const createNewProject = () => {
    setProject({ ...DEFAULT_PROJECT, title: 'Sans titre' });
    setCurrentProjectId(null);
    setCurrentStep('synopsis');
    setCurrentView('editor');
    setAnalysisSuggestions({});
    setStatusMessage('Nouveau projet prêt.');
  };

  const deleteSavedProject = (id: string) => {
    const confirmed = window.confirm('Supprimer ce projet sauvegard? ?');
    if (!confirmed) {
      return;
    }

    const nextProjects = savedProjects.filter((item) => item.id !== id);
    persistSavedProjects(nextProjects);
    if (currentProjectId === id) {
      setCurrentProjectId(null);
      setProject(nextProjects[0]?.project ?? DEFAULT_PROJECT);
      if (userId) {
        if (nextProjects[0]) {
          localStorage.setItem(getUserStorageKey(CURRENT_PROJECT_ID_KEY, userId), nextProjects[0].id);
        } else {
          localStorage.removeItem(getUserStorageKey(CURRENT_PROJECT_ID_KEY, userId));
        }
      }
    }

    if (supabase && userId) {
      supabase
        .from('projects')
        .delete()
        .eq('id', id)
        .eq('user_id', userId)
        .then(({ error }) => {
          if (error) console.error('Failed to delete project from Supabase', error);
        });
    }

    setStatusMessage('Projet supprimé.');
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


  const getStepSnapshot = (stepId: Step) => {
    const sceneList = project.scenes
      .map(
        (scene, index) =>
          `${index + 1}. ${scene.title}
Type: ${scene.type}
Indications: ${scene.indications}
Description: ${scene.description || 'Non renseignée'}
Information dramatique: ${scene.dramaticInfo || 'Non renseignée'}`,
      )
      .join('\n\n');

    const snapshots: Record<Step, string> = {
      synopsis: project.synopsis || 'Aucun synopsis renseigné.',
      developedSynopsis: project.developedSynopsis || 'Aucun synopsis développé renseigné.',
      board: sceneList || 'Aucune scène renseignée.',
      treatment: project.treatment || 'Aucun traitement renseigné.',
      screenplay: project.screenplay || 'Aucun scénario renseigné.',
    };

    return snapshots[stepId];
  };

  const handleAiAnalysis = async (stepId: Step) => {
    setIsAnalysisLoading(true);
    setStatusMessage('Analyse IA en cours...');

    try {
      const stepLabels: Record<Step, string> = {
        synopsis: 'Synopsis',
        developedSynopsis: 'Synopsis développé',
        board: 'Scène à scène',
        treatment: 'Traitement',
        screenplay: 'Scénario',
      };

      const prompt = `Tu es script-doctor et consultant en dramaturgie. Analyse uniquement la page "${stepLabels[stepId]}" de ce projet Sigma.

Objectif: proposer des pistes d'amélioration concrètes sans réécrire le texte à la place de l'auteur.

Réponds en français avec:
- un diagnostic bref;
- 5 à 8 pistes d'amélioration actionnables;
- 2 questions utiles à poser à l'auteur.

Projet:
Titre: ${project.title}
Logline: ${project.logline || 'Non renseignée'}
Notes: ${project.notes || 'Non renseignées'}

Contenu de la page à analyser:
${getStepSnapshot(stepId)}`;

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'OpenAI request failed');
      }

      const newText = typeof data.text === 'string' ? data.text.trim() : '';
      if (!newText) {
        setStatusMessage("L'IA n'a pas renvoyé de pistes exploitables.");
        return;
      }

      setAnalysisSuggestions((previous) => ({ ...previous, [stepId]: newText }));
      setStatusMessage("Pistes d'amélioration prêtes.");
    } catch (error) {
      console.error('OpenAI Analysis Error:', error);
      setStatusMessage("L'analyse IA a échoué. Vérifiez OPENAI_API_KEY dans Vercel ou .env.local.");
    } finally {
      setIsAnalysisLoading(false);
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
    if (userId) {
      localStorage.removeItem(STORAGE_KEY + ':' + userId);
    }
    setProject(DEFAULT_PROJECT);
    setStatusMessage('Projet réinitialisé.');
  };

  const exportProject = () => {
    const slug = (project.title || 'sigma').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    downloadText(`${slug || 'sigma'}.md`, asMarkdown(project));
    setStatusMessage('Export Markdown téléchargé.');
  };

  const signOut = async () => {
    setAccessStatus('pending');
    setAccessMessage('');
    await supabase?.auth.signOut();
  };

  const refreshApproval = () => {
    setApprovalRefreshKey((value) => value + 1);
  };

  if (!isAuthReady) {
    return null;
  }

  if (!userId) {
    return <AuthPage />;
  }

  if (accessStatus === 'checking') {
    return <FullScreenNotice title="Vérification du compte" message="Nous vérifions votre statut d'approbation." />;
  }

  if (accessStatus !== 'approved') {
    return (
      <PendingApprovalPage
        email={userEmail}
        message={accessMessage}
        isError={accessStatus === 'error'}
        onRefresh={refreshApproval}
        onSignOut={signOut}
      />
    );
  }

  if (!isLoaded) {
    return <FullScreenNotice title="Chargement de Sigma" message="Votre espace d'écriture se prépare." />;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#FFFFFF] text-[#222831] selection:bg-[#FFD369] selection:text-black">
      {/* Sidebar – desktop */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-[#393E46] bg-[#FFFFFF] md:flex">
        <div className="flex items-center gap-3 border-b border-[#393E46] px-4 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded bg-[#FFD369] text-black">
            <Clapperboard size={16} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-lg italic tracking-wide">Sigma</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#222831]/40">
              Assistant de dramaturgie
            </p>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 py-2">
          <button
            onClick={() => setCurrentView('projects')}
            className={cn(
              'flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors',
              currentView === 'projects'
                ? 'bg-[#FFD369] text-[#222831]'
                : 'text-[#222831]/55 hover:bg-[#EEEEEE] hover:text-[#222831]',
            )}
          >
            <FolderOpen size={15} />
            Mes Projets
          </button>

          <div className="mx-4 my-1 border-t border-[#393E46]/20" />

          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id && currentView === 'editor';
            return (
              <button
                key={step.id}
                onClick={() => {
                  setCurrentView('editor');
                  setCurrentStep(step.id);
                }}
                className={cn(
                  'flex items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#FFD369] text-[#222831]'
                    : 'text-[#222831]/55 hover:bg-[#EEEEEE] hover:text-[#222831]',
                )}
              >
                <span className="w-4 shrink-0 text-[10px] opacity-50">{index + 1}.</span>
                <Icon size={15} />
                {step.label}
              </button>
            );
          })}
        </nav>

        <div className="space-y-1.5 border-t border-[#393E46] p-3">
          <span className="block truncate px-1 text-[10px] text-[#393E46]">{userEmail}</span>
          <Button variant="outline" size="sm" className="w-full justify-start border-[#393E46] text-xs uppercase tracking-widest" onClick={saveCurrentProject}>
            <Save size={13} className="mr-2" />
            Sauvegarder
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start border-[#393E46] text-xs uppercase tracking-widest" onClick={exportProject}>
            <Download size={13} className="mr-2" />
            Exporter
          </Button>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="flex-1 justify-start text-xs text-[#222831]/45 hover:text-[#222831]" onClick={resetProject}>
              Effacer
            </Button>
            <Button variant="ghost" size="icon-sm" className="text-[#393E46] hover:text-[#222831]" onClick={signOut} title="Se déconnecter">
              <LogOut size={15} />
            </Button>
          </div>
        </div>
      </aside>

      {/* Contenu principal */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Barre mobile */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#393E46] bg-[#FFFFFF]/90 px-4 py-3 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded bg-[#FFD369] text-black">
              <Clapperboard size={15} />
            </div>
            <h1 className="font-serif text-lg italic tracking-wide">Sigma</h1>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setIsMobileNavOpen((value) => !value)}>
            <Menu size={17} />
          </Button>
        </header>

        <AnimatePresence>
          {isMobileNavOpen && (
            <>
              <motion.div
                className="fixed inset-0 z-40 bg-black/40 md:hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                onClick={() => setIsMobileNavOpen(false)}
              />
              <motion.aside
                className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#393E46] bg-[#FFFFFF] md:hidden"
                initial={{ x: -288 }}
                animate={{ x: 0 }}
                exit={{ x: -288 }}
                transition={{ type: 'tween', duration: 0.22 }}
              >
                <div className="flex items-center justify-between border-b border-[#393E46] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded bg-[#FFD369] text-black">
                      <Clapperboard size={16} />
                    </div>
                    <div>
                      <h1 className="font-serif text-lg italic tracking-wide">Sigma</h1>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#222831]/40">
                        Assistant de dramaturgie
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => setIsMobileNavOpen(false)}>
                    <X size={17} />
                  </Button>
                </div>

                <nav className="flex flex-1 flex-col gap-0.5 py-2">
                  <button
                    onClick={() => { setCurrentView('projects'); setIsMobileNavOpen(false); }}
                    className={cn(
                      'flex items-center gap-2.5 px-4 py-3 text-left text-sm font-medium transition-colors',
                      currentView === 'projects'
                        ? 'bg-[#FFD369] text-[#222831]'
                        : 'text-[#222831]/55 hover:bg-[#EEEEEE] hover:text-[#222831]',
                    )}
                  >
                    <FolderOpen size={15} />
                    Mes Projets
                  </button>

                  <div className="mx-4 my-1 border-t border-[#393E46]/20" />

                  {steps.map((step, index) => {
                    const Icon = step.icon;
                    const isActive = currentStep === step.id && currentView === 'editor';
                    return (
                      <button
                        key={step.id}
                        onClick={() => { setCurrentView('editor'); setCurrentStep(step.id); setIsMobileNavOpen(false); }}
                        className={cn(
                          'flex items-center gap-2.5 px-4 py-3 text-left text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-[#FFD369] text-[#222831]'
                            : 'text-[#222831]/55 hover:bg-[#EEEEEE] hover:text-[#222831]',
                        )}
                      >
                        <span className="w-4 shrink-0 text-[10px] opacity-50">{index + 1}.</span>
                        <Icon size={15} />
                        {step.label}
                      </button>
                    );
                  })}
                </nav>

                <div className="space-y-1.5 border-t border-[#393E46] p-3">
                  <span className="block truncate px-1 text-[10px] text-[#393E46]">{userEmail}</span>
                  <Button variant="outline" size="sm" className="w-full justify-start border-[#393E46] text-xs uppercase tracking-widest" onClick={() => { saveCurrentProject(); setIsMobileNavOpen(false); }}>
                    <Save size={13} className="mr-2" />
                    Sauvegarder
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start border-[#393E46] text-xs uppercase tracking-widest" onClick={() => { exportProject(); setIsMobileNavOpen(false); }}>
                    <Download size={13} className="mr-2" />
                    Exporter
                  </Button>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="flex-1 justify-start text-xs text-[#222831]/45 hover:text-[#222831]" onClick={() => { resetProject(); setIsMobileNavOpen(false); }}>
                      Effacer
                    </Button>
                    <Button variant="ghost" size="icon-sm" className="text-[#393E46] hover:text-[#222831]" onClick={signOut} title="Se déconnecter">
                      <LogOut size={15} />
                    </Button>
                  </div>
                </div>
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-auto">

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
          {currentView === 'projects' ? (
            <ProjectsPage
              projects={savedProjects}
              currentProjectId={currentProjectId}
              onCreateProject={createNewProject}
              onOpenProject={openSavedProject}
              onDeleteProject={deleteSavedProject}
            />
          ) : (
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
                  onAiAnalyze={() => handleAiAnalysis('synopsis')}
                  isAiLoading={isAiLoading}
                  isAnalysisLoading={isAnalysisLoading}
                  suggestions={analysisSuggestions.synopsis}
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
                  onAiAnalyze={() => handleAiAnalysis('developedSynopsis')}
                  isAiLoading={isAiLoading}
                  isAnalysisLoading={isAnalysisLoading}
                  suggestions={analysisSuggestions.developedSynopsis}
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
                  isAnalysisLoading={isAnalysisLoading}
                  suggestions={analysisSuggestions.board}
                  onAiAssist={() => handleAiAssist('board')}
                  onAiAnalyze={() => handleAiAnalysis('board')}
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
                  onAiAnalyze={() => handleAiAnalysis('treatment')}
                  isAiLoading={isAiLoading}
                  isAnalysisLoading={isAnalysisLoading}
                  suggestions={analysisSuggestions.treatment}
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
                  onAiAnalyze={() => handleAiAnalysis('screenplay')}
                  isAiLoading={isAiLoading}
                  isAnalysisLoading={isAnalysisLoading}
                  suggestions={analysisSuggestions.screenplay}
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
          )}
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
      </div>
    </div>
  );
}

function ProjectsPage({
  projects,
  currentProjectId,
  onCreateProject,
  onOpenProject,
  onDeleteProject,
}: {
  projects: SavedProject[];
  currentProjectId: string | null;
  onCreateProject: () => void;
  onOpenProject: (project: SavedProject) => void;
  onDeleteProject: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#393E46] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl italic text-[#222831]">Mes Projets</h2>
          <p className="mt-1 text-sm text-[#393E46]">Retrouvez vos scénarios sauvegardés sur cet appareil.</p>
        </div>
        <Button onClick={onCreateProject} className="bg-[#FFD369] px-4 font-bold text-black hover:bg-[#FFD369]/90">
          <Plus size={16} className="mr-2" />
          Nouveau projet
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card className="flex min-h-[320px] flex-col items-center justify-center border-[#393E46] bg-[#EEEEEE] p-8 text-center">
          <FolderOpen size={44} className="mb-4 text-[#393E46]/50" />
          <p className="font-serif text-xl italic text-[#222831]">Aucun projet sauvegard?</p>
          <p className="mt-2 max-w-md text-sm text-[#393E46]">Créez un projet, puis utilisez le bouton Sauvegarder pour l'ajouter ici.</p>
          <Button onClick={onCreateProject} className="mt-6 bg-[#FFD369] px-4 font-bold text-black hover:bg-[#FFD369]/90">
            <Plus size={16} className="mr-2" />
            Commencer
          </Button>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {projects.map((savedProject) => (
            <Card key={savedProject.id} className="flex min-h-44 flex-col border-[#393E46] bg-[#EEEEEE] p-4 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-serif text-xl italic text-[#222831]">{savedProject.title}</h3>
                  <p className="mt-1 text-xs uppercase tracking-widest text-[#393E46]">
                    {new Date(savedProject.updatedAt).toLocaleDateString('fr-FR', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {currentProjectId === savedProject.id && <Badge className="bg-[#FFD369] text-[#222831]">Ouvert</Badge>}
              </div>

              <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-[#393E46]">
                {savedProject.project.logline || savedProject.project.synopsis || 'Aucune logline renseignée.'}
              </p>

              <div className="mt-auto flex gap-2 pt-5">
                <Button className="flex-1 bg-[#FFD369] font-bold text-black hover:bg-[#FFD369]/90" onClick={() => onOpenProject(savedProject)}>
                  Ouvrir
                </Button>
                <Button variant="outline" size="icon-sm" className="border-[#393E46] text-[#393E46] hover:text-red-500" onClick={() => onDeleteProject(savedProject.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function FullScreenNotice({ title, message }: { title: string; message: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFFFFF] px-4 text-[#222831]">
      <Card className="w-full max-w-md border-[#393E46] bg-[#EEEEEE] p-6 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded bg-[#FFD369] text-black">
          <ShieldCheck size={24} />
        </div>
        <h1 className="font-serif text-2xl italic">{title}</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#393E46]">{message}</p>
      </Card>
    </main>
  );
}

function PendingApprovalPage({
  email,
  message,
  isError,
  onRefresh,
  onSignOut,
}: {
  email: string;
  message: string;
  isError: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#FFFFFF] px-4 text-[#222831]">
      <Card className="w-full max-w-md border-[#393E46] bg-[#EEEEEE] p-6 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded bg-[#FFD369] text-black">
            <ShieldCheck size={22} />
          </div>
          <div>
            <h1 className="font-serif text-2xl italic">Accès en attente</h1>
            <p className="text-xs uppercase tracking-widest text-[#393E46]">Validation manuelle</p>
          </div>
        </div>

        <p className="text-sm leading-relaxed text-[#393E46]">
          Votre compte {email ? <strong className="text-[#222831]">{email}</strong> : null} est créé, mais il doit être approuvé manuellement avant d'accéder à Sigma.
        </p>

        <p className={cn('mt-4 rounded border p-3 text-sm', isError ? 'border-red-500 bg-white text-red-700' : 'border-[#393E46] bg-[#FFFFFF] text-[#393E46]')}>
          {message || "Vous pourrez entrer dans l'application dès que l'administrateur aura activé votre accès dans Supabase."}
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <Button className="bg-[#FFD369] font-bold text-[#222831] hover:bg-[#FFD369]/90" onClick={onRefresh}>
            <RefreshCw size={15} className="mr-2" />
            Vérifier
          </Button>
          <Button variant="outline" className="border-[#393E46]" onClick={onSignOut}>
            <LogOut size={15} className="mr-2" />
            Se déconnecter
          </Button>
        </div>
      </Card>
    </main>
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
  onAiAnalyze,
  isAiLoading,
  isAnalysisLoading,
  suggestions,
}: {
  title: string;
  description: string;
  children: ReactNode;
  onAiAssist?: () => void;
  onAiAnalyze?: () => void;
  isAiLoading?: boolean;
  isAnalysisLoading?: boolean;
  suggestions?: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-[#393E46] pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-3xl italic text-[#222831]">{title}</h2>
          <p className="mt-1 text-sm text-[#393E46]">{description}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button
            variant="outline"
            size="sm"
            className="w-full border-[#393E46] text-xs uppercase tracking-widest text-[#393E46] hover:bg-[#393E46] hover:text-[#FFFFFF] sm:w-auto"
            onClick={onAiAnalyze}
            disabled={isAnalysisLoading || isAiLoading}
          >
            <Lightbulb size={14} className={cn('mr-2', isAnalysisLoading && 'animate-pulse')} />
            {isAnalysisLoading ? 'Analyse...' : 'Pistes IA'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full border-[#393E46] text-xs uppercase tracking-widest text-[#393E46] hover:bg-[#393E46] hover:text-[#FFFFFF] sm:w-auto"
            onClick={onAiAssist}
            disabled={isAiLoading || isAnalysisLoading}
          >
            <Wand2 size={14} className={cn('mr-2', isAiLoading && 'animate-spin')} />
            {isAiLoading ? 'Génération...' : 'Assistant IA'}
          </Button>
        </div>
      </div>

      <div className="min-h-[500px] rounded-lg border border-[#393E46] bg-[#EEEEEE] p-5 shadow-2xl sm:p-10">
        {children}
      </div>

      {suggestions && <SuggestionPanel text={suggestions} />}
    </div>
  );
}

function SuggestionPanel({ text }: { text: string }) {
  return (
    <Card className="border-[#393E46] bg-[#FFFFFF] p-4 shadow-lg">
      <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#393E46]">
        <Lightbulb size={14} />
        Pistes d'amélioration
      </div>
      <div className="whitespace-pre-wrap text-sm leading-relaxed text-[#222831]">{text}</div>
    </Card>
  );
}

function SceneBoard({
  scenes,
  isAiLoading,
  isAnalysisLoading,
  suggestions,
  onAiAssist,
  onAiAnalyze,
  onAddScene,
  onEditScene,
  onRemoveScene,
  onReorderScenes,
}: {
  scenes: Scene[];
  isAiLoading: boolean;
  isAnalysisLoading: boolean;
  suggestions?: string;
  onAiAssist: () => void;
  onAiAnalyze: () => void;
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
          <Button variant="ghost" className="text-xs uppercase tracking-widest text-[#393E46] hover:text-[#222831]" onClick={onAiAnalyze} disabled={isAnalysisLoading || isAiLoading}>
            <Lightbulb size={14} className={cn('mr-2', isAnalysisLoading && 'animate-pulse')} />
            {isAnalysisLoading ? 'Analyse...' : 'Pistes IA'}
          </Button>
          <Button variant="ghost" className="text-xs uppercase tracking-widest text-[#393E46] hover:text-[#222831]" onClick={onAiAssist} disabled={isAiLoading || isAnalysisLoading}>
            <Wand2 size={14} className={cn('mr-2', isAiLoading && 'animate-spin')} />
            Générer
          </Button>
          <Button onClick={onAddScene} className="bg-[#FFD369] px-4 font-bold text-black hover:bg-[#FFD369]/90">
            <Plus size={16} className="mr-2" />
            Nouvelle scène
          </Button>
        </div>
      </div>

      {suggestions && <SuggestionPanel text={suggestions} />}

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






