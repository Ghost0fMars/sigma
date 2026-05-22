/**
 * Système dramaturgique de référence — Sigma
 * Injecté dans tous les endpoints IA pour ancrer les analyses
 * dans les grandes théories narratives.
 */

export const DRAMATURGICAL_REFERENCES = `
## CADRES THÉORIQUES DE RÉFÉRENCE

### ARISTOTE — Poétique (~335 av. J.-C.)
- Mimèsis : le récit imite des actions vraisemblables et nécessaires
- Muthos (intrigue) : l'agencement des faits prime sur les personnages
- Unité d'action : une seule intrigue principale, cohérente et complète
- Péripétie (peripeteia) : retournement inattendu de situation
- Anagnorisis : reconnaissance — le héros comprend ce qu'il ignorait
- Catharsis : purification émotionnelle du spectateur par pitié et terreur
- Hamartia : la faille/erreur de jugement du héros qui cause sa chute
- Le climax doit être à la fois surprenant ET inévitable

### PROPP — Morphologie du conte (1928)
- 31 fonctions narratives universelles (éloignement → méfait → départ → épreuve → récompense → retour)
- 7 sphères d'action : Méchant / Donateur / Auxiliaire / Princesse (objet recherché) / Mandateur / Héros / Faux héros
- La morphologie est invariante : les fonctions se succèdent toujours dans le même ordre
- L'agent magique : objet ou être obtenu après un test moral, qui dote le héros d'un pouvoir
- Application : identifier les sphères d'action aide à diagnostiquer les archétypes manquants dans un cast

### GREIMAS — Modèle actantiel (1966)
- 6 actants en 3 axes :
  * Axe du désir : Sujet (protagoniste) ↔ Objet (ce qu'il cherche)
  * Axe de la communication : Destinateur (mandataire/motivation) → Sujet → Destinataire (bénéficiaire)
  * Axe du pouvoir : Adjuvant (alliés, outils) ↔ Opposant (tout ce qui fait obstacle)
- Programme narratif : le Sujet cherche à se conjoindre (obtenir) ou disjoindre (perdre/libérer) de l'Objet
- Carré sémiotique : cartographie des oppositions idéologiques profondes d'un récit
- Application : clarifier qui veut quoi, qui aide et qui bloque — outil de diagnostic des conflits flous

### TODOROV — Grammaire narrative (1969)
- Structure en 5 temps : Équilibre initial → Perturbation → Reconnaissance → Tentative de remédiation → Nouvel équilibre
- Proposition narrative : attribut d'état ou verbe d'action — les briques de base du récit
- Transformations : négation, passage à l'acte, opposition, présupposition
- Le nouvel équilibre diffère toujours de l'initial : le monde et/ou le personnage ont été transformés
- Application : la grammaire narrative est le test le plus rapide pour vérifier qu'un scénario a une structure lisible

### GENETTE — Discours du récit (1972)
- Trois niveaux : histoire (chronologie des événements) / récit (texte tel que raconté) / narration (acte de raconter)
- Ordre : analepse (flash-back) et prolepse (flash-forward) — portée et durée variables
- Vitesse narrative : scène (1:1) / sommaire (compression) / ellipse (saut) / pause (description) / ralentissement
- Fréquence : singulatif / itératif / répétitif
- Focalisation zéro (omniscient) / interne (avec le personnage) / externe (béhavioriste)
- Voix narrative : homodiégétique (narrateur présent) vs hétérodiégétique (narrateur absent)
- Métalepse : transgression des niveaux narratifs (l'auteur entre dans le récit, ou le personnage en sort)
- Application : indispensable pour discuter de structure temporelle, de point de vue et de voix off

### BARTHES — Codes narratifs / S/Z (1970)
- Code herméneutique (voix de l'énigme) : questions posées, retardées, résolues — moteur du suspense
- Code proaïrétique (voix de l'empirie) : séquences d'actions enchaînées — la mécanique narrative
- Code sémique (voix de la personne) : connotations et traits de caractère construits par accumulation
- Code symbolique : oppositions binaires profondes (vie/mort, masculin/féminin, dedans/dehors)
- Code culturel/référentiel : savoirs et codes culturels qui créent l'effet de réel
- Texte lisible (fermé, à consommer) vs texte scriptible (ouvert, à co-produire)
- Application : analyser le sous-texte d'une scène — une ligne de dialogue peut activer plusieurs codes simultanément

### RICOEUR — Temps et Récit (1983–1985)
- Mimésis I (Préfiguration) : compréhension pratique du monde avant l'acte de raconter
- Mimésis II (Configuration) : mise en intrigue — organisation des événements en un tout temporel signifiant
- Mimésis III (Refiguration) : réception par le spectateur — le récit refigure son expérience du temps
- Concordance discordante : l'intrigue réconcilie des événements hétérogènes (retournements, surprises) en une unité de sens
- Identité narrative : se raconter, c'est se constituer comme personnage d'une histoire — fondement de l'arc
- Distension temporelle : l'âme est tiraillée entre mémoire (passé), attention (présent) et attente (futur)
- Application : éclaire l'impact émotionnel durable — une fin ou un flash-back jouent sur la distension temporelle du spectateur

### BREMOND — Logique du récit (1973)
- Séquence élémentaire en 3 temps : virtualité (possibilité s'ouvre) → actualisation/non-actualisation → résultat
- Loi du ventail : à chaque moment, plusieurs chemins sont possibles — le spectateur perçoit les alternatives non choisies
- Amélioration (protection, remédiation, acquisition) vs dégradation (menace, frustration, perte)
- Agent (initie et accomplit) vs Patient (subit une transformation imposée)
- Jonction de séquences : enchaînement / emboîtement / alternance
- Application : construire la tension par le principe du ventail — une scène sans alternatives perçues est une scène sans tension

### MCKEE — Story (1997)
- Le beat est l'unité minimale dramatique : un comportement/action qui change une valeur
- Valeur dramatique : chaque scène doit faire basculer quelque chose (+ vers −, ou − vers +)
- La scène = désir du personnage VS obstacle — sans conflit, pas de scène
- L'acte = grande inversion de valeur dramatique
- Le gap : l'écart entre ce que le personnage attend et ce qui se produit crée le suspense
- Principe d'escalade : chaque obstacle doit être plus grand que le précédent
- Le climax est obligatoire, irréversible, et révèle le vrai caractère du protagoniste

### TRUBY — Anatomy of Story (2007)
- Faiblesse psychologique → besoin moral (ce que le héros doit apprendre)
- Désir : objectif externe que le héros poursuit consciemment
- L'antagoniste révèle et amplifie la faiblesse du héros — ce n'est pas un obstacle mais un miroir
- Plan : comment le héros compte atteindre son désir
- Le moment de révélation (self-revelation) : le héros comprend sa vraie nature
- Nouvelle équilibre : le monde après la transformation
- La structure des 22 étapes n'est pas linéaire — certaines peuvent être simultanées

### NORTHROP FRYE — Anatomy of Criticism (1957)
- 4 mythos fondamentaux liés aux saisons :
  * Comédie (printemps) : intégration sociale, réconciliation, S(t) cyclique
  * Romance (été) : quête, aventure, idéalisation, S(t) maximale avant retour
  * Tragédie (automne) : chute inévitable, isolement, S(t) ouverte sans résolution
  * Ironie/Satire (hiver) : désenchantement, anti-héros, S(t) plate ou descendante
- Le genre détermine la dynamique de S(t) : identifier le mythos aide à calibrer V(t) et C(t)

### CAMPBELL — Le Héros aux Mille Visages / Monomythe (1949)
- Acte 1 — DÉPART : monde ordinaire → appel → refus → mentor → franchissement du seuil
- Acte 2 — INITIATION : épreuves → alliés/ennemis → caverne secrète → épreuve suprême → récompense
- Acte 3 — RETOUR : chemin du retour → résurrection → retour avec l'élixir
- Le héros revient transformé — il rapporte quelque chose au monde ordinaire
- L'ombre (antagoniste) est souvent le reflet sombre du héros

### INTÉGRALE DRAMATIQUE S(t) — Lavallard (2024)
S(t) = ∫ [V(t) · P(t|τ)] · C(t) dt

- V(t) : valeur de l'acte de −2 (effondrement) à +2 (climax positif)
- C(t) = Ci(t) × Ce(t) : pression contextuelle (0 à 1)
  * Ci(t) : contexte interne — faille morale, arc psychologique du personnage
  * Ce(t) : contexte externe — pression sociale, antagonisme, enjeux du monde
- P(t|τ) : poids rétroactif (Nachträglichkeit freudien) — chaque révélation recalcule le poids des actes passés
- S(t) : charge dramatique accumulée — quand elle franchit un seuil critique, un événement majeur émerge
- La courbe S(t) doit progresser avec des tensions et détentes — pas de plateau trop long, pas de chute trop brutale sans préparation
- L'intégrale est FRACTALE : la même structure se retrouve au niveau du beat, de la scène, de l'acte, du film entier

## COMMENT UTILISER CES CADRES

Quand tu analyses ou génères :
1. Identifie d'abord le MYTHOS dominant (Frye) — il détermine la dynamique S(t) cible
2. Vérifie que chaque scène a une VALEUR DRAMATIQUE qui bascule (McKee)
3. Assure-toi que l'antagoniste révèle la FAIBLESSE du héros (Truby)
4. Cherche l'ANAGNORISIS — à quel moment le héros (et le spectateur) comprend-il ? (Aristote)
5. Identifie les ACTANTS du récit : qui est le Sujet, l'Objet, le Destinateur ? (Greimas)
6. Vérifie la STRUCTURE TEMPORELLE : analepses, prolepses, rythme de la narration (Genette)
7. Cherche les CODES ACTIFS dans chaque scène : herméneutique (mystère), proaïrétique (action), sémique (caractère) (Barthes)
8. Calibre V(t) et C(t) pour que S(t) monte progressivement avec le mythos choisi (Intégrale Dramatique)
9. Le climax doit être surprenant ET inévitable — concordance discordante (Aristote + Ricoeur)
`;

export const SCENE_TYPES_LIST =
  'Exposition, Incident Déclencheur, Noeud Dramatique 1, Point de Pression 1, Milieu, Point de Pression 2, Noeud Dramatique 2, Climax, Résolution, Autre';
