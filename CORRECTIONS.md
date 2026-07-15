# SIGMA — Corrections et améliorations à traiter

Ce document liste les problèmes identifiés lors d'une revue de code de SIGMA, classés par priorité. Traite-les dans l'ordre — chaque section indique les fichiers concernés, le problème précis, et le résultat attendu.

---

## Priorité 1 — Unifier le corpus théorique (l'IA n'a accès qu'à une version appauvrie)

**Problème :** trois copies indépendantes du même corpus de références narratologiques coexistent, désynchronisées :

- `src/narratology-data.ts` (288 lignes, 13 auteurs : Aristote, Propp, Greimas, Todorov, Genette, Barthes, Ricœur, Bremond, Frye, Campbell, McKee, Truby, Lavallard) — la version la plus riche, structurée en `concepts` + `useInScreenwriting`, mais utilisée uniquement par `src/NarratologyPanel.tsx` (panneau de consultation statique, déconnecté de l'IA).
- `lib/dramaturgical-system.ts` (139 lignes, les mêmes 13 auteurs en prose) — **code mort**, n'est importé par aucun fichier du projet (vérifié : `grep -rn "from '.*lib/dramaturgical-system"` ne renvoie rien).
- `api/_dramaturgical-system.ts` (76 lignes, seulement 6 auteurs : Aristote, McKee, Truby, Frye, Campbell, Lavallard) — **c'est la seule version réellement injectée dans les prompts IA**, via `DRAMATURGICAL_REFERENCES` importé dans `api/generate.ts`, `api/chat.ts` et `api/import.ts`.

Conséquence : quand un utilisateur clique sur « Pistes IA » ou parle au Script Doctor, l'IA n'a jamais accès à Propp, Greimas, Todorov, Genette, Barthes, Ricœur ou Bremond — alors que ce contenu existe déjà, rédigé, dans `narratology-data.ts`.

**À faire :**
1. Choisir `src/narratology-data.ts` comme source de vérité unique (c'est la plus complète et la plus structurée).
2. Générer à partir de cette structure de données le texte injecté dans les prompts (une fonction qui sérialise `NARRATOLOGY_THEORIES` en prose, un peu comme le fait actuellement `DRAMATURGICAL_REFERENCES` à la main) — ou, a minima, réécrire `api/_dramaturgical-system.ts` pour qu'il contienne les 13 auteurs et reste synchronisé manuellement avec `narratology-data.ts` (ajouter un commentaire d'avertissement en tête des deux fichiers renvoyant l'un à l'autre).
3. Supprimer `lib/dramaturgical-system.ts` (code mort, source de confusion future) une fois la fusion faite.
4. Vérifier que le build Vercel passe toujours après ce changement (l'historique git montre qu'un problème de bundling Vercel avait motivé la duplication initiale dans `api/` — commits `f93deb8` et `13c5327` — donc bien retester le déploiement, pas seulement `npm run build` en local).

---

## Priorité 2 — Empêcher la perte de travail silencieuse via « Assistant IA »

**Problème :** dans `src/App.tsx`, la fonction `handleAiAssist` (autour de la ligne 375) écrase directement le champ en cours (`synopsis`, `developedSynopsis`, `treatment`, `screenplay`, ou `scenes` pour l'étape `board`) via `updateProject({ [stepId]: newText })`, sans confirmation ni sauvegarde préalable du contenu existant. Comme la sauvegarde est automatique (`localStorage`), la perte est immédiate et irréversible. Le bouton est en plus visuellement adjacent à « Pistes IA » (`onAiAnalyze`), qui lui n'écrase rien — le risque de clic malheureux est réel. À titre de comparaison, `resetProject` et `deleteSavedProject` (mêmes fichier) utilisent déjà `window.confirm`.

**À faire :**
1. Dans `handleAiAssist`, si le champ ciblé contient déjà du texte non vide (ou des scènes existantes pour `board`), afficher une confirmation avant d'écraser — réutiliser le pattern `window.confirm` déjà présent ailleurs dans le fichier, ou mieux, un vrai composant de dialogue de confirmation (voir `components/ui/dialog.tsx`, déjà utilisé par `SceneDialog` et `ImportDocumentDialog`).
2. Ajouter un minimum d'historique : conserver la dernière version d'un champ avant écrasement par l'IA (par exemple un `Partial<Project>` `previousVersion` en state, avec un bouton « Annuler la dernière génération » dans `StepContent.tsx` / `SceneBoard.tsx`). Pas besoin d'un vrai système de versioning multi-niveaux pour l'instant — un seul niveau d'undo suffit à couvrir le risque principal.
3. Vérifier que ce comportement est cohérent pour l'étape `board` (qui remplace tout `project.scenes`, pas juste un champ texte).

---

## Priorité 3 — Fiabiliser et rendre visible l'état de synchronisation Supabase

**Problème :** dans `src/App.tsx`, `saveCurrentProject` écrit d'abord en `localStorage` puis tente un `upsert` Supabase en best-effort ; en cas d'échec, seul `statusMessage` (texte discret en pied de page) informe l'utilisateur (« Sauvegardé localement uniquement — synchronisation Supabase échouée »). Rien n'indique de façon persistante, dans l'UI (ex. `ProjectsPage.tsx`), qu'un projet donné n'est *que* local et pas synchronisé — un changement de navigateur ou un cache vidé peut faire perdre un projet sans avertissement clair au moment critique.

**À faire :**
1. Ajouter un indicateur visuel par projet dans `ProjectsPage.tsx` (ex. badge « Local uniquement » vs « Synchronisé ») en stockant un statut de sync sur chaque `SavedProject`.
2. Dans `App.tsx`, retenter automatiquement la synchronisation Supabase au chargement pour tout projet marqué « non synchronisé » (actuellement, un échec n'est retenté qu'au prochain `saveCurrentProject` manuel).
3. Mettre à jour le README (section « Données & confidentialité » / feuille de route) pour refléter que la synchronisation Supabase est déjà partiellement implémentée, et non plus seulement « envisagée ».

---

## Priorité 4 (optionnel, quand le reste est stable)

- **Formule S(t)** (`computeIntegrale` dans `src/lib/dramaturgical.ts`) : `pt = 1 + accumulated / ((i+1)*5)` est une pondération ad hoc. Envisager de relier la forme cible de la courbe au mythos de Frye choisi par l'auteur (comédie / romance / tragédie / ironie — cadre déjà présent dans `narratology-data.ts`), plutôt qu'une seule formule universelle.
- **Export** : seul le Markdown est proposé en sortie (`asMarkdown` dans `src/lib/dramaturgical.ts`), alors que l'import accepte déjà `.fountain` et `.fdx` (`ImportDocumentDialog.tsx`). Envisager un export Fountain a minima, pour la symétrie.
- **PWA hors-ligne** : le README indique un mode hors-ligne « partiel ». Clarifier dans l'UI ce qui fonctionne réellement sans connexion (l'IA ne le peut pas, par construction) pour éviter toute confusion utilisateur.
- **Taille de `src/App.tsx`** (697 lignes) : envisager d'extraire la logique en hooks dédiés (`useProjects`, `useAiActions`, `useAuth`) pour préparer la suite du développement — pas urgent, mais à garder en tête avant d'ajouter de nouvelles fonctionnalités.

---

## Ordre de traitement recommandé

1. Priorité 1 (corpus théorique) — impact direct sur la qualité de toutes les réponses IA.
2. Priorité 2 (confirmation avant écrasement) — évite une perte de travail utilisateur.
3. Priorité 3 (visibilité de la sync) — évite une perte de travail silencieuse à plus long terme.
4. Priorité 4 — améliorations une fois le socle sécurisé.
