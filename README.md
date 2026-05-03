# Sigma

Assistant d'Ã©criture de scÃ©nario construit avec React, Vite et OpenAI.

## FonctionnalitÃ©s

- Parcours d'Ã©criture en cinq Ã©tapes: synopsis, synopsis dÃ©veloppÃ©, scÃ¨ne Ã  scÃ¨ne, traitement, scÃ©nario.
- Fiche projet avec titre, logline, notes de travail et progression.
- Tableau de scÃ¨nes rÃ©ordonnable avec types dramatiques, indications, description et information clÃ©.
- Assistance IA par Ã©tape, y compris gÃ©nÃ©ration structurÃ©e du scÃ¨ne Ã  scÃ¨ne.
- Sauvegarde automatique dans le navigateur.
- Export Markdown complet du projet.

## Lancer localement

PrÃ©requis: Node.js.

1. Installez les dÃ©pendances:
   `npm install`
2. CrÃ©ez un fichier `.env.local` avec votre clÃ© OpenAI:
   `OPENAI_API_KEY=votre_cle_openai`\n   `VITE_SUPABASE_URL=https://votre-projet.supabase.co`\n   `VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase`
3. Lancez l'application:
   `npm run dev`

L'application est servie par dÃ©faut sur [http://localhost:3000](http://localhost:3000).

## Sur Windows avec VS Code

Si `npm run dev` est bloquÃ© par PowerShell, lancez plutÃ´t:

`npm.cmd run dev`

Pour ouvrir directement le projet dans VS Code, double-cliquez sur `open-in-vscode.cmd`.

Vous pouvez aussi utiliser la tÃ¢che VS Code:

1. Ouvrez le dossier du projet dans VS Code.
2. Appuyez sur `Ctrl+Shift+P`.
3. Choisissez `Tasks: Run Task`.
4. Lancez `Lancer Sigma`.

Alternative simple: double-cliquez sur `start-auteur.cmd` Ã  la racine du projet, puis ouvrez [http://localhost:3000](http://localhost:3000).

## DÃ©ployer sur Vercel

RÃ©glages Vercel recommandÃ©s:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Ajoutez aussi les variables d'environnement dans Vercel:

- `OPENAI_API_KEY`: votre clÃ© OpenAI
- `OPENAI_MODEL`: optionnel, par dÃ©faut `gpt-5`

La clÃ© OpenAI reste cÃ´tÃ© serveur via la fonction Vercel `/api/generate`; elle n'est pas injectÃ©e dans le navigateur.

## Scripts

- `npm run dev`: serveur de dÃ©veloppement Vite.
- `npm run build`: build de production.
- `npm run lint`: vÃ©rification TypeScript.
- `npm run clean`: supprime le dossier `dist`.
## Configurer Supabase

1. Créez un projet sur Supabase.
2. Dans `Authentication > Providers`, activez `Email`.
3. Pour un test rapide, vous pouvez désactiver la confirmation email dans `Authentication > Sign In / Providers > Email`.
4. Copiez `Project URL` et `anon public key` depuis `Project Settings > API`.
5. Ajoutez ces deux valeurs dans Vercel avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

Les projets d'écriture restent pour l'instant sauvegardés dans le navigateur, mais isolés par utilisateur connecté. Une prochaine étape pourra synchroniser les projets dans une table Supabase.