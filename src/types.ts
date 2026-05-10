/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum SceneType {
  EXPOSITION = 'Exposition',
  INCITING_INCIDENT = 'Incident Déclencheur',
  PLOT_POINT_1 = 'Noeud Dramatique 1',
  PINCH_POINT_1 = 'Point de Pression 1',
  MIDPOINT = 'Milieu',
  PINCH_POINT_2 = 'Point de Pression 2',
  PLOT_POINT_2 = 'Noeud Dramatique 2',
  CLIMAX = 'Climax',
  RESOLUTION = 'Résolution',
  OTHER = 'Autre',
}

export interface Scene {
  id: string;
  order: number;
  title: string;
  indications: string;
  description: string;
  dramaticInfo: string;
  type: SceneType;
  // Intégrale dramatique S(t) = ∫ [V(t) · P(t|τ)] · C(t) dt
  vt: number;   // Valeur de l'acte : -2 (très négatif) à +2 (très positif)
  ct: number;   // Pression contextuelle : 0 (nulle) à 1 (maximale)
  st?: number;  // Charge dramatique accumulée (calculée automatiquement)
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
