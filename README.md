# Sigma

Assistant d'Ã©criture de scÃ©nario construit avec React, Vite et Gemini.

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
2. CrÃ©ez un fichier `.env.local` avec votre clÃ©:
   `GEMINI_API_KEY=votre_cle`
3. Lancez l'application:
   `npm run dev`

L'application est servie par dÃ©faut sur [http://localhost:3000](http://localhost:3000).

### Sur Windows avec VS Code

Si `npm run dev` est bloquÃ© par PowerShell, lancez plutÃ´t:

`npm.cmd run dev`

Pour ouvrir directement le projet dans VS Code, double-cliquez sur `open-in-vscode.cmd`.

Vous pouvez aussi utiliser la tÃ¢che VS Code:

1. Ouvrez le dossier du projet dans VS Code.
2. Appuyez sur `Ctrl+Shift+P`.
3. Choisissez `Tasks: Run Task`.
4. Lancez `Lancer Sigma`.

Alternative simple: double-cliquez sur `start-auteur.cmd` Ã  la racine du projet, puis ouvrez [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev`: serveur de dÃ©veloppement Vite.
- `npm run build`: build de production.
- `npm run lint`: vÃ©rification TypeScript.
- `npm run clean`: supprime le dossier `dist`.
## Déployer sur Vercel

Réglages Vercel recommandés:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Ajoutez aussi la variable d'environnement dans Vercel:

- `GEMINI_API_KEY`: votre clé Gemini

Note: dans cette version, la clé Gemini est injectée au build côté client. Pour une mise en production publique, il faudra idéalement déplacer les appels IA derrière une API serveur afin de ne pas exposer la clé dans le navigateur.
