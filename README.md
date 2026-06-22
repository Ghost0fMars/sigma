# SIGMA

**Système Intelligent Génératif et Méthodique Assisté**

Assistant d'écriture de scénario qui accompagne l'auteur du synopsis au scénario complet, étape par étape, avec une assistance IA à chaque palier. Construit avec React, Vite, TypeScript et OpenAI.

> 🧪 **Bêta.** SIGMA est en cours de développement. Des aspérités sont attendues — les retours sont bienvenus.

🌐 [sigma.alacle.org](https://sigma.alacle.org)

---

## Cadre théorique : l'Intégrale Dramatique

SIGMA est le versant **cinéma** d'un projet de recherche-création articulé autour d'un modèle original, l'**Intégrale Dramatique** :

```
S(t) = ∫₀ᵗ [V(τ) · P(t|τ)] · C(t) dτ
```

Ce modèle pose qu'un récit et un parcours d'apprentissage obéissent au même opérateur : une tension (ou un sens) **S(t)** s'accumule dans le temps, et un opérateur de rétroaction **P(t|τ)** — l'anagnorisis d'Aristote, l'après-coup — réévalue rétroactivement la valeur des évènements passés au moment du climax.

L'ambition de SIGMA est de mettre ce modèle au travail sur le terrain scénaristique : cartographier la tension accumulée **S(t)** le long d'un scénario, et donner à voir la friction (le tenseur de contexte **C**) entre la psyché des personnages et les contraintes du monde. Les fonctionnalités décrites ci-dessous en constituent la base concrète ; la cartographie dramatique complète est l'horizon de développement.

> SIGMA a un jumeau côté pédagogie : **SAGE**, qui applique le même modèle à la conception de séances. Voir [github.com/Ghost0fMars/sage](https://github.com/Ghost0fMars/sage).

---

## Fonctionnalités

- Parcours d'écriture en **cinq étapes** : synopsis, synopsis développé, scène à scène, traitement, scénario.
- **Fiche projet** : titre, logline, notes de travail et progression.
- **Tableau de scènes réordonnable** : types dramatiques, indications, description et information clé.
- **Assistance IA par étape**, dont la génération structurée du scène à scène.
- **Sauvegarde automatique** dans le navigateur, isolée par utilisateur connecté.
- **Export Markdown** complet du projet.
- **PWA** : installable sur ordinateur et mobile, écran principal disponible hors connexion.

---

## Stack technique

- **React** + **Vite** + **TypeScript**
- **shadcn/ui** (composants)
- **OpenAI** via une fonction serverless Vercel (`/api/generate`)
- **Supabase** — authentification (e-mail) et approbation manuelle des comptes
- **Vercel** — hébergement et fonctions serverless
- **PWA** — installation et mode hors-ligne partiel

---

## Lancer localement

**Prérequis :** Node.js 18+.

1. Installez les dépendances :

```bash
npm install
```

2. Créez un fichier `.env.local` à la racine (ignoré par git, à ne **jamais** committer) :

```env
# Clé OpenAI — reste côté serveur (fonction Vercel /api/generate), non exposée au navigateur
OPENAI_API_KEY=votre_cle_openai
OPENAI_MODEL=gpt-5

# Supabase — exposées au client via le préfixe VITE_ (la clé anon est publique par conception)
VITE_SUPABASE_URL=https://votre-projet.supabase.co
VITE_SUPABASE_ANON_KEY=votre_cle_anon_supabase
```

> 🔐 La clé OpenAI **ne doit pas** porter le préfixe `VITE_` : seules les variables `VITE_*` sont injectées dans le bundle client. La garder sans préfixe la maintient côté serveur.

3. Lancez l'application :

```bash
npm run dev
```

Servie par défaut sur [http://localhost:3000](http://localhost:3000).

### Sur Windows avec VS Code

Si `npm run dev` est bloqué par PowerShell, lancez plutôt `npm.cmd run dev`.

Pour ouvrir le projet dans VS Code, double-cliquez sur `open-in-vscode.cmd`. Vous pouvez aussi utiliser la tâche VS Code : `Ctrl+Shift+P` → `Tasks: Run Task` → `Lancer Sigma`.

Alternative : double-cliquez sur `start-auteur.cmd`, puis ouvrez [http://localhost:3000](http://localhost:3000).

---

## Configurer Supabase

1. Créez un projet sur [supabase.com](https://supabase.com).
2. Dans `Authentication > Providers`, activez `Email`.
3. Pour un test rapide, vous pouvez désactiver la confirmation e-mail dans `Authentication > Sign In / Providers > Email`.
4. Copiez `Project URL` et `anon public key` depuis `Project Settings > API`.
5. Renseignez `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` (en local dans `.env.local`, en production dans Vercel).

Les projets d'écriture sont pour l'instant sauvegardés dans le navigateur, isolés par utilisateur connecté. Une synchronisation vers une table Supabase est envisagée (voir feuille de route).

### Approbation manuelle des comptes

SIGMA laisse les utilisateurs créer un compte, mais bloque l'accès à l'application tant que le compte n'est pas approuvé.

1. Dans Supabase, ouvrez `SQL Editor`.
2. Exécutez le contenu de `supabase/manual-approval.sql`.
3. Laissez les inscriptions activées dans `Authentication > Providers > Email`.
4. À chaque inscription, ouvrez `Table Editor > profiles`.
5. Passez la colonne `approved` de `false` à `true` pour autoriser l'accès.

Tant que `approved` vaut `false`, l'utilisateur voit une page d'attente.

---

## Déployer sur Vercel

Réglages recommandés :

- **Framework Preset** : `Vite`
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

Variables d'environnement à ajouter dans Vercel : `OPENAI_API_KEY`, `OPENAI_MODEL` (optionnel, défaut `gpt-5`), `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

La clé OpenAI reste côté serveur via la fonction `/api/generate` ; elle n'est pas injectée dans le navigateur. Les fonctions IA et Supabase nécessitent une connexion internet.

---

## Installer SIGMA comme application (PWA)

Après déploiement, SIGMA s'installe comme une application :

- **Chrome / Edge (ordinateur)** : icône d'installation dans la barre d'adresse.
- **Android** : menu `⋮` → `Ajouter à l'écran d'accueil` / `Installer l'application`.
- **iPhone / iPad** : bouton de partage dans Safari → `Sur l'écran d'accueil`.

---

## Scripts

```bash
npm run dev      # serveur de développement Vite
npm run build    # build de production
npm run lint     # vérification TypeScript
npm run clean    # supprime le dossier dist
```

---

## Données & confidentialité

SIGMA manipule deux types de données : vos **projets d'écriture** (stockés localement dans votre navigateur) et, si vous créez un compte, votre **e-mail d'authentification** (géré par Supabase). Aucune donnée tierce sensible n'est traitée. Les textes envoyés à l'IA transitent par l'API OpenAI le temps de la génération.

---

## Feuille de route

- [ ] **Cartographie de la tension dramatique S(t)** le long du scénario (visualisation de l'Intégrale Dramatique).
- [ ] Modélisation du **tenseur de contexte C** : friction entre trajectoires des personnages et antagonisme du monde.
- [ ] Synchronisation optionnelle des projets vers Supabase.

---

## Licence

Ce projet est distribué sous licence **GNU Affero General Public License v3.0 (AGPL-3.0)**. Voir le fichier [`LICENSE`](./LICENSE).

Copyright (C) 2026 Étienne — [àlaclé](https://alacle.org)

En résumé :

- Vous êtes libre d'utiliser, d'étudier, de modifier et de redistribuer SIGMA.
- **Toute version modifiée et redistribuée doit elle-même rester ouverte sous AGPL-3.0** — y compris si elle est mise à disposition via un service en réseau (l'AGPL ferme le « trou SaaS » : héberger une version modifiée oblige à en publier le code source). C'est particulièrement pertinent ici, SIGMA étant déployé comme application web.
- Les mentions de copyright doivent être conservées et les modifications signalées.
- Le logiciel est fourni « tel quel », sans aucune garantie.

Ce choix garantit que SIGMA **reste libre et ouvert pour toujours** : personne ne peut s'en saisir pour en faire une version fermée et propriétaire.

> En tant que titulaire des droits, l'auteur conserve la liberté d'utiliser SIGMA selon d'autres modalités. L'AGPL ne lie que les tiers.

---

## Auteur

Développé par Étienne dans le cadre de [àlaclé](https://alacle.org), comme artefact de recherche-création.

🌐 [alacle.org](https://alacle.org)
