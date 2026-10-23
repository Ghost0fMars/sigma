/**
 * Régénère api/_dramaturgical-system.ts à partir de src/narratology-data.ts
 * (source de vérité unique du corpus narratologique).
 *
 * Usage : npm run sync-dramaturgical
 *
 * Pourquoi un fichier généré plutôt qu'un import direct depuis api/ ?
 * Vercel ne bundle pas correctement les imports situés hors du dossier
 * api/ pour ses fonctions serverless (voir commits f93deb8 et 13c5327).
 * On génère donc un fichier statique, autonome, colocalisé dans api/
 * (préfixé `_` pour ne pas devenir un endpoint), plutôt que de réintroduire
 * une dépendance cross-dossier au runtime.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { serializeTheoriesToPrompt } from '../src/narratology-data.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, '..', 'api', '_dramaturgical-system.ts');

const SCENE_TYPES_LIST =
  'Exposition, Incident Déclencheur, Noeud Dramatique 1, Point de Pression 1, Milieu, Point de Pression 2, Noeud Dramatique 2, Climax, Résolution, Autre';

function generate(): string {
  const prose = serializeTheoriesToPrompt();

  return `/**
 * Système dramaturgique de référence — Sigma
 * Injecté dans tous les endpoints IA pour ancrer les analyses
 * dans les grandes théories narratives.
 *
 * FICHIER GÉNÉRÉ — ne pas éditer à la main.
 * Source : src/narratology-data.ts (NARRATOLOGY_THEORIES)
 * Régénérer avec : npm run sync-dramaturgical
 */

export const DRAMATURGICAL_REFERENCES = \`
${prose}
\`;

export const SCENE_TYPES_LIST =
  '${SCENE_TYPES_LIST}';
`;
}

function main() {
  const content = generate();
  fs.writeFileSync(OUTPUT_PATH, content, 'utf-8');
  console.log(`✓ ${path.relative(process.cwd(), OUTPUT_PATH)} régénéré depuis src/narratology-data.ts`);
}

main();
