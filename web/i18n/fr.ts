import type { Messages } from "./types";

export const fr: Messages = {
  brand: {
    name: "AnswerGap",
    tagline: "Trouvez les questions auxquelles vos concurrents n'ont jamais répondu.",
    prototype: "prototype",
  },

  landing: {
    treeCount: "{count} enregistrées",
    emptyTitle: "Aucune recherche pour l'instant.",
    emptyBody:
      "Cherchez un mot-clé ci-dessus et il apparaîtra ici. Vos recherches " +
      "sont privées et rattachées à votre compte.",
    headline:
      "Trouvez les questions auxquelles vos concurrents n'ont jamais répondu.",
    intro:
      "AnswerGap déploie « Autres questions posées » de Google en un arbre de " +
      "questions, examine les résultats de recherche derrière chacune et vous " +
      "montre celles qu'aucune page ne cible vraiment.",
    searchPlaceholder: "Saisissez un mot-clé — p. ex. blanchiment dentaire",
    searchButton: "Analyser",
    searchDisabledHint: "Aucun identifiant DataForSEO trouvé - copiez .env.example vers .env et remplissez-le.",
    searching: "Recherche…",
    searchingHint: "Google est interrogé une fois, avec le bloc « Autres questions posées » déplié. Cela prend 30 à 60 secondes.",
    liveNotice: "Une recherche lance <b>une seule requête en direct</b> et renvoie l’arbre de questions. Le score de lacune se calcule <b>question par question</b> et se déclenche depuis la question elle-même.",
    savedAnalyses: "Analyses enregistrées",
    questionCount: "{count} questions",
    country: "Pays",
    language: "Langue",
    languageHint:
      "Le score de lacune ne fonctionne que dans les langues disposant d'un module.",
  },

  status: {
    gap: "Sans réponse",
    weak: "À peine traitée",
    covered: "Bien traitée",
    no_data: "Non vérifiée",
    evidence: "{matching} pages sur {checked}",
    gapExplained:
      "Aucun résultat de recherche ne cible directement cette question. La " +
      "réponse doit être extraite d'une page écrite sur un autre sujet.",
    weakExplained:
      "Une ou deux pages ciblent cette question. La concurrence a commencé, " +
      "mais il reste de la place.",
    coveredExplained:
      "Trois pages ou plus ciblent cette question. S'y positionner serait difficile.",
    no_dataExplained:
      "Les résultats de recherche n'ont pas été récupérés pour cette " +
      "question ; personne ne sait donc si quelqu'un y répond. Inconnu " +
      "n'est pas synonyme de sans réponse.",
  },

  toolbar: {
    seeds: "Recherches associées",
    tree: "Arbre",
    table: "Tableau",
    searchPlaceholder: "Filtrer les questions…",
    showing: "{shown} sur {total} questions",
    zoomIn: "Zoom avant",
    zoomOut: "Zoom arrière",
    fit: "Ajuster à l'écran",
  },

  table: {
    question: "Question",
    status: "Statut",
    matchingPages: "Pages qui la ciblent",
    matchingPagesHint: "Résultats qui ciblent réellement cette question",
    checked: "Examinés",
    checkedHint: "Résultats examinés",
    branches: "Branches",
    branchesHint: "Sous combien de questions parentes différentes elle est apparue",
    depth: "Niveau",
    volume: "Volume",
    volumeHint: "Google Ads n'est pas connecté",
    noVolume: "aucune donnée",
    empty: "Aucune question ne correspond au filtre.",
    aiSources: "AI Overview",
    aiSourcesHint: "Sites que l’AI Overview de Google cite pour cette question. Connu uniquement pour les questions vérifiées.",
    aiCount: "{count} sites",
    aiNone: "aucun",
    aiYou: "vous",
    aiYouHint: "{site} fait partie des sources citées",
    aiUnknown: "inconnu",
    aiUnknownHint: "La réponse IA de Google se charge après la page et ses sources n'ont pas pu être lues. Inconnu, pas non cité.",
  },

  ai: {
    heading: "AI Overview de Google dans cet arbre",
    noneChecked: "Aucune question n’a encore été vérifiée. Vérifier une question indique aussi, sans coût supplémentaire, si l’AI Overview de Google y répond et quels sites il cite.",
    coverage: "L'aperçu IA de Google cite des sources pour {withAi} des {checked} questions dont la réponse IA a pu être lue.",
    citedIn: "cité dans {count} sur {checked}",
    note: "Seules les questions dont la réponse IA a pu être lue sont comptées. Le reste est inconnu, pas non cité.",
    unreadable: "Illisible pour {count} autres.",
    siteLabel: "Votre site",
    sitePlaceholder: "exemple.fr",
    siteInvalid: "Saisissez un domaine, par exemple exemple.fr.",
    siteCited: "{site} est cité dans {count} des {checked} questions vérifiées.",
    siteHint: "Les sous-domaines comptent aussi : exemple.fr correspond à blog.exemple.fr. Mémorisé dans ce navigateur uniquement.",
    treeMarker: "IA {count}",
    treeHint: "L'aperçu IA de Google cite {count} sites pour cette question.",
    treeYouHint: "{site} en fait partie.",
  },

  seeds: {
    note:
      "Google affiche ces expressions à côté des résultats. Ce sont des requêtes, pas des questions : elles ne deviennent donc jamais des nœuds de l'arbre, ce sont les prochains mots-clés à analyser.",
    empty: "Aucune recherche associée n'a encore été enregistrée pour cet arbre.",
    noQuestionsTitle: "Google n’affiche aucune question pour cette recherche",
    noQuestionsBody:
      "Cette page de résultats ne contient pas de bloc « Autres questions posées », il n’y a donc pas d’arbre de questions à construire. C’est normal pour les noms de marque et les recherches d’un seul mot, où l’on cherche un site plutôt qu’une réponse. Les recherches formulées comme des questions fonctionnent le mieux.",
    noQuestionsTry: "À la place, Google suggère ces recherches associées :",
  },

  detail: {
    empty:
      "Sélectionnez une question pour voir quelles pages la ciblent, " +
      "lesquelles non, et combien y répondent vraiment.",
    depth: "Niveau {depth}",
    branches: "dans {count} branches",
    matchingPages: "Pages qui la ciblent",
    checked: "Résultats examinés",
    volume: "Volume de recherche",
    resultsHeading:
      "Résultats de recherche · une page compte comme réponse à partir de {threshold}",
    noResults: "Les résultats de recherche n'ont <b>jamais été récupérés</b> pour cette question, personne ne sait donc si quelqu'un y répond - d'où le contour en pointillés. Il s'agit d'une analyse archivée ; lancez une recherche en direct sur le même terme pour l'évaluer.",
    notScoredYet: "Cette question n'a <b>pas encore été vérifiée</b>. La vérifier coûte une requête de recherche, cela ne se produit donc jamais automatiquement — et d'ici là, personne ne sait si quelqu'un y répond.",
    scoreButton: "Vérifier cette question",
    scoring: "Vérification…",
    scoreCost: "Une requête SERP. Une question déjà récupérée ne coûte rien.",
    untitled: "(sans titre)",
    aiHeading: "Sources de l'aperçu IA de Google",
    aiNote:
      "Google répond à cette question par un aperçu IA et cite ces sites. Il " +
      "peut s'agir d'une question sans clic.",
    aiYou: "{site} fait partie des sites cités.",
    aiNotYou: "{site} n'est pas cité pour cette question.",
    aiUnreadable: "Google répond à cette question par un aperçu IA, mais il se charge après la page et ses sources n'ont pas pu être lues. On ignore qui y est cité.",
    sourceHeading: "Source",
    updated: "Dernière mise à jour : {date}",
    matching: "Correspondance : {strategy} · seuil {threshold}",
    unvalidated: "(non validé)",
    harvestFound: "Cette requête a également révélé {count} nouvelles questions, sans coût supplémentaire.",
    harvestDropped: "{count} autres ont été écartées car trop éloignées du mot-clé de départ.",
    harvestedNode: "Trouvée dans les résultats d'une autre question",
    relevance: "Proximité au mot-clé {value}",
  },

  verdict: {
    heading: "Ces pages répondent-elles à la question ?",
    ask: "Le seuil n’est pas encore fixé. C’est votre réponse qui le fixe — gratuit, aucune recherche n’est lancée.",
    gap: "Non, aucune",
    notGap: "Oui, au moins une",
    gapHint: "Aucune page ici n’a été écrite pour répondre à cette question.",
    notGapHint: "Au moins une page ici y répond directement.",
    recorded: "Enregistré. Cliquez à nouveau sur le même bouton pour le retirer.",
    retracted: "Verdict retiré.",
    saving: "Enregistrement…",
    tally: "{questions} questions jugées à ce jour ({gap} sans réponse, {notGap} avec réponse).",
    disagrees: "Cela contredit la métrique — c’est précisément le cas utile.",
  },

  batch: {
    size: "Taille du lot",
    check: "Vérifier les {count} premières",
    pricing: "Calcul du prix…",
    confirmCount: "{count} questions",
    vsLive: "dans la file {queue} · {live} en Live",
    skipped:
      "{count} ignorées — déjà vérifiées, déjà en file, ou au-delà des " +
      "crédits qu'il vous reste.",
    noCallback: "Aucun callback configuré : les résultats seront récupérés par sondage, ce qui prend des minutes plutôt que des secondes.",
    confirm: "Les mettre en file",
    cancel: "Annuler",
    posting: "Mise en file…",
    running: "{done} sur {total} revenues",
    failed: "{count} en échec",
    allChecked: "Toutes les questions ont été vérifiées.",
  },

  dev: {
    role: "administrateur",
    scopeTree: "Cette analyse uniquement.",
    scopeAll: "Tout, tous les arbres.",
    grandTotal: "Tous les arbres : {total}",
    rowsTree: "{questions} questions · {tasks} vérifications en file",
    loading: "Lecture…",
    liveQueue: "Live",
    standardQueue: "Standard",
    requests: "{count} requêtes · {crawls} recherches",
    tasks: "{count} questions",
    saved: "Économisé",
    savedNote: "le même travail en Live aurait coûté {ifLive}",
    total: "Total",
    perRequest: "Par requête : {live} Live · {standard} Standard",
    rows: "{questions} questions · {scores} scores · {snapshots} réponses stockées",
    storage: "Stockage {state} · {tables} tables",
    ok: "ok",
    broken: "EN ÉCHEC",
    callback: "Callback {state}",
    on: "actif",
    offSweep: "inactif — repli sur le sondage",
    pending: "{count} encore en file",
    failedTasks: "{count} tâches en échec",
  },

  diff: {
    first: "Premier crawl · {at}",
    firstNote: "Rien à comparer pour l'instant. Relancez cette recherche plus tard et les changements apparaîtront ici.",
    stable: "Aucun changement depuis {since} · {count} questions identiques",
    changed: "{added} nouvelles · {removed} disparues · depuis {since}",
    scope: "Compare ce que Google a renvoyé, pas ce que le scoring a découvert ensuite. Un réordonnancement n'est pas un changement.",
    addedHeading: "Nouvelles questions",
    removedHeading: "Plus posées",
    removedNote: "Une page écrite pour celles-ci ne vise plus rien.",
    historyHeading: "Historique des crawls",
    questionCount: "{count} questions",
  },

  notice: {
    archiveData: "Données d'archive",
    archiveDataDetail: "pas en direct",
    liveData: "Exploration en direct",
    liveDataDetail: "un instantané, pas du direct",
    liveDataNote: "Récupéré une fois, à l’heure indiquée. Les résultats de Google évoluent ; relancez la recherche pour actualiser.",
    provisionalThreshold: "Seuil provisoire",
    thresholdNote:
      "Le seuil de lacune n'a pas été validé sur des données annotées. Les " +
      "résultats indiquent une tendance ; ils ne sont pas définitifs.",
    volumeNote:
      "Google Ads n'est pas connecté — le volume de recherche n'est pas affiché.",
    dataNote:
      "Lu depuis l'archive de validation de la phase 0, pas depuis des données " +
      "Google en direct.",
  },

  auth: {
    // --- connexion par e-mail et mot de passe ------------------------
    signUpTitle: "Créez votre compte AnswerGap",
    tabSignIn: "Se connecter",
    tabSignUp: "Créer un compte",
    emailLabel: "E-mail",
    passwordLabel: "Mot de passe",
    nameLabel: "Nom (facultatif)",
    newPassword: "Nouveau mot de passe",
    passwordHint:
      "Au moins 10 caractères. C'est la longueur qui compte : une phrase courte vaut mieux qu'un mot de passe court.",
    or: "ou",
    forgot: "Mot de passe oublié ?",
    forgotTitle: "Réinitialisez votre mot de passe",
    forgotSub:
      "Indiquez votre adresse et nous vous enverrons un lien pour choisir un nouveau mot de passe.",
    forgotSubmit: "Envoyer le lien",
    sentTitle: "Consultez votre boîte de réception",
    sentBody:
      "Nous avons envoyé un lien à {email}. Ouvrez-le pour confirmer votre adresse et recevoir vos crédits gratuits.",
    sentSpam:
      "Cela peut prendre une minute. S'il n'arrive pas, regardez dans les spams.",
    sentResend: "Renvoyer",
    sentAgain: "Envoyé. Regardez de nouveau dans un instant.",
    backToSignIn: "Retour à la connexion",
    resetTitle: "Choisissez un nouveau mot de passe",
    resetSub:
      "Cela vous déconnecte aussi partout ailleurs — c'est tout l'intérêt d'une réinitialisation.",
    resetSubmit: "Enregistrer et se connecter",
    working: "En cours…",
    yourAddress: "votre adresse",
    verifyBanner:
      "Confirmez votre adresse e-mail pour utiliser vos crédits.",
    verifyBannerAction: "Renvoyer le lien",
    verifiedToast: "Votre e-mail est confirmé. Vos crédits sont prêts.",
    alreadyVerified:
      "Cette adresse est déjà confirmée. Connectez-vous et continuez.",
    verifyExpiredTitle: "Ce lien a expiré",
    verifyExpiredSub:
      "Un lien de vérification ne sert qu'une fois et pour peu de temps. Indiquez votre adresse, nous en enverrons un nouveau.",
    verifyExpiredSubmit: "Envoyer un nouveau lien",
    close: "Fermer",
    dialogTitle: "Se connecter à AnswerGap",
    benefitCredits: "Des crédits pour lancer des recherches et vérifier des questions",
    benefitPrivate: "Vos recherches restent les vôtres — personne d'autre ne les voit",
    benefitScore: "Vérifiez chaque question face aux pages qui se positionnent",
    noCard: "Sans carte. Les crédits sont ajoutés à la main pendant la préversion.",
    signIn: "Se connecter avec Google",
    signOut: "Se déconnecter",
    signedInAs: "Connecté en tant que {email}",
    account: "Compte",
    failed: "La connexion n'a pas abouti. Réessayez.",
    why: "Connectez-vous pour conserver vos recherches et vos crédits.",
  },

  credits: {
    label: "Crédits",
    balance: "{count} crédits",
    empty: "Plus de crédits",
    free: "Les résultats en cache sont gratuits : ils ne consomment aucun crédit.",
    manualNote: "Les crédits sont ajoutés à la main pour l'instant ; il n'y a pas encore de paiement.",
  },

  error: {
    invalidEmail: "Cela ne ressemble pas à une adresse e-mail.",
    badCredentials:
      "Cet e-mail et ce mot de passe ne correspondent à aucun compte.",
    emailUnverified:
      "Confirmez d'abord votre adresse e-mail — le lien est dans votre boîte.",
    tooManyAttempts:
      "Trop de tentatives. Attendez quelques minutes puis réessayez.",
    passwordTooShort:
      "Les mots de passe doivent faire au moins {minLength} caractères.",
    passwordTooCommon:
      "Ce mot de passe figure dans des fuites connues. Choisissez-en un autre.",
    resetExpired:
      "Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau.",
    googleOff:
      "La connexion Google n'est pas configurée ici. Utilisez l'e-mail.",
    unreachable: "API injoignable ({url}). Le backend est-il démarré ?",
    http: "{status} {statusText} — {path}",
    noCredentials: "Les identifiants DataForSEO sont absents. Copiez .env.example vers .env, remplissez-le, puis redémarrez le backend.",
    budget: "Le plafond de requêtes a été atteint ; l’exploration s’est arrêtée plutôt que de dépenser davantage.",
    upstream: "DataForSEO est injoignable, ou a renvoyé une erreur. Une requête échouée n’est pas facturée.",
    badRequest: "Cette requête ne peut pas être exécutée telle quelle.",
    signedOut: "Vous êtes déconnecté. Connectez-vous pour continuer.",
    noCredits:
      "Plus de crédits. Une recherche coûte un crédit ; les résultats en " +
      "cache sont gratuits.",
    anonLimit:
      "La recherche gratuite du jour a déjà été utilisée sur cette connexion. " +
      "Connectez-vous pour continuer.",
    suspended: "Ce compte est suspendu. Contactez-nous, nous réglerons cela.",
    backToAnalyses: "Retour aux analyses",
    startBackend: "Pour démarrer le backend, à la racine du projet :",
    loading: "Chargement…",
  },

  theme: {
    light: "Passer au sombre",
    dark: "Suivre le système",
    system: "Passer au clair",
  },

  language: {
    label: "Langue de l'interface",
  },

  market: {
    nav: {
      pricing: "Tarifs",
      solutions: "Solutions",
      aiSeo: "SEO pour l'IA",
      blog: "Blog",
      contact: "Contact",
      signIn: "Se connecter",
      signUp: "S'inscrire",
    },
    hero: {
      eyebrow: "La visibilité dans la recherche IA commence ici",
      headlinePre: "Classe-toi et apparais dans",
      headlineHighlight: "la recherche propulsée par l'IA",
      sub:
        "Découvre ce que les gens demandent, identifie les réponses dont " +
        "les moteurs IA ont besoin, et crée du contenu qui est trouvé, cité " +
        "et recommandé.",
      searchPlaceholder: "Entre un sujet — ex. blanchiment dentaire",
      searchCta: "Analyser",
      searching: "Recherche…",
      tryLabel: "Essaie :",
      try1: "meilleur CRM pour startups",
      try2: "outils SEO pour l'IA",
    },
    howItWorks: {
      eyebrow: "Comment ça marche",
      title: "Deviens la réponse que la recherche IA recommande.",
      sub:
        "AnswerGap révèle les questions derrière la découverte pilotée par " +
        "l'IA pour que tu crées du contenu utile et structuré avant tes " +
        "concurrents.",
      card1: {
        label: "Intelligence de la demande",
        title: "Cartographie la demande de recherche IA",
        body:
          "Transforme un seul sujet en une carte complète des questions " +
          "que les gens posent à chaque étape de la découverte et de la " +
          "décision.",
      },
      card2: {
        label: "Visibilité IA",
        title: "Trouve des opportunités de citation",
        body:
          "Identifie les questions dont les réponses sont faibles, " +
          "incomplètes ou manquantes — exactement là où un contenu plus " +
          "clair a le plus de chances d'être mis en avant par l'IA.",
      },
      card3: {
        label: "Autorité",
        title: "Construis une autorité thématique",
        body:
          "Priorise les questions connectées et publie des réponses " +
          "complètes que les moteurs de recherche et les assistants IA " +
          "peuvent comprendre et en qui ils peuvent avoir confiance.",
      },
    },
    builtFor: {
      eyebrow: "Conçu pour la recherche IA",
      title: "Réponds à de vraies questions. Fais-toi découvrir par l'IA.",
      body:
        "La recherche devient une conversation. AnswerGap te montre ce " +
        "que ton public demande et où les réponses actuelles sont " +
        "insuffisantes — pour que ta marque gagne en visibilité dans les " +
        "AI Overviews, les assistants et la recherche classique.",
      point1: "Crée des réponses claires que l'IA peut extraire et citer",
      point2: "Structure le contenu autour de vraies recherches conversationnelles",
      point3: "Couvre les questions liées pour renforcer l'autorité thématique",
      demoUrl: "answergap.com/recherche",
      demo1Q: "Quel est le meilleur CRM pour une petite entreprise ?",
      demo1Meta: "Réponse complète · Forte opportunité de visibilité",
      demo2Q: "Ai-je besoin d'un CRM si j'utilise Google Workspace ?",
      demo2Meta: "Pas de réponse complète · Forte opportunité de visibilité",
      demo3Q: "Comment migrer d'un tableur à un CRM ?",
      demo3Meta: "Réponses partielles · Opportunité de visibilité moyenne",
    },
    pricing: {
      title: "Des tarifs simples et transparents",
      sub:
        "Trouve les questions qui peuvent développer ta visibilité dans " +
        "l'IA et la recherche. Annule quand tu veux.",
      starter: {
        name: "Starter",
        desc: "Pour les créateurs qui construisent leur visibilité en recherche IA.",
        price: "49 $",
        per: "/mois",
        feat1: "100 recherches de sujets par mois",
        feat2: "Cartes de questions de recherche IA",
        feat3: "Classification de l'intention de recherche",
        feat4: "Export des opportunités",
        cta: "Commencer",
      },
      pro: {
        name: "Pro",
        badge: "Le plus populaire",
        desc: "Pour les équipes qui scale leur autorité en recherche IA.",
        price: "149 $",
        per: "/mois",
        feat1: "Recherches de sujets illimitées",
        feat2: "Score d'opportunités de visibilité IA",
        feat3: "Analyse des lacunes de réponse et de citation",
        feat4: "Accès à l'API",
        feat5: "Support prioritaire",
        cta: "Passer à Pro",
      },
      note:
        "Tarifs statiques — le checkout n'est pas encore branché. Les " +
        "crédits sont attribués à la main tant que le produit est en preview.",
    },
    cta: {
      title: "Prêt·e à devenir la réponse ?",
      sub:
        "Trouve les questions qui comptent, publie des réponses que l'IA " +
        "comprend et bâtis ta visibilité là où ton public cherche.",
      primary: "Commencer gratuitement",
      secondary: "Voir les tarifs",
    },
    footer: {
      tagline:
        "Trouve les questions auxquelles la recherche IA a besoin de " +
        "réponses — et aide ta marque à devenir la source de confiance " +
        "qu'elle recommande.",
      product: {
        heading: "Produit",
        features: "Fonctionnalités",
        pricing: "Tarifs",
        api: "API",
        changelog: "Changelog",
      },
      resources: {
        heading: "Ressources",
        blog: "Blog",
        seoGuides: "Guides SEO",
        helpCenter: "Centre d'aide",
        community: "Communauté",
      },
      company: {
        heading: "Entreprise",
        about: "À propos",
        contact: "Contact",
        privacy: "Politique de confidentialité",
        terms: "Conditions d'utilisation",
      },
      copyright: "© {year} AnswerGap. Tous droits réservés.",
    },
    saved: {
      heading: "Tes analyses récentes",
      count: "{count} enregistrés",
    },
  },
};
