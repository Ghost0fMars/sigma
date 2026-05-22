# Sigma

Assistant d'écriture de scénario construit avec React, Vite et OpenAI.

## Fonctionnalités

- Parcours d'écriture en cinq étapes: synopsis, synopsis développé, scène à scène, traitement, scénario.
- Fiche projet avec titre, logline, notes de travail et progression.
- Tableau de scènes réordonnable avec types dramatiques, indications, description et information clé.
- Assistance IA par étape, y compris génération structurée du scène à scène.
- Sauvegarde automatique dans le navigateur.
- Export Markdown complet du projet.

## Lancer localement

Prérequis: Node.js.

1. Installez les dépendances:
   `npm install`
2. Créez un fichier `.env.local` avec votre clé OpenAI:
   `OPENAI_API_KEY=votre_cle_openai`\n   `VITE_SUPABASE_URL=https://votre-projet.supabase.co`\n   `VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase`
3. Lancez le serveur API dans un premier terminal:
   `npm run api`
4. Lancez l'application dans un second terminal:
   `npm run dev`

L'application est servie par défaut sur [http://localhost:3000](http://localhost:3000).

## Sur Windows avec VS Code

Si `npm run dev` est bloqué par PowerShell, lancez plutôt:

`npm.cmd run dev`

Pour ouvrir directement le projet dans VS Code, double-cliquez sur `open-in-vscode.cmd`.

Vous pouvez aussi utiliser la tâche VS Code:

1. Ouvrez le dossier du projet dans VS Code.
2. Appuyez sur `Ctrl+Shift+P`.
3. Choisissez `Tasks: Run Task`.
4. Lancez `Lancer Sigma`.

Alternative simple: double-cliquez sur `start-auteur.cmd` à la racine du projet, puis ouvrez [http://localhost:3000](http://localhost:3000).

## Déployer sur Vercel

Réglages Vercel recommandés:

- Framework Preset: `Vite`
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

Ajoutez aussi les variables d'environnement dans Vercel:

- `OPENAI_API_KEY`: votre clé OpenAI
- `OPENAI_MODEL`: optionnel, par défaut `gpt-5`

La clé OpenAI reste côté serveur via la fonction Vercel `/api/generate`; elle n'est pas injectée dans le navigateur.

## Scripts

- `npm run dev`: serveur de développement Vite.
- `npm run build`: build de production.
- `npm run lint`: vérification TypeScript.
- `npm run clean`: supprime le dossier `dist`.
## Configurer Supabase

1. Créez un projet sur Supabase.
2. Dans `Authentication > Providers`, activez `Email`.
3. Pour un test rapide, vous pouvez désactiver la confirmation email dans `Authentication > Sign In / Providers > Email`.
4. Copiez `Project URL` et `anon public key` depuis `Project Settings > API`.
5. Ajoutez ces deux valeurs dans Vercel avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.

Les projets d'écriture restent pour l'instant sauvegardés dans le navigateur, mais isolés par utilisateur connecté. Une prochaine étape pourra synchroniser les projets dans une table Supabase.
## Approbation manuelle des comptes

Sigma laisse les utilisateurs créer un compte Supabase, mais bloque l'accès ? l'application tant que leur compte n'est pas approuvé.

1. Dans Supabase, ouvrez `SQL Editor`.
2. Collez et exécutez le contenu de `supabase/manual-approval.sql`.
3. Laissez les inscriptions activées dans `Authentication > Providers > Email`.
4. Quand un utilisateur s'inscrit, ouvrez `Table Editor > profiles`.
5. Passez sa colonne `approved` de `false` à `true` pour autoriser l'accès.

Tant que `approved` vaut `false`, l'utilisateur voit une page d'attente dans Sigma.
## Installer Sigma comme application

Sigma est une PWA: après déploiement sur Vercel, elle peut être installée comme une application sur ordinateur et mobile.

- Sur Chrome ou Edge ordinateur: ouvrez Sigma, puis cliquez sur l'icône d'installation dans la barre d'adresse.
- Sur Android: ouvrez Sigma dans Chrome, menu `⋮`, puis `Ajouter à l'écran d'accueil` ou `Installer l'application`.
- Sur iPhone/iPad: ouvrez Sigma dans Safari, bouton de partage, puis `Sur l'écran d'accueil`.

L'app fonctionne en mode installé et garde l'écran principal disponible hors connexion. Les fonctions IA et Supabase nécessitent une connexion internet.
