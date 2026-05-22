/**
 * Fonctions pures liées à l'intégrale dramatique S(t).
 */
import { Scene, SceneType, Project } from '../types';

export const DEFAULT_PROJECT: Project = {
  title: 'Sans titre',
  logline: '',
  synopsis: '',
  developedSynopsis: '',
  scenes: [],
  treatment: '',
  screenplay: '',
  notes: '',
};

export const STEP_ORDER = ['synopsis', 'developedSynopsis', 'board', 'treatment', 'screenplay'] as const;

export function computeIntegrale(scenes: Scene[]): Scene[] {
  let accumulated = 0;
  return scenes.map((scene, i) => {
    const pt    = i === 0 ? 1 : 1 + accumulated / ((i + 1) * 5);
    const delta = Math.abs((scene.vt ?? 0) * pt * (scene.ct ?? 0.5));
    accumulated += delta;
    return { ...scene, st: parseFloat(accumulated.toFixed(2)) };
  });
}

export function vtLabel(vt: number): string {
  if (vt <= -2) return 'Effondrement';
  if (vt <= -1) return 'Chute';
  if (vt < 0)   return 'Recul';
  if (vt === 0) return 'Neutre';
  if (vt < 1)   return 'Avancée';
  if (vt < 2)   return 'Montée';
  return 'Climax';
}

export function ctLabel(ct: number): string {
  if (ct <= 0.2) return 'Faible';
  if (ct <= 0.5) return 'Modérée';
  if (ct <= 0.8) return 'Forte';
  return 'Maximale';
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function getSceneColor(type: SceneType): string {
  switch (type) {
    case SceneType.CLIMAX:            return 'border-red-500';
    case SceneType.RESOLUTION:        return 'border-green-500';
    case SceneType.EXPOSITION:        return 'border-amber-400';
    case SceneType.INCITING_INCIDENT: return 'border-orange-500';
    case SceneType.MIDPOINT:          return 'border-blue-500';
    default:                          return 'border-[#393E46]/30';
  }
}

export function createScene(order: number, overrides: Partial<Scene> = {}): Scene {
  return {
    id: crypto.randomUUID(),
    order,
    title: `Scène ${order + 1}`,
    indications: 'INT. LIEU - JOUR',
    description: '',
    dramaticInfo: '',
    type: SceneType.OTHER,
    vt: 0,
    ct: 0.5,
    ...overrides,
  };
}

export function asMarkdown(project: Project): string {
  const scenes = project.scenes
    .map(
      (scene, i) =>
        `### ${i + 1}. ${scene.title}\n\n- Indications: ${scene.indications || 'Non renseigné'}\n- Type: ${scene.type}\n- Information dramatique: ${scene.dramaticInfo || 'Non renseignée'}\n\n${scene.description || 'Description à compléter.'}`,
    )
    .join('\n\n');

  return `# ${project.title || 'Sans titre'}\n\n## Logline\n${project.logline || 'À compléter.'}\n\n## Synopsis\n${project.synopsis || 'À compléter.'}\n\n## Synopsis développé\n${project.developedSynopsis || 'À compléter.'}\n\n## Scène à scène\n${scenes || 'Aucune scène.'}\n\n## Traitement\n${project.treatment || 'À compléter.'}\n\n## Scénario\n${project.screenplay || 'À compléter.'}\n\n## Notes\n${project.notes || 'Aucune note.'}\n`;
}

export function downloadText(filename: string, text: string): void {
  const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function normalizeProject(value: unknown): Project {
  if (!value || typeof value !== 'object') return DEFAULT_PROJECT;
  const p = value as Partial<Project>;
  return {
    ...DEFAULT_PROJECT,
    ...p,
    scenes: Array.isArray(p.scenes) ? p.scenes : [],
  };
}
