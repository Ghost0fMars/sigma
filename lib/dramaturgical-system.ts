/**
 * Système dramaturgique de référence — Sigma
 * Injecté dans tous les endpoints IA pour ancrer les analyses
 * dans les grandes théories narratives.
 */

export const DRAMATURGICAL_REFERENCES = `
## CADRES THÉORIQUES DE RÉFÉRENCE

### ARISTOTE — Poétique
- Unité d'action : une seule intrigue principale, cohérente et complète
- Structure : début (mise en place), milieu (complications), fin (résolution)
- Péripétie (peripeteia) : retournement inattendu de situation
- Anagnorisis : reconnaissance — le héros comprend ce qu'il ignorait
- Catharsis : purification émotionnelle du spectateur par pitié et terreur
- Hamartia : la faille tragique du héros qui cause sa chute
- Le climax doit être à la fois surprenant ET inévitable

### MCKEE — Story
- Le beat est l'unité minimale dramatique : un comportement/action qui change une valeur
- Valeur dramatique : chaque scène doit faire basculer quelque chose (+ vers −, ou − vers +)
- La scène = désir du personnage VS obstacle — sans conflit, pas de scène
- L'acte = grande inversion de valeur dramatique
- Le gap : l'écart entre ce que le personnage attend et ce qui se produit crée le suspense
- Principe d'escalade : chaque obstacle doit être plus grand que le précédent
- Le climax est obligatoire, irréversible, et révèle le vrai caractère du protagoniste

### TRUBY — Anatomy of Story (22 étapes)
- Faiblesse psychologique → besoin moral (ce que le héros doit apprendre)
- Désir : objectif externe que le héros poursuit consciemment
- L'antagoniste révèle et amplifie la faiblesse du héros — ce n'est pas un obstacle mais un miroir
- Plan : comment le héros compte atteindre son désir
- Le moment de révélation (self-revelation) : le héros comprend sa vraie nature
- Nouvelle équilibre : le monde après la transformation
- La structure des 22 étapes n'est pas linéaire — certaines peuvent être simultanées

### NORTHROP FRYE — Anatomy of Criticism
- 4 mythos fondamentaux liés aux saisons :
  * Comédie (printemps) : intégration sociale, réconciliation, S(t) cyclique
  * Romance (été) : quête, aventure, idéalisation, S(t) maximale avant retour
  * Tragédie (automne) : chute inévitable, isolement, S(t) ouverte sans résolution
  * Ironie/Satire (hiver) : désenchantement, anti-héros, S(t) plate ou descendante
- Le genre détermine la dynamique de S(t) : identifier le mythos aide à calibrer V(t) et C(t)

### CAMPBELL — Le Héros aux Mille Visages (Monomythe)
- Acte 1 — DÉPART : monde ordinaire → appel → refus → mentor → franchissement du seuil
- Acte 2 — INITIATION : épreuves → alliés/ennemis → caverne secrète → épreuve suprême → récompense
- Acte 3 — RETOUR : chemin du retour → résurrection → retour avec l'élixir
- Le héros revient transformé — il rapporte quelque chose au monde ordinaire
- L'ombre (antagoniste) est souvent le reflet sombre du héros

### INTÉGRALE DRAMATIQUE S(t) — Lavallard
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
4. Cherche l'ANAGNORISIS — à quel moment le héros (et le spectateur) comprend-il ?
5. Calibre V(t) et C(t) pour que S(t) monte progressivement avec le mythos choisi
6. Le climax doit être surprenant ET inévitable (Aristote)
`;

export const SCENE_TYPES_LIST =
  'Exposition, Incident Déclencheur, Noeud Dramatique 1, Point de Pression 1, Milieu, Point de Pression 2, Noeud Dramatique 2, Climax, Résolution, Autre';
