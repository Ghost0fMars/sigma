/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum SceneType {
  EXPOSITION         = 'Exposition',
  INCITING_INCIDENT  = 'Incident Déclencheur',
  PLOT_POINT_1       = 'Noeud Dramatique 1',
  PINCH_POINT_1      = 'Point de Pression 1',
  MIDPOINT           = 'Milieu',
  PINCH_POINT_2      = 'Point de Pression 2',
  PLOT_POINT_2       = 'Noeud Dramatique 2',
  CLIMAX             = 'Climax',
  RESOLUTION         = 'Résolution',
  OTHER              = 'Autre',
}

export interface Scene {
  id: string;
  order: number;
  title: string;
  indications: string;
  description: string;
  dramaticInfo: string;
  type: SceneType;
  vt: number;   // Valeur de l'acte : -2 à +2
  ct: number;   // Pression contextuelle : 0 à 1
  st?: number;  // Charge dramatique accumulée (calculée)
}

export interface Project {
  title: string;
  logline: string;
  synopsis: string;
  developedSynopsis: string;
  scenes: Scene[];
  treatment: string;
  screenplay: string;
  notes: string;
}

export type Step = 'synopsis' | 'developedSynopsis' | 'board' | 'treatment' | 'screenplay';

export type AccessStatus = 'checking' | 'pending' | 'approved' | 'error';
export type AppView      = 'projects' | 'editor' | 'narratology';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

export type SavedProject = {
  id: string;
  title: string;
  updatedAt: string;
  project: Project;
};
