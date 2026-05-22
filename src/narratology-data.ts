export interface NarratologyConcept {
  name: string;
  definition: string;
}

export interface NarratologyTheory {
  id: string;
  author: string;
  work: string;
  year: string;
  tradition: string;
  summary: string;
  concepts: NarratologyConcept[];
  useInScreenwriting?: string;
}

export const TRADITIONS = [
  'Tous',
  'Philosophie',
  'Formalisme',
  'Structuralisme',
  'Post-structuralisme',
  'Phénoménologie',
  'Mythologie',
  'Dramaturgie',
] as const;

export const NARRATOLOGY_THEORIES: NarratologyTheory[] = [
  {
    id: 'aristote',
    author: 'Aristote',
    work: 'Poétique',
    year: '~335 av. J.-C.',
    tradition: 'Philosophie',
    summary:
      'Premier traité systématique sur la mimèsis, la tragédie et la structure dramatique. Aristote définit les composantes essentielles d\'une histoire efficace — unité, causalité, catharsis — qui restent fondatrices pour le scénario.',
    concepts: [
      { name: 'Mimèsis', definition: 'Imitation de l\'action humaine : le récit représente des actions vraisemblables et nécessaires, pas forcément réelles.' },
      { name: 'Muthos (intrigue)', definition: 'L\'agencement des faits — la plus importante des six parties de la tragédie. L\'intrigue prime sur les personnages.' },
      { name: 'Hamartia', definition: 'Faille ou erreur de jugement du héros qui précipite sa chute. Ce n\'est pas un défaut moral, mais une erreur aux conséquences irréversibles.' },
      { name: 'Péripétie (peripeteia)', definition: 'Retournement de situation inattendu — ce qui semblait mener au succès mène à l\'échec, ou inversement.' },
      { name: 'Anagnorisis', definition: 'Moment de reconnaissance : le héros (et le spectateur) découvre une vérité cachée qui transforme la compréhension de l\'ensemble.' },
      { name: 'Catharsis', definition: 'Purification émotionnelle du spectateur par la pitié et la terreur. L\'art tragique libère des émotions que la vie ordinaire retient.' },
      { name: 'Unité d\'action', definition: 'Une seule intrigue principale, complète et cohérente. Les parties doivent être disposées de sorte que l\'enlèvement ou le déplacement de l\'une défasse le tout.' },
      { name: 'Climax surprenant et inévitable', definition: 'Le dénouement doit naître de la logique interne du récit — surprendre, mais paraître rétrospectivement nécessaire.' },
    ],
    useInScreenwriting: 'Le modèle aristotélicien est le squelette de tout scénario de structure classique. L\'hamartia, la péripétie et l\'anagnorisis structurent l\'arc du protagoniste.',
  },
  {
    id: 'propp',
    author: 'Vladimir Propp',
    work: 'Morphologie du conte',
    year: '1928',
    tradition: 'Formalisme',
    summary:
      'Propp démontre que tous les contes de fées russes partagent la même structure : 31 fonctions narratives et 7 types de personnages. Son analyse préfigure la narratologie structurale et le modèle de Campbell.',
    concepts: [
      { name: 'Fonction narrative', definition: 'Unité d\'action définie par son rôle dans le déroulement, indépendamment de qui l\'accomplit. Il en existe 31 (éloignement, interdiction, transgression, méfait, départ, récompense…).' },
      { name: 'Les 7 sphères d\'action', definition: 'Méchant — Donateur (fournit l\'agent magique) — Auxiliaire (aide le héros) — Princesse/personnage recherché — Mandateur (envoie le héros) — Héros — Faux héros (prétend aux mérites du héros).' },
      { name: 'Méfait (villainy)', definition: 'Fonction centrale qui met l\'intrigue en mouvement : le méchant cause un tort (enlèvement, meurtre, vol) ou un manque apparaît dans la famille du héros.' },
      { name: 'Agent magique', definition: 'Objet ou être qui dote le héros d\'un pouvoir supplémentaire, généralement obtenu après un test moral auprès du donateur.' },
      { name: 'Transformation (transfiguration)', definition: 'Le héros acquiert une nouvelle apparence ou statut avant le dénouement — signe de sa métamorphose intérieure exprimmée extérieurement.' },
      { name: 'Morphologie', definition: 'L\'étude des formes : Propp montre que la structure (séquence de fonctions) est invariante même quand les personnages et les décors varient infiniment.' },
    ],
    useInScreenwriting: 'Utile pour identifier les archétypes de personnages dans une histoire de genre (aventure, fantastique, super-héros). Les 7 sphères d\'action se retrouvent dans Star Wars, Le Seigneur des Anneaux, etc.',
  },
  {
    id: 'greimas',
    author: 'Algirdas Julien Greimas',
    work: 'Sémantique structurale',
    year: '1966',
    tradition: 'Structuralisme',
    summary:
      'Greimas propose un modèle actantiel universel à six cases pour décrire la structure profonde de tout récit. Inspiré de Propp et de la linguistique de Saussure, il permet d\'analyser les relations de force entre personnages.',
    concepts: [
      { name: 'Modèle actantiel', definition: '6 actants en 3 axes : Sujet ↔ Objet (axe du désir/quête) ; Destinateur → Sujet → Destinataire (axe de la communication) ; Adjuvant ↔ Opposant (axe du pouvoir).' },
      { name: 'Sujet', definition: 'L\'actant qui désire l\'Objet et accomplit le programme narratif. Correspond généralement au protagoniste.' },
      { name: 'Objet', definition: 'Ce que le Sujet cherche à atteindre ou à posséder — peut être une personne, une valeur, un état (liberté, amour, pouvoir).' },
      { name: 'Destinateur', definition: 'Actant qui motive ou mandate le Sujet (une société, un père, une loi, une conviction morale). Donne sens à la quête.' },
      { name: 'Destinataire', definition: 'Celui qui bénéficiera de l\'accomplissement de la quête — souvent le Sujet lui-même, mais parfois une communauté.' },
      { name: 'Adjuvant', definition: 'Actant qui aide le Sujet dans sa quête (allié, mentor, outil). Peut changer de rôle au fil du récit.' },
      { name: 'Opposant', definition: 'Actant qui s\'oppose à la réalisation de la quête — pas forcément l\'antagoniste au sens moral, mais tout ce qui fait obstacle.' },
      { name: 'Programme narratif', definition: 'La transformation d\'état que le Sujet cherche à accomplir : conjonction avec l\'Objet (obtenir) ou disjonction (perdre/libérer).' },
      { name: 'Carré sémiotique', definition: 'Représentation des relations logiques entre une catégorie et ses contraires et contradictoires (S / non-S / anti-S / non-anti-S). Permet de cartographier les oppositions idéologiques d\'un récit.' },
    ],
    useInScreenwriting: 'Le modèle actantiel clarifie instantanément qui veut quoi, qui aide et qui bloque. Indispensable pour diagnostiquer un manque de conflit ou une relation de personnages trop vague.',
  },
  {
    id: 'todorov',
    author: 'Tzvetan Todorov',
    work: 'Grammaire du Décaméron',
    year: '1969',
    tradition: 'Structuralisme',
    summary:
      'Todorov applique la linguistique structurale au récit : une histoire est une transformation de propositions narratives, de l\'équilibre initial à un nouvel équilibre, en passant par la perturbation. Sa grammaire narrative est la plus simple et la plus universellement applicable.',
    concepts: [
      { name: 'Équilibre initial', definition: 'État de stabilité au début du récit. Le monde est en ordre — même si cet ordre est injuste ou fragile.' },
      { name: 'Perturbation', definition: 'Événement qui rompt l\'équilibre initial. C\'est l\'incident déclencheur : une force extérieure ou un désir interne bouleverse le statu quo.' },
      { name: 'Reconnaissance de la perturbation', definition: 'Les personnages prennent conscience que quelque chose a changé et que l\'état d\'avant est perdu.' },
      { name: 'Tentative de remédiation', definition: 'Action entreprise pour rétablir l\'équilibre — c\'est le cœur du développement dramatique.' },
      { name: 'Nouvel équilibre', definition: 'Résolution : un équilibre est rétabli, mais il diffère de l\'état initial. Le monde (ou le personnage) a été transformé.' },
      { name: 'Proposition narrative', definition: 'Unité minimale du récit — soit un attribut (état d\'un personnage), soit un verbe d\'action (ce qu\'un personnage fait).' },
      { name: 'Transformation narrative', definition: 'Passage d\'une proposition à sa modification : négation (passe à son contraire), passage à l\'acte, opposition, présupposition.' },
    ],
    useInScreenwriting: 'La grammaire de Todorov est l\'outil le plus rapide pour vérifier qu\'un scénario a une structure lisible. L\'équilibre → perturbation → nouvel équilibre est la colonne vertébrale de tout acte dramatique.',
  },
  {
    id: 'genette',
    author: 'Gérard Genette',
    work: 'Figures III / Discours du récit',
    year: '1972',
    tradition: 'Structuralisme',
    summary:
      'Genette construit la narratologie discursive moderne en distinguant trois niveaux (histoire, récit, narration) et cinq catégories d\'analyse du récit. Il offre une terminologie précise pour décrire comment une histoire est racontée, et pas seulement ce qu\'elle raconte.',
    concepts: [
      { name: 'Histoire / Récit / Narration', definition: 'Trois niveaux : l\'histoire (les événements dans l\'ordre chronologique), le récit (le texte tel qu\'il est raconté), la narration (l\'acte de raconter).' },
      { name: 'Analepse (flash-back)', definition: 'Retour en arrière : le récit raconte un événement antérieur à l\'action présente. Portée (amplitude temporelle) et durée variables.' },
      { name: 'Prolepse (flash-forward)', definition: 'Anticipation : le récit mentionne ou montre un événement futur avant qu\'il n\'arrive. Crée attente, ironie dramatique ou suspense.' },
      { name: 'Vitesse narrative', definition: 'Rapport entre la durée de l\'histoire et la longueur du texte. Modes : scène (1:1), sommaire (compression), ellipse (saut), pause (description), ralentissement (dilatation).' },
      { name: 'Fréquence', definition: 'Rapport entre les occurrences dans l\'histoire et les mentions dans le récit. Singulatif (raconté une fois ce qui arrive une fois), itératif (une fois / plusieurs fois), répétitif (plusieurs fois / une fois).' },
      { name: 'Focalisation zéro', definition: 'Narrateur omniscient : il en sait plus que les personnages. Vision "par derrière".' },
      { name: 'Focalisation interne', definition: 'Narrateur limité à la conscience d\'un personnage : il sait autant que lui. Vision "avec" le personnage.' },
      { name: 'Focalisation externe', definition: 'Narrateur béhavioriste : il en sait moins que les personnages, ne voit que les comportements extérieurs. Vision "du dehors".' },
      { name: 'Voix narrative', definition: 'Qui raconte ? Narrateur homodiégétique (présent dans l\'histoire), hétérodiégétique (absent), extradiégétique (hors de tout niveau diégétique).' },
      { name: 'Métalepse', definition: 'Transgression des niveaux narratifs : l\'auteur entre dans son récit, ou un personnage sort de sa fiction. Effet perturbateur sur la frontière entre monde réel et monde narratif.' },
    ],
    useInScreenwriting: 'La terminologie de Genette est incontournable pour discuter de la structure temporelle d\'un scénario (analepses, prolepses), du point de vue (qui sait quoi ?) et de la voix off.',
  },
  {
    id: 'barthes',
    author: 'Roland Barthes',
    work: 'S/Z',
    year: '1970',
    tradition: 'Post-structuralisme',
    summary:
      'Dans S/Z, Barthes analyse la nouvelle de Balzac Sarrasine en la décomposant lexie par lexie selon cinq codes narratifs. Il distingue le texte "lisible" (classique, fermé, à consommer) du texte "scriptible" (moderne, ouvert, à produire). Un outil puissant pour l\'analyse de l\'implicite et du sous-texte.',
    concepts: [
      { name: 'Code herméneutique (voix de l\'énigme)', definition: 'Tout ce qui pose une question, retarde sa réponse et finalement la résout (ou pas). C\'est le moteur du suspense et du mystère.' },
      { name: 'Code proaïrétique (voix de l\'empirie)', definition: 'Séquences d\'actions : une action déclenche l\'attente d\'une autre. C\'est la mécanique narrative, le fil de l\'intrigue.' },
      { name: 'Code sémique (voix de la personne)', definition: 'Connotations et traits de caractère associés à un personnage ou un lieu par accumulation de détails. Construit l\'identité sans la nommer.' },
      { name: 'Code symbolique', definition: 'Oppositions binaires profondes (masculin/féminin, vie/mort, dedans/dehors) qui structurent le sens du texte à un niveau symbolique.' },
      { name: 'Code culturel / référentiel', definition: 'Savoirs, proverbes, maximes et références culturelles convoqués par le texte. Crée un effet de réel et ancre l\'histoire dans un monde reconnaissable.' },
      { name: 'Texte lisible (readerly)', definition: 'Texte classique dont le sens est déjà fait, que le lecteur consomme passivement. La signification est arrêtée.' },
      { name: 'Texte scriptible (writerly)', definition: 'Texte qui invite le lecteur à produire du sens, à co-écrire. Les fins ouvertes, les ellipses radicales, l\'ambiguïté sont des marques du scriptible.' },
    ],
    useInScreenwriting: 'Les cinq codes permettent d\'analyser la densité sous-textuelle d\'une scène. Un dialogue peut activer simultanément le code herméneutique (que cache ce personnage ?), sémique (quel trait révèle-t-il ?) et symbolique (quelle opposition rejoue-t-il ?).',
  },
  {
    id: 'ricoeur',
    author: 'Paul Ricoeur',
    work: 'Temps et Récit (3 vol.)',
    year: '1983–1985',
    tradition: 'Phénoménologie',
    summary:
      'Ricoeur articule le temps et le récit : c\'est parce que l\'existence humaine est temporelle que nous racontons des histoires, et c\'est grâce aux récits que nous comprenons notre propre temporalité. La mise en intrigue (muthos) configure le temps vécu en temps signifiant.',
    concepts: [
      { name: 'Mimésis I — Préfiguration', definition: 'Compréhension pratique du monde avant l\'acte de raconter : savoir-faire narratif ordinaire, maîtrise du symbolique et de la temporalité dans la vie quotidienne.' },
      { name: 'Mimésis II — Configuration', definition: 'L\'acte de mise en intrigue lui-même (la composition de l\'œuvre). La fiction configure le temps en lui donnant une forme, une concordance discordante entre début, milieu et fin.' },
      { name: 'Mimésis III — Refiguration', definition: 'La réception par le lecteur/spectateur : le monde du texte rencontre le monde du lecteur et refigure son expérience du temps. L\'histoire ne vit pleinement qu\'à la lecture.' },
      { name: 'Concordance discordante', definition: 'L\'intrigue réconcilie des éléments hétérogènes (événements inattendus, retournements) en une unité temporelle signifiante. La discordance est surmontée mais pas effacée.' },
      { name: 'Identité narrative', definition: 'Le récit est le médium par lequel un sujet comprend son propre identité dans le temps. Se raconter, c\'est se constituer comme personnage d\'une histoire.' },
      { name: 'Distension temporelle (Augustin)', definition: 'L\'âme est "tiraillée" entre passé (mémoire), présent (attention) et futur (attente). Le récit prend en charge cette discordance temporelle de l\'existence.' },
      { name: 'Intrigue comme synthèse de l\'hétérogène', definition: 'La mise en intrigue ordonne des agents, des fins, des circonstances, des interactions, des résultats imprévus en une totalité temporelle.' },
    ],
    useInScreenwriting: 'Ricoeur éclaire pourquoi les histoires ont un impact émotionnel durable : elles refigurent notre expérience du temps. Une fin ouverte ou un flash-back ne sont pas que des techniques — ils jouent sur la distension temporelle du spectateur.',
  },
  {
    id: 'bremond',
    author: 'Claude Bremond',
    work: 'Logique du récit',
    year: '1973',
    tradition: 'Structuralisme',
    summary:
      'Bremond critique Propp et propose une logique du récit basée sur des séquences d\'alternatives : à chaque moment, le récit peut bifurquer. Il introduit la notion de possibilité narrative et montre que tout récit est une série de choix entre amélioration et dégradation.',
    concepts: [
      { name: 'Séquence élémentaire', definition: 'Trois temps : virtualité (une possibilité s\'ouvre), actualisation ou non (la possibilité se réalise ou non), résultat (le processus aboutit ou échoue).' },
      { name: 'Loi du ventail (bifurcation)', definition: 'À chaque moment narratif, plusieurs chemins sont possibles. Le récit choisit l\'un d\'eux, mais le lecteur perçoit les autres — c\'est de là que naît la tension.' },
      { name: 'Amélioration', definition: 'Séquences narratives orientées vers un gain : protection contre un mal possible, remédiation à un mal subi, obtention d\'un bien.' },
      { name: 'Dégradation', definition: 'Séquences narratives orientées vers une perte : introduction d\'un mal, frustration d\'un bien espéré, production d\'un mal.' },
      { name: 'Agent', definition: 'Personnage qui initie et accomplit un processus — il prend l\'initiative, il décide. Correspond au rôle actif.' },
      { name: 'Patient', definition: 'Personnage qui subit un processus initié par un agent ou par les circonstances. Son statut change sous l\'effet d\'une force extérieure.' },
      { name: 'Jonction de séquences', definition: 'Les séquences peuvent s\'enchaîner (fin de l\'une = début de l\'autre), s\'emboîter (une séquence en contient une autre) ou alterner (deux séquences en parallèle).' },
    ],
    useInScreenwriting: 'La logique de Bremond aide à construire la tension par le principe du ventail : le spectateur doit percevoir les alternatives non choisies. Une scène sans alternatives possibles est une scène sans tension.',
  },
  {
    id: 'frye',
    author: 'Northrop Frye',
    work: 'Anatomy of Criticism',
    year: '1957',
    tradition: 'Mythologie',
    summary:
      'Frye classe toute la littérature en quatre mythos (modes narratifs archétypaux) liés aux saisons. Son système permet d\'identifier le registre profond d\'une histoire et de calibrer les attentes émotionnelles du spectateur.',
    concepts: [
      { name: 'Comédie (printemps)', definition: 'Récit d\'intégration sociale : l\'individu s\'intègre à la communauté. Mouvement vers la réconciliation, le mariage, la résolution des conflits. S(t) cyclique.' },
      { name: 'Romance (été)', definition: 'Récit de quête et d\'idéalisation : le héros triomphe de ses épreuves et atteint son but. S(t) maximale avant le retour.' },
      { name: 'Tragédie (automne)', definition: 'Récit de chute inévitable : le héros est isolé, détruit ou expulsé de la société. S(t) ouverte, sans résolution.' },
      { name: 'Ironie / Satire (hiver)', definition: 'Récit de désenchantement : l\'anti-héros échoue ou triomphe misérablement. Vision ironique de la condition humaine. S(t) plate ou descendante.' },
      { name: 'Mode mythique', definition: 'Héros supérieur en nature aux humains (dieux, êtres surnaturels). Mode du mythe fondateur.' },
      { name: 'Mode mimétique élevé', definition: 'Héros supérieur aux autres humains mais pas aux forces naturelles — le roi, le général, le grand homme. Mode épique et tragique classique.' },
      { name: 'Mode mimétique bas', definition: 'Héros au même niveau que le lecteur, avec des défauts ordinaires. Mode réaliste et comique moderne.' },
      { name: 'Mode ironique', definition: 'Héros inférieur au lecteur en pouvoir et en intelligence. Mode satirique et naturaliste.' },
    ],
    useInScreenwriting: 'Identifier le mythos dominant dès le départ permet de calibrer la courbe dramatique S(t) et d\'aligner les attentes génériques. Un scénario qui mélange tragédie et comédie sans le contrôler envoie des signaux contradictoires.',
  },
  {
    id: 'campbell',
    author: 'Joseph Campbell',
    work: 'Le Héros aux Mille Visages',
    year: '1949',
    tradition: 'Mythologie',
    summary:
      'Campbell montre que tous les mythes du monde partagent une structure commune : le monomythe, ou voyage du héros. Il identifie 17 étapes organisées en trois mouvements (Départ, Initiation, Retour) que l\'on retrouve dans la tragédie grecque comme dans les contes animés.',
    concepts: [
      { name: 'Monde ordinaire', definition: 'L\'environnement initial du héros, son état de déséquilibre inconscient. Ce que le héros devra dépasser.' },
      { name: 'Appel à l\'aventure', definition: 'L\'événement qui rompt l\'équilibre du monde ordinaire et invite le héros à quitter son territoire connu.' },
      { name: 'Refus de l\'appel', definition: 'Résistance initiale du héros — peur, obligation, attachement. Renforce la crédibilité et l\'enjeu du départ.' },
      { name: 'Rencontre du mentor', definition: 'Figure qui guide, forme et prépare le héros avant qu\'il ne franchisse le seuil — sagesse, outil ou confiance transmis.' },
      { name: 'Franchissement du premier seuil', definition: 'Point de non-retour : le héros entre dans le monde spécial, inconnu et dangereux. Fin de l\'acte 1.' },
      { name: 'Épreuves / Alliés / Ennemis', definition: 'Dans le monde spécial, le héros est testé, fait des alliances et rencontre ses ennemis. Formation de l\'équipe et révélation des règles du nouveau monde.' },
      { name: 'Caverne secrète (approche)', definition: 'Le héros s\'approche du lieu le plus dangereux — confrontation intérieure avant l\'épreuve suprême.' },
      { name: 'Épreuve suprême (Ordeal)', definition: 'Mort symbolique et renaissance : le héros affronte sa peur ultime ou son ennemi principal. Il doit mourir (symboliquement) pour renaître transformé.' },
      { name: 'Récompense (Seizing the Sword)', definition: 'Après l\'épreuve, le héros obtient ce qu\'il cherchait — trésor, connaissance, amour, pouvoir.' },
      { name: 'Chemin du retour', definition: 'Le héros revient vers le monde ordinaire, souvent poursuivi ou contraint — le retour est aussi une épreuve.' },
      { name: 'Résurrection', definition: 'Dernière purification : le héros est à nouveau testé et doit démontrer qu\'il a réellement changé. Climax de l\'acte 3.' },
      { name: 'Retour avec l\'élixir', definition: 'Le héros revient transformé, porteur d\'un don pour sa communauté — savoir, amour, liberté. Le voyage a un sens universel.' },
    ],
    useInScreenwriting: 'Le monomythe est la base de la structure en trois actes. Christopher Vogler l\'a adapté directement pour Hollywood dans "The Writer\'s Journey". Indispensable pour les récits de formation et d\'aventure.',
  },
  {
    id: 'mckee',
    author: 'Robert McKee',
    work: 'Story',
    year: '1997',
    tradition: 'Dramaturgie',
    summary:
      'McKee codifie les principes de la dramaturgie classique pour le scénario contemporain. Son concept central : chaque scène doit produire un changement de valeur dramatique. Sans conflit, pas de scène — sans changement, pas de scène.',
    concepts: [
      { name: 'Beat', definition: 'Unité minimale dramatique : un comportement ou une action qui change une valeur dramatique. Une scène est composée de plusieurs beats.' },
      { name: 'Valeur dramatique', definition: 'Un aspect de l\'expérience humaine qui peut basculer positivement ou négativement (amour/haine, vie/mort, liberté/esclavage). Chaque scène doit en faire bouger une.' },
      { name: 'Gap (écart)', definition: 'L\'écart entre ce que le personnage attend de son action et ce qui se produit réellement. Plus le gap est grand, plus le suspense est intense.' },
      { name: 'Principe d\'escalade', definition: 'Chaque obstacle doit être plus grand que le précédent. La pression dramatique doit monter — jamais se répéter au même niveau.' },
      { name: 'Scène = désir vs obstacle', definition: 'Toute scène se construit sur l\'opposition entre le désir immédiat d\'un personnage et ce qui l\'empêche de l\'atteindre.' },
      { name: 'Acte = grande inversion', definition: 'Chaque acte se clôt sur une grande inversion de la valeur dominante — ce qui oriente la direction de l\'acte suivant.' },
      { name: 'Climax irréversible', definition: 'Le climax est obligatoire et irréversible. Il révèle le vrai caractère du protagoniste dans l\'action ultime, sans appel.' },
      { name: 'Commentaire sur la condition humaine', definition: 'Toute grande histoire fait une déclaration sur la nature humaine. Le "thème" n\'est pas un message — c\'est une tension non résolue entre valeurs.' },
    ],
    useInScreenwriting: 'McKee est la référence standard en formation scénaristique. Ses outils (beat, gap, escalade, valeur dramatique) s\'articulent directement avec V(t) et S(t) de l\'Intégrale Dramatique.',
  },
  {
    id: 'truby',
    author: 'John Truby',
    work: 'Anatomy of Story',
    year: '2007',
    tradition: 'Dramaturgie',
    summary:
      'Truby propose une approche organique de la structure en 22 étapes centrée sur la psychologie profonde du personnage. Pour Truby, l\'antagoniste n\'est pas un obstacle mais un miroir — il révèle et amplifie la faiblesse du héros.',
    concepts: [
      { name: 'Faiblesse psychologique', definition: 'Ce qui empêche le héros de fonctionner pleinement au début. Elle est à la fois interne (psychologique) et externe (comportementale).' },
      { name: 'Besoin moral', definition: 'Ce que le héros doit apprendre ou devenir pour être heureux. Distinct du désir (objectif externe conscient) : le besoin est inconscient au départ.' },
      { name: 'Désir', definition: 'L\'objectif externe que le héros poursuit consciemment tout au long de l\'histoire. Sa réalisation n\'implique pas nécessairement le bonheur.' },
      { name: 'L\'antagoniste comme miroir', definition: 'L\'antagoniste révèle et amplifie la faiblesse du héros — il représente ce que le héros deviendrait s\'il ne se transformait pas.' },
      { name: 'Révélation de soi (self-revelation)', definition: 'Le moment où le héros comprend sa vraie nature, reconnaît sa faiblesse et choisit (ou non) de changer. Point central de l\'arc.' },
      { name: 'Nouveau équilibre', definition: 'L\'état du monde et du héros après la transformation. Il diffère de l\'équilibre initial selon l\'amplitude du changement accompli.' },
      { name: 'Structure organique', definition: 'Les 22 étapes ne sont pas linéaires : certaines peuvent être simultanées, d\'autres compressées ou dilatées selon les besoins du récit.' },
    ],
    useInScreenwriting: 'Truby complète McKee en ajoutant la dimension psychologique profonde. Ses concepts de faiblesse/besoin moral sont essentiels pour construire un arc de personnage crédible.',
  },
  {
    id: 'lavallard',
    author: 'Étienne Lavallard',
    work: 'L\'Intégrale Dramatique',
    year: '2024',
    tradition: 'Dramaturgie',
    summary:
      'L\'Intégrale Dramatique est un modèle mathématique qui formalise la charge dramatique accumulée d\'un récit. Elle unifie les théories classiques (Aristote, McKee, Frye) dans un formalisme quantitatif permettant d\'analyser et calibrer la courbe émotionnelle d\'un scénario.',
    concepts: [
      { name: 'S(t) — Charge dramatique accumulée', definition: 'S(t) = ∫ [V(t) · P(t|τ)] · C(t) dt. Mesure l\'accumulation de la tension dramatique à chaque instant du récit. Quand elle franchit un seuil critique, un événement majeur émerge.' },
      { name: 'V(t) — Valeur de l\'acte', definition: 'Valeur dramatique instantanée de −2 (effondrement total) à +2 (climax positif). Correspond directement au concept de valeur dramatique de McKee.' },
      { name: 'C(t) — Pression contextuelle', definition: 'C(t) = Ci(t) × Ce(t). Coefficient multiplicateur entre 0 et 1. Ci(t) : contexte interne (faille morale, arc psychologique) ; Ce(t) : contexte externe (antagonisme, enjeux du monde).' },
      { name: 'P(t|τ) — Poids rétroactif (Nachträglichkeit)', definition: 'Inspiré du concept freudien : chaque révélation recalcule le poids des actes passés. Un événement présent peut transformer rétroactivement la signification d\'un événement antérieur.' },
      { name: 'Seuil dramatique critique', definition: 'Valeur de S(t) à partir de laquelle un événement majeur (péripétie, anagnorisis, climax) devient inévitable — et donc surprenant ET nécessaire.' },
      { name: 'Structure fractale', definition: 'La même structure S(t) se retrouve à toutes les échelles : beat, scène, séquence, acte, film entier. L\'intégrale est auto-similaire.' },
      { name: 'Courbe S(t) et mythos de Frye', definition: 'Chaque mythos (Comédie/Romance/Tragédie/Ironie) génère une forme caractéristique de la courbe S(t). La Tragédie laisse S(t) ouverte ; la Comédie la referme ; la Romance l\'élève au maximum.' },
    ],
    useInScreenwriting: 'L\'Intégrale Dramatique est le moteur analytique de Sigma. V(t) et C(t) se renseignent pour chaque scène dans le tableau scène-à-scène, et S(t) est calculée automatiquement pour visualiser la courbe dramatique du scénario.',
  },
];
