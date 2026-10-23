// Compile le processus principal Electron (electron/main.ts + routes api/) en un seul fichier CommonJS.
// Les variables ALBERT_* de .env.local sont injectées dans le bundle : l'exécutable contient donc la clé.

import { build } from 'esbuild';
import { parse } from 'dotenv';
import fs from 'fs';

const envFile = fs.existsSync('.env.local') ? parse(fs.readFileSync('.env.local')) : {};
const env = Object.fromEntries(
  ['ALBERT_API_KEY', 'ALBERT_MODEL', 'ALBERT_BASE_URL', 'ALBERT_EMBED_MODEL', 'ALBERT_MAX_OUTPUT_TOKENS']
    .map((key) => [key, process.env[key] || envFile[key]])
    .filter(([, value]) => value),
);

if (!env.ALBERT_API_KEY) {
  console.error('ALBERT_API_KEY manquante (.env.local ou variable d\'environnement).');
  process.exit(1);
}

await build({
  entryPoints: ['electron/main.ts'],
  outfile: 'build/electron/main.cjs',
  bundle: true,
  platform: 'node',
  format: 'cjs',
  target: 'node22',
  external: ['electron'],
  define: { __SIGMA_ENV__: JSON.stringify(env) },
  logLevel: 'warning',
});

console.log('Processus principal Electron compilé : build/electron/main.cjs');
