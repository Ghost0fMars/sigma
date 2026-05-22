/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  lazy, Suspense, useEffect, useMemo, useState, type ComponentType,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen, Clapperboard, Download, Edit3, FileText,
  FolderOpen, Info, LayoutDashboard, Library, LogOut,
  Menu, MessageSquare, Save, X,
} from 'lucide-react';

import { Button }   from '@/components/ui/button';
import { Card }     from '@/components/ui/card';
import { Input }    from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn }       from '@/lib/utils';

import { Project, Scene, SceneType, Step, AccessStatus, AppView, ChatMessage, SavedProject } from './types';
import { AuthPage }             from './AuthPage';
import { supabase }             from './supabaseClient';

// ── Lazy-loaded heavy panels ─────────────────────────────────────────────────
const NarratologyPanel     = lazy(() => import('./NarratologyPanel').then((m) => ({ default: m.NarratologyPanel })));
const SceneBoard           = lazy(() => import('./components/SceneBoard').then((m) => ({ default: m.SceneBoard })));
const SceneDialog          = lazy(() => import('./components/SceneDialog').then((m) => ({ default: m.SceneDialog })));
const ChatPanel            = lazy(() => import('./components/ChatPanel').then((m) => ({ default: m.ChatPanel })));
const ImportDocumentDialog = lazy(() => import('./components/ImportDocumentDialog').then((m) => ({ default: m.ImportDocumentDialog })));
const ProjectsPage         = lazy(() => import('./components/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));

// ── Eagerly loaded small utilities ───────────────────────────────────────────
import {
  DEFAULT_PROJECT, STEP_ORDER, computeIntegrale,
  countWords, createScene, asMarkdown, downloadText, normalizeProject,
} from './lib/dramaturgical';
import { Metric }             from './components/Metric';
import { StepContent }        from './components/StepContent';
import { FullScreenNotice }   from './components/FullScreenNotice';
import { PendingApprovalPage} from './components/PendingApprovalPage';

// ─────────────────────────────────────────────────────────────────────────────

const STORAGE_KEY           = 'scriptflow_project';
const PROJECTS_KEY          = 'sigma_projects';
const CURRENT_PROJECT_ID_KEY = 'sigma_current_project_id';

const steps: { id: Step; label: string; icon: ComponentType<{ size?: number; className?: string }> }[] = [
  { id: 'synopsis',          label: 'Synopsis',           icon: BookOpen        },
  { id: 'developedSynopsis', label: 'Synopsis développé', icon: FileText        },
  { id: 'board',             label: 'Scène à scène',       icon: LayoutDashboard },
  { id: 'treatment',         label: 'Traitement',          icon: Edit3           },
  { id: 'screenplay',        label: 'Scénario',            icon: Clapperboard    },
];

function normalizeSavedProjects(value: unknown): SavedProject[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is Partial<SavedProject> => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      id:        typeof item.id        === 'string' ? item.id        : crypto.randomUUID(),
      title:     typeof item.title     === 'string' && item.title.trim() ? item.title : 'Sans titre',
      updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
      project:   normalizeProject(item.project),
    }));
}

function getUserStorageKey(key: string, userId: string) {
  return `${key}:${userId}`;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [project, setProject]               = useState<Project>(DEFAULT_PROJECT);
  const [savedProjects, setSavedProjects]   = useState<SavedProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [currentView, setCurrentView]       = useState<AppView>('editor');
  const [userId, setUserId]                 = useState<string | null>(null);
  const [userEmail, setUserEmail]           = useState('');
  const [accessStatus, setAccessStatus]     = useState<AccessStatus>('checking');
  const [accessMessage, setAccessMessage]   = useState('');
  const [approvalRefreshKey, setApprovalRefreshKey] = useState(0);
  const [isAuthReady, setIsAuthReady]       = useState(false);
  const [currentStep, setCurrentStep]       = useState<Step>('synopsis');
  const [isLoaded, setIsLoaded]             = useState(false);
  const [editingScene, setEditingScene]     = useState<Scene | null>(null);
  const [isAiLoading, setIsAiLoading]       = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [analysisSuggestions, setAnalysisSuggestions] = useState<Partial<Record<Step, string>>>({});
  const [statusMessage, setStatusMessage]   = useState('Sauvegarde locale prête.');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [isChatOpen, setIsChatOpen]         = useState(false);
  const [chatMessages, setChatMessages]     = useState<ChatMessage[]>([]);
  const [isChatLoading, setIsChatLoading]   = useState(false);

  // ── Auth ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!supabase) { setIsAuthReady(true); return; }

    supabase.auth.getSession().then(({ data }) => {
      const user = data.session?.user ?? null;
      setUserId(user?.id ?? null);
      setUserEmail(user?.email ?? '');
      setAccessStatus(user ? 'checking' : 'pending');
      setIsAuthReady(true);
    }).catch(() => { setAccessStatus('pending'); setIsAuthReady(true); });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'TOKEN_REFRESHED') return;
      const user = session?.user ?? null;
      setUserId((prevId) => {
        if (prevId === (user?.id ?? null)) return prevId;
        setUserEmail(user?.email ?? '');
        setAccessStatus(user ? 'checking' : 'pending');
        setAccessMessage('');
        setProject(DEFAULT_PROJECT);
        setSavedProjects([]);
        setCurrentProjectId(null);
        setCurrentView('editor');
        setIsLoaded(false);
        return user?.id ?? null;
      });
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // ── Access check ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthReady || !userId || !supabase) return;
    let cancelled = false;

    (async () => {
      setAccessStatus('checking');
      setAccessMessage('');
      const { data, error } = await supabase.from('user_access').select('status').eq('user_id', userId).maybeSingle();
      if (cancelled) return;

      if (error) {
        setAccessStatus('error');
        setAccessMessage("Impossible de vérifier l'approbation du compte. Exécutez d'abord le SQL dans Supabase.");
        return;
      }
      if (!data) {
        const { error: insertError } = await supabase.from('user_access').insert({ user_id: userId, email: userEmail, status: 'pending' });
        if (cancelled) return;
        if (insertError && insertError.code !== '23505') {
          setAccessStatus('error');
          setAccessMessage("Impossible de créer la demande d'accès. Vérifiez les règles RLS de la table user_access.");
          return;
        }
        setAccessStatus('pending');
        return;
      }
      setAccessStatus(data.status === 'approved' ? 'approved' : 'pending');
    })();

    return () => { cancelled = true; };
  }, [approvalRefreshKey, isAuthReady, userEmail, userId]);

  // ── Load projects ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthReady || !userId || accessStatus !== 'approved') return;

    const projectsKey  = getUserStorageKey(PROJECTS_KEY, userId);
    const currentIdKey = getUserStorageKey(CURRENT_PROJECT_ID_KEY, userId);
    const legacyKey    = getUserStorageKey(STORAGE_KEY, userId);

    const applyProjects = (loaded: SavedProject[]) => {
      const storedId  = localStorage.getItem(currentIdKey);
      const selected  = loaded.find((p) => p.id === storedId) ?? loaded[0];
      if (selected) {
        setProject(selected.project);
        setCurrentProjectId(selected.id);
        setCurrentView('projects');
      } else {
        try {
          const leg = localStorage.getItem(legacyKey);
          setProject(leg ? normalizeProject(JSON.parse(leg)) : DEFAULT_PROJECT);
        } catch { setProject(DEFAULT_PROJECT); }
        setCurrentProjectId(null);
        setCurrentView('editor');
      }
      setSavedProjects(loaded);
      setIsLoaded(true);
    };

    const loadLocal = () => {
      try {
        applyProjects(normalizeSavedProjects(JSON.parse(localStorage.getItem(projectsKey) || '[]')));
      } catch { setStatusMessage('Impossible de relire la liste des projets.'); applyProjects([]); }
    };

    if (!supabase) { loadLocal(); return; }

    supabase.from('projects').select('id, title, updated_at, data').eq('user_id', userId).order('updated_at', { ascending: false })
      .then(({ data, error }) => {
        if (error) { loadLocal(); return; }
        if (!data || data.length === 0) {
          const local = normalizeSavedProjects(JSON.parse(localStorage.getItem(projectsKey) || '[]'));
          if (local.length > 0) {
            supabase.from('projects').upsert(local.map((sp) => ({
              id: sp.id, user_id: userId, title: sp.title, updated_at: sp.updatedAt, data: sp.project,
            }))).then(({ error: e }) => { if (e) console.error('Migration failed', e); });
          }
          applyProjects(local);
          return;
        }
        const loaded: SavedProject[] = data.map((row) => ({
          id: row.id, title: row.title, updatedAt: row.updated_at, project: normalizeProject(row.data),
        }));
        localStorage.setItem(projectsKey, JSON.stringify(loaded));
        applyProjects(loaded);
      });
  }, [accessStatus, isAuthReady, userId]);

  useEffect(() => {
    if (isLoaded && userId && accessStatus === 'approved') {
      localStorage.setItem(getUserStorageKey(STORAGE_KEY, userId), JSON.stringify(project));
    }
  }, [accessStatus, project, isLoaded, userId]);

  // ── Derived stats ─────────────────────────────────────────────────────────
  const progress = useMemo(() => {
    const completed = [
      project.synopsis.trim(), project.developedSynopsis.trim(),
      project.scenes.length > 0 ? 'board' : '',
      project.treatment.trim(), project.screenplay.trim(),
    ].filter(Boolean).length;
    return Math.round((completed / STEP_ORDER.length) * 100);
  }, [project]);

  const sceneStats = useMemo(() => {
    const allText = project.synopsis + project.developedSynopsis + project.treatment + project.screenplay;
    return {
      sceneCount:       project.scenes.length,
      estimatedMinutes: Math.round(project.scenes.length * 1.5),
      wordCount:        countWords(allText),
      screenplayPages:  Math.max(1, Math.ceil(countWords(project.screenplay) / 220)),
    };
  }, [project]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const updateProject = (updates: Partial<Project>) => setProject((prev) => ({ ...prev, ...updates }));

  const persistSavedProjects = (projects: SavedProject[]) => {
    if (!userId) return;
    setSavedProjects(projects);
    localStorage.setItem(getUserStorageKey(PROJECTS_KEY, userId), JSON.stringify(projects));
  };

  const saveCurrentProject = () => {
    if (!userId) return;
    const id    = currentProjectId ?? crypto.randomUUID();
    const now   = new Date().toISOString();
    const title = project.title.trim() || 'Sans titre';
    const saved: SavedProject = { id, title, updatedAt: now, project: { ...project, title } };
    const next  = [saved, ...savedProjects.filter((p) => p.id !== id)];
    setProject(saved.project);
    setCurrentProjectId(id);
    persistSavedProjects(next);
    localStorage.setItem(getUserStorageKey(CURRENT_PROJECT_ID_KEY, userId), id);
    if (supabase) {
      supabase.from('projects').upsert({ id, user_id: userId, title, updated_at: now, data: saved.project })
        .then(({ error }) => setStatusMessage(error ? 'Sauvegardé localement uniquement — synchronisation Supabase échouée.' : 'Projet sauvegardé et synchronisé.'));
    } else { setStatusMessage('Projet sauvegardé localement.'); }
  };

  const openSavedProject = (sp: SavedProject) => {
    if (!userId) return;
    setProject(sp.project); setCurrentProjectId(sp.id); setCurrentStep('synopsis');
    setCurrentView('editor'); setAnalysisSuggestions({});
    localStorage.setItem(getUserStorageKey(CURRENT_PROJECT_ID_KEY, userId), sp.id);
    setStatusMessage('Projet ouvert.');
  };

  const createNewProject = () => {
    setProject({ ...DEFAULT_PROJECT, title: 'Sans titre' }); setCurrentProjectId(null);
    setCurrentStep('synopsis'); setCurrentView('editor'); setAnalysisSuggestions({});
    setStatusMessage('Nouveau projet prêt.');
  };

  const handleImportDocument = async (documentType: string, content: string) => {
    setIsImportLoading(true); setStatusMessage('Reconstruction du projet en cours...');
    try {
      const res  = await fetch('/api/import', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ documentType, content }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Import request failed');
      const raw = data.project ?? {};
      const imported: Project = {
        title:            typeof raw.title            === 'string' ? raw.title            : 'Projet importé',
        logline:          typeof raw.logline          === 'string' ? raw.logline          : '',
        synopsis:         typeof raw.synopsis         === 'string' ? raw.synopsis         : '',
        developedSynopsis:typeof raw.developedSynopsis=== 'string' ? raw.developedSynopsis: '',
        treatment:        typeof raw.treatment        === 'string' ? raw.treatment        : '',
        screenplay:       typeof raw.screenplay       === 'string' ? raw.screenplay       : '',
        notes:            typeof raw.notes            === 'string' ? raw.notes            : '',
        scenes: Array.isArray(raw.scenes) ? raw.scenes.map((s: Partial<Scene>, i: number) =>
          createScene(i, {
            title: s.title || `Scène ${i + 1}`, indications: s.indications || 'INT. LIEU - JOUR',
            description: s.description || '', dramaticInfo: s.dramaticInfo || '',
            type: Object.values(SceneType).includes(s.type as SceneType) ? s.type as SceneType : SceneType.OTHER,
            vt: typeof s.vt === 'number' ? Math.max(-2, Math.min(2, s.vt)) : 0,
            ct: typeof s.ct === 'number' ? Math.max(0,  Math.min(1, s.ct)) : 0.5,
          })) : [],
      };
      setProject(imported); setCurrentProjectId(null); setCurrentStep('synopsis');
      setCurrentView('editor'); setAnalysisSuggestions({}); setIsImportDialogOpen(false);
      setStatusMessage(`Projet « ${imported.title} » reconstruit. Pensez à le sauvegarder.`);
    } catch (err) {
      console.error(err); setStatusMessage("L'import a échoué. Vérifiez OPENAI_API_KEY dans Vercel ou .env.local.");
    } finally { setIsImportLoading(false); }
  };

  const handleSendChatMessage = async (userText: string) => {
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: 'user', content: userText };
    const history = [...chatMessages, userMsg];
    setChatMessages(history); setIsChatLoading(true);
    try {
      const res = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history.map(({ role, content }) => ({ role, content })), project }) });
      let data: Record<string, unknown>;
      try { data = await res.json(); } catch { throw new Error(`Erreur serveur HTTP ${res.status}`); }
      if (!res.ok) throw new Error((data.error as string) || `Erreur HTTP ${res.status}`);
      setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: typeof data.reply === 'string' ? data.reply.trim() : '' }]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Une erreur s'est produite.";
      setChatMessages((prev) => [...prev, { id: crypto.randomUUID(), role: 'assistant', content: `⚠️ ${msg}` }]);
    } finally { setIsChatLoading(false); }
  };

  const deleteSavedProject = (id: string) => {
    if (!window.confirm('Supprimer ce projet sauvegardé ?')) return;
    const next = savedProjects.filter((p) => p.id !== id);
    persistSavedProjects(next);
    if (currentProjectId === id) {
      setCurrentProjectId(null);
      setProject(next[0]?.project ?? DEFAULT_PROJECT);
      if (userId) {
        next[0]
          ? localStorage.setItem(getUserStorageKey(CURRENT_PROJECT_ID_KEY, userId), next[0].id)
          : localStorage.removeItem(getUserStorageKey(CURRENT_PROJECT_ID_KEY, userId));
      }
    }
    if (supabase && userId) {
      supabase.from('projects').delete().eq('id', id).eq('user_id', userId)
        .then(({ error }) => { if (error) console.error('Delete failed', error); });
    }
    setStatusMessage('Projet supprimé.');
  };

  const getStepSnapshot = (stepId: Step): string => {
    const sceneList = project.scenes.map((s, i) =>
      `${i + 1}. ${s.title}\nType: ${s.type}\nIndications: ${s.indications}\nDescription: ${s.description || 'Non renseignée'}\nInformation dramatique: ${s.dramaticInfo || 'Non renseignée'}`
    ).join('\n\n');
    const map: Record<Step, string> = {
      synopsis: project.synopsis || 'Aucun synopsis renseigné.',
      developedSynopsis: project.developedSynopsis || 'Aucun synopsis développé renseigné.',
      board: sceneList || 'Aucune scène renseignée.',
      treatment: project.treatment || 'Aucun traitement renseigné.',
      screenplay: project.screenplay || 'Aucun scénario renseigné.',
    };
    return map[stepId];
  };

  const handleAiAssist = async (stepId: Step) => {
    setIsAiLoading(true); setStatusMessage('Génération IA en cours...');
    try {
      const ctx = `Titre: ${project.title}\nLogline: ${project.logline}\nSynopsis: ${project.synopsis}\nSynopsis développé: ${project.developedSynopsis}\nScènes: ${JSON.stringify(project.scenes)}\nTraitement: ${project.treatment}`;
      const integraleSummary = project.scenes.length > 0
        ? computeIntegrale(project.scenes).map((s, i) => `Scène ${i + 1} "${s.title}": V(t)=${s.vt ?? 0}, C(t)=${s.ct ?? 0.5}, S(t)=${s.st ?? 0}`).join('\n')
        : 'Aucune scène encore définie.';

      const prompts: Record<Step, string> = {
        synopsis: `Tu es script-doctor. Améliore ce synopsis ou propose une base originale si le texte est vide. Réponds uniquement avec le synopsis, en français, en 2 à 4 paragraphes.\n\n${ctx}`,
        developedSynopsis: `Développe le synopsis en récit clair de 500 à 800 mots. Mets en valeur protagoniste, désir, obstacle, escalade, bascule centrale et résolution. Réponds uniquement avec le texte.\n\n${ctx}`,
        board: `Propose un scène à scène de long métrage à partir du projet. Utilise l'intégrale dramatique S(t) = ∫ [V(t) · P(t|τ)] · C(t) dt pour structurer la charge narrative. Réponds uniquement en JSON valide: un tableau de 8 à 12 objets avec title, indications, description, dramaticInfo, type, vt (number -2 à 2), ct (number 0 à 1). Les types autorisés sont: ${Object.values(SceneType).join(', ')}.\n\n${ctx}`,
        treatment: `Écris un traitement cinématographique au présent de l'indicatif à partir du scène à scène. Tiens compte de la dynamique de l'intégrale dramatique:\n${integraleSummary}\nRéponds uniquement avec le traitement.\n\n${ctx}`,
        screenplay: `Transforme le traitement en extrait de scénario professionnel français: intitulés INT./EXT., action au présent, dialogues lisibles. Réponds uniquement avec le scénario.\n\n${ctx}`,
      };

      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt: prompts[stepId] }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OpenAI request failed');
      const newText = typeof data.text === 'string' ? data.text.trim() : '';
      if (!newText) { setStatusMessage("L'IA n'a pas renvoyé de contenu exploitable."); return; }

      if (stepId === 'board') {
        const json = JSON.parse(newText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/```$/i, '')) as Partial<Scene>[];
        updateProject({ scenes: json.map((s, i) => createScene(i, {
          title: s.title || `Scène ${i + 1}`, indications: s.indications || 'INT. LIEU - JOUR',
          description: s.description || '', dramaticInfo: s.dramaticInfo || '',
          type: Object.values(SceneType).includes(s.type as SceneType) ? s.type as SceneType : SceneType.OTHER,
        })) });
      } else { updateProject({ [stepId]: newText }); }
      setStatusMessage('Proposition IA intégrée.');
    } catch (err) {
      console.error(err); setStatusMessage("La génération IA a échoué. Vérifiez OPENAI_API_KEY dans Vercel ou .env.local.");
    } finally { setIsAiLoading(false); }
  };

  const handleAiAnalysis = async (stepId: Step) => {
    setIsAnalysisLoading(true); setStatusMessage('Analyse IA en cours...');
    try {
      const stepLabels: Record<Step, string> = { synopsis: 'Synopsis', developedSynopsis: 'Synopsis développé', board: 'Scène à scène', treatment: 'Traitement', screenplay: 'Scénario' };
      const integraleAnalysis = project.scenes.length > 0
        ? `\nIntégrale dramatique S(t):\n` + computeIntegrale(project.scenes).map((s, i) => `  Scène ${i + 1} "${s.title}": V(t)=${s.vt ?? 0}, C(t)=${s.ct ?? 0.5}, S(t)=${s.st ?? 0}`).join('\n')
        : '';
      const prompt = `Tu es script-doctor et consultant en dramaturgie. Analyse uniquement la page "${stepLabels[stepId]}" de ce projet Sigma.\n\nObjectif: proposer des pistes d'amélioration concrètes sans réécrire le texte à la place de l'auteur.\n\nRéponds en français avec:\n- un diagnostic bref;\n- 5 à 8 pistes d'amélioration actionnables;\n- 2 questions utiles à poser à l'auteur.${stepId === 'board' ? '\n- une analyse de la dynamique S(t).' : ''}\n\nProjet:\nTitre: ${project.title}\nLogline: ${project.logline || 'Non renseignée'}\nNotes: ${project.notes || 'Non renseignées'}\n${integraleAnalysis}\n\nContenu de la page à analyser:\n${getStepSnapshot(stepId)}`;

      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'OpenAI request failed');
      const newText = typeof data.text === 'string' ? data.text.trim() : '';
      if (!newText) { setStatusMessage("L'IA n'a pas renvoyé de pistes exploitables."); return; }
      setAnalysisSuggestions((prev) => ({ ...prev, [stepId]: newText }));
      setStatusMessage("Pistes d'amélioration prêtes.");
    } catch (err) {
      console.error(err); setStatusMessage("L'analyse IA a échoué. Vérifiez OPENAI_API_KEY dans Vercel ou .env.local.");
    } finally { setIsAnalysisLoading(false); }
  };

  const addScene    = () => { const s = createScene(project.scenes.length); updateProject({ scenes: [...project.scenes, s] }); setEditingScene(s); };
  const removeScene = (id: string) => updateProject({ scenes: project.scenes.filter((s) => s.id !== id).map((s, i) => ({ ...s, order: i })) });
  const saveScene   = (scene: Scene) => { updateProject({ scenes: project.scenes.map((s) => (s.id === scene.id ? scene : s)) }); setEditingScene(null); };
  const reorderScenes = (next: Scene[]) => updateProject({ scenes: next.map((s, i) => ({ ...s, order: i })) });

  const resetProject  = () => { if (!window.confirm('Effacer ce projet localement ?')) return; if (userId) localStorage.removeItem(`${STORAGE_KEY}:${userId}`); setProject(DEFAULT_PROJECT); setStatusMessage('Projet réinitialisé.'); };
  const exportProject = () => { const slug = (project.title || 'sigma').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); downloadText(`${slug || 'sigma'}.md`, asMarkdown(project)); setStatusMessage('Export Markdown téléchargé.'); };
  const signOut       = async () => { setAccessStatus('pending'); setAccessMessage(''); await supabase?.auth.signOut(); };
  const refreshApproval = () => setApprovalRefreshKey((v) => v + 1);

  const navigate = (view: AppView, step?: Step) => {
    setCurrentView(view);
    if (step) setCurrentStep(step);
    setIsMobileNavOpen(false);
  };

  // ── Guards ────────────────────────────────────────────────────────────────
  if (!isAuthReady) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a' }}>
        <div style={{ width: 32, height: 32, border: '3px solid #333', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }
  if (!userId)                   return <AuthPage />;
  if (accessStatus === 'checking') return <FullScreenNotice title="Vérification du compte" message="Nous vérifions votre statut d'approbation." />;
  if (accessStatus !== 'approved') return <PendingApprovalPage email={userEmail} message={accessMessage} isError={accessStatus === 'error'} onRefresh={refreshApproval} onSignOut={signOut} />;
  if (!isLoaded)                 return <FullScreenNotice title="Chargement de Sigma" message="Votre espace d'écriture se prépare." />;

  // ── Sidebar nav items ─────────────────────────────────────────────────────
  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      <button
        onClick={() => navigate('projects')}
        className={cn('flex items-center gap-2.5 px-4 text-left text-sm font-medium transition-colors', mobile ? 'py-3' : 'py-2.5',
          currentView === 'projects' ? 'bg-[#FFD369] text-[#222831]' : 'text-[#222831]/55 hover:bg-[#EEEEEE] hover:text-[#222831]')}>
        <FolderOpen size={15} />Mes Projets
      </button>
      <div className="mx-4 my-1 border-t border-[#393E46]/20" />
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = currentStep === step.id && currentView === 'editor';
        return (
          <button key={step.id} onClick={() => navigate('editor', step.id)}
            className={cn('flex items-center gap-2.5 px-4 text-left text-sm font-medium transition-colors', mobile ? 'py-3' : 'py-2.5',
              isActive ? 'bg-[#FFD369] text-[#222831]' : 'text-[#222831]/55 hover:bg-[#EEEEEE] hover:text-[#222831]')}>
            <span className="w-4 shrink-0 text-[10px] opacity-50">{index + 1}.</span>
            <Icon size={15} />{step.label}
          </button>
        );
      })}
      <div className="mx-4 my-1 border-t border-[#393E46]/20" />
      <button onClick={() => navigate('narratology')}
        className={cn('flex items-center gap-2.5 px-4 text-left text-sm font-medium transition-colors', mobile ? 'py-3' : 'py-2.5',
          currentView === 'narratology' ? 'bg-[#FFD369] text-[#222831]' : 'text-[#222831]/55 hover:bg-[#EEEEEE] hover:text-[#222831]')}>
        <Library size={15} />Narratologie
      </button>
    </>
  );

  const SidebarFooter = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="space-y-1.5 border-t border-[#393E46] p-3">
      <span className="block truncate px-1 text-[10px] text-[#393E46]">{userEmail}</span>
      <Button variant="outline" size="sm"
        className={cn('w-full justify-start border-[#393E46] text-xs uppercase tracking-widest', isChatOpen && 'border-[#FFD369] bg-[#FFD369] text-black hover:bg-[#FFD369]/90')}
        onClick={() => { setIsChatOpen((v) => !v); if (mobile) setIsMobileNavOpen(false); }}>
        <MessageSquare size={13} className="mr-2" />Script Doctor
      </Button>
      <Button variant="outline" size="sm" className="w-full justify-start border-[#393E46] text-xs uppercase tracking-widest"
        onClick={() => { saveCurrentProject(); if (mobile) setIsMobileNavOpen(false); }}>
        <Save size={13} className="mr-2" />Sauvegarder
      </Button>
      <Button variant="outline" size="sm" className="w-full justify-start border-[#393E46] text-xs uppercase tracking-widest"
        onClick={() => { exportProject(); if (mobile) setIsMobileNavOpen(false); }}>
        <Download size={13} className="mr-2" />Exporter
      </Button>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="flex-1 justify-start text-xs text-[#222831]/45 hover:text-[#222831]"
          onClick={() => { resetProject(); if (mobile) setIsMobileNavOpen(false); }}>Effacer</Button>
        <Button variant="ghost" size="icon-sm" className="text-[#393E46] hover:text-[#222831]" onClick={signOut} title="Se déconnecter">
          <LogOut size={15} />
        </Button>
      </div>
    </div>
  );

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden bg-[#FFFFFF] text-[#222831] selection:bg-[#FFD369] selection:text-black">
      {/* Desktop sidebar */}
      <aside className="hidden w-52 shrink-0 flex-col border-r border-[#393E46] bg-[#FFFFFF] md:flex">
        <div className="flex items-center gap-3 border-b border-[#393E46] px-4 py-4">
          <div className="flex size-9 shrink-0 items-center justify-center rounded bg-[#FFD369] text-black"><Clapperboard size={16} /></div>
          <div className="min-w-0">
            <h1 className="truncate font-serif text-lg italic tracking-wide">Sigma</h1>
            <p className="text-[10px] font-medium uppercase tracking-widest text-[#222831]/40">Assistant de dramaturgie</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 py-2"><NavItems /></nav>
        <SidebarFooter />
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="flex shrink-0 items-center justify-between border-b border-[#393E46] bg-[#FFFFFF]/90 px-4 py-3 backdrop-blur-md md:hidden">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded bg-[#FFD369] text-black"><Clapperboard size={15} /></div>
            <h1 className="font-serif text-lg italic tracking-wide">Sigma</h1>
          </div>
          <Button variant="ghost" size="icon-sm" onClick={() => setIsMobileNavOpen((v) => !v)}><Menu size={17} /></Button>
        </header>

        {/* Mobile drawer */}
        <AnimatePresence>
          {isMobileNavOpen && (
            <>
              <motion.div className="fixed inset-0 z-40 bg-black/40 md:hidden"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }} onClick={() => setIsMobileNavOpen(false)} />
              <motion.aside className="fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#393E46] bg-[#FFFFFF] md:hidden"
                initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }}
                transition={{ type: 'tween', duration: 0.22 }}>
                <div className="flex items-center justify-between border-b border-[#393E46] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded bg-[#FFD369] text-black"><Clapperboard size={16} /></div>
                    <div>
                      <h1 className="font-serif text-lg italic tracking-wide">Sigma</h1>
                      <p className="text-[10px] font-medium uppercase tracking-widest text-[#222831]/40">Assistant de dramaturgie</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon-sm" onClick={() => setIsMobileNavOpen(false)}><X size={17} /></Button>
                </div>
                <nav className="flex flex-1 flex-col gap-0.5 py-2"><NavItems mobile /></nav>
                <SidebarFooter mobile />
              </motion.aside>
            </>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-auto">
          <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr] lg:px-6">
            {/* Left sidebar */}
            <aside className="space-y-4">
              <Card className="border-[#393E46] bg-[#EEEEEE] p-4">
                <div className="space-y-3">
                  <Input value={project.title} onChange={(e) => updateProject({ title: e.target.value })}
                    className="h-10 border-[#393E46] bg-[#FFFFFF] font-serif text-lg italic" placeholder="Titre du projet" />
                  <Textarea value={project.logline} onChange={(e) => updateProject({ logline: e.target.value })}
                    className="h-24 resize-none border-[#393E46] bg-[#FFFFFF] text-sm leading-relaxed"
                    placeholder="Logline: protagoniste, désir, obstacle, enjeu." />
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
                  <Metric label="Scènes"  value={sceneStats.sceneCount} />
                  <Metric label="Minutes" value={sceneStats.estimatedMinutes} />
                  <Metric label="Mots"    value={sceneStats.wordCount} />
                  <Metric label="Pages"   value={sceneStats.screenplayPages} />
                </div>
              </Card>

              <Card className="border-[#393E46] bg-[#EEEEEE] p-4">
                <label className="text-[10px] font-bold uppercase tracking-widest text-[#393E46]">Notes de travail</label>
                <Textarea value={project.notes} onChange={(e) => updateProject({ notes: e.target.value })}
                  className="mt-3 h-40 resize-none border-[#393E46] bg-[#FFFFFF] text-sm"
                  placeholder="Questions, pistes de réécriture, références..." />
              </Card>
            </aside>

            {/* Main content */}
            <section className="min-w-0">
              <Suspense fallback={<div className="flex h-64 items-center justify-center text-sm text-[#393E46]/50">Chargement…</div>}>
                {currentView === 'narratology' ? (
                  <NarratologyPanel />
                ) : currentView === 'projects' ? (
                  <ProjectsPage
                    projects={savedProjects} currentProjectId={currentProjectId}
                    onCreateProject={createNewProject} onOpenProject={openSavedProject}
                    onDeleteProject={deleteSavedProject} onImportDocument={() => setIsImportDialogOpen(true)} />
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div key={currentStep}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.18 }}>
                      {currentStep === 'synopsis' && (
                        <StepContent title="Synopsis" description="Le coeur de votre histoire résumé en quelques paragraphes."
                          onAiAssist={() => handleAiAssist('synopsis')} onAiAnalyze={() => handleAiAnalysis('synopsis')}
                          isAiLoading={isAiLoading} isAnalysisLoading={isAnalysisLoading} suggestions={analysisSuggestions.synopsis}>
                          <Textarea placeholder="Une phrase simple suffit pour commencer: quelqu'un veut quelque chose, mais..."
                            className="min-h-[420px] resize-none border-none bg-transparent p-0 text-lg leading-relaxed shadow-none focus-visible:ring-0"
                            value={project.synopsis} onChange={(e) => updateProject({ synopsis: e.target.value })} />
                        </StepContent>
                      )}
                      {currentStep === 'developedSynopsis' && (
                        <StepContent title="Synopsis développé" description="Approfondissez l'intrigue, les personnages et les arcs dramatiques."
                          onAiAssist={() => handleAiAssist('developedSynopsis')} onAiAnalyze={() => handleAiAnalysis('developedSynopsis')}
                          isAiLoading={isAiLoading} isAnalysisLoading={isAnalysisLoading} suggestions={analysisSuggestions.developedSynopsis}>
                          <Textarea placeholder="Décrivez l'évolution de l'intrigue en détail..."
                            className="min-h-[520px] resize-none border-none bg-transparent p-0 text-lg leading-relaxed shadow-none focus-visible:ring-0"
                            value={project.developedSynopsis} onChange={(e) => updateProject({ developedSynopsis: e.target.value })} />
                        </StepContent>
                      )}
                      {currentStep === 'board' && (
                        <SceneBoard scenes={project.scenes} isAiLoading={isAiLoading} isAnalysisLoading={isAnalysisLoading}
                          suggestions={analysisSuggestions.board}
                          onAiAssist={() => handleAiAssist('board')} onAiAnalyze={() => handleAiAnalysis('board')}
                          onAddScene={addScene} onEditScene={setEditingScene}
                          onRemoveScene={removeScene} onReorderScenes={reorderScenes} />
                      )}
                      {currentStep === 'treatment' && (
                        <StepContent title="Traitement" description="Narratif au présent de l'indicatif. Donnez vie aux actions, au rythme et aux nuances."
                          onAiAssist={() => handleAiAssist('treatment')} onAiAnalyze={() => handleAiAnalysis('treatment')}
                          isAiLoading={isAiLoading} isAnalysisLoading={isAnalysisLoading} suggestions={analysisSuggestions.treatment}>
                          <Textarea placeholder="Jean entre dans la pièce. Il sent la tension monter..."
                            className="min-h-[520px] resize-none border-none bg-transparent p-0 text-lg leading-relaxed shadow-none focus-visible:ring-0"
                            value={project.treatment} onChange={(e) => updateProject({ treatment: e.target.value })} />
                        </StepContent>
                      )}
                      {currentStep === 'screenplay' && (
                        <StepContent title="Scénario" description="Version au format de lecture: séquences, action, dialogues."
                          onAiAssist={() => handleAiAssist('screenplay')} onAiAnalyze={() => handleAiAnalysis('screenplay')}
                          isAiLoading={isAiLoading} isAnalysisLoading={isAnalysisLoading} suggestions={analysisSuggestions.screenplay}>
                          <div className="mx-auto min-h-[760px] max-w-3xl rounded-sm bg-white p-6 font-mono text-[15px] leading-tight text-black shadow-2xl sm:p-12">
                            <Textarea placeholder={'INT. BUREAU - JOUR\n\nJEAN est assis à son bureau...'}
                              className="min-h-[680px] resize-none whitespace-pre-wrap border-none bg-transparent p-0 font-mono shadow-none focus-visible:ring-0"
                              value={project.screenplay} onChange={(e) => updateProject({ screenplay: e.target.value })} />
                          </div>
                        </StepContent>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </Suspense>
            </section>
          </main>

          {/* Dialogs (lazy) */}
          <Suspense fallback={null}>
            {editingScene && (
              <SceneDialog scene={editingScene} onClose={() => setEditingScene(null)}
                onChange={setEditingScene} onSave={saveScene} />
            )}
            <ImportDocumentDialog open={isImportDialogOpen} isLoading={isImportLoading}
              onClose={() => setIsImportDialogOpen(false)} onImport={handleImportDocument} />
            <ChatPanel open={isChatOpen} messages={chatMessages} isLoading={isChatLoading}
              onClose={() => setIsChatOpen(false)} onSend={handleSendChatMessage} onClear={() => setChatMessages([])} />
          </Suspense>

          <footer className="mx-auto mb-6 mt-4 flex max-w-7xl items-center justify-center gap-2 px-6 text-center text-[10px] uppercase tracking-widest text-[#222831]/35">
            <Info size={10} />{statusMessage}
          </footer>
        </div>
      </div>
    </div>
  );
}
