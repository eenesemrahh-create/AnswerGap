import type { Messages } from "./types";

export const fr: Messages = {
  brand: {
    name: "GetTopQuestions",
    tagline: "Trouvez les questions auxquelles vos concurrents n'ont jamais répondu.",
  },

  landing: {
    treeCount: "{count} enregistrées",
    emptyTitle: "Aucune recherche pour l'instant.",
    emptyBody:
      "Commencez avec le champ de recherche ci-dessus ou essayez un exemple. Une recherche coûte un crédit. Vos recherches sont privées et rattachées à votre compte.",
    headline:
      "Trouvez les questions auxquelles vos concurrents n'ont jamais répondu.",
    intro:
      "GetTopQuestions déploie « Autres questions posées » de Google en un arbre de " +
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
    filters: "Filtres",
    seedLabel: "Votre recherche",
    pngUncheckedNote: "Aucune question vérifiée pour l'instant : chaque case reste grise jusqu'à la vérification de ses résultats",
    pngRepeatNote: "×N = Google a affiché cette question sous N branches différentes",
    seeds: "Recherches associées",
    tree: "Arbre",
    showDetails: "Afficher les détails",
    table: "Tableau",
    searchPlaceholder: "Filtrer les questions…",
    showing: "{shown} sur {total} questions",
    exportCsv: "Exporter en CSV",
    exportCsvHint: "Télécharge les lignes affichées, avec vos filtres appliqués.",
    exportPng: "Télécharger l'image",
    exportPngHint: "Enregistre l'arbre entier en PNG, pas seulement la partie visible.",
    zoomIn: "Zoom avant",
    zoomOut: "Zoom arrière",
    zoomLevel: "Niveau de zoom",
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
    sortBy: "Trier par",
    volumeNote: "Volume de recherche : pas encore de données, car Google Ads n'est pas connecté. En attendant, les branches (sous combien de questions une question est apparue) servent de signal d'intérêt.",
  },

  writeFirst: {
    title: "À écrire en premier",
    lead: "Questions sans réponse de cet arbre. Le score est une estimation : lisez les pages avant d'écrire.",
    none: "Aucune question vérifiée n'est encore sans réponse.",
    pages: "{matching} pages sur {checked} la ciblent",
    order: "Ordre : le moins de pages qui la ciblent, puis le plus de branches, puis le plus proche de votre sujet. Ce n'est pas une mesure de popularité.",
  },

  ai: {
    heading: "AI Overview de Google dans cet arbre",
    noneChecked: "Aucune question n’a encore été vérifiée. Vérifier une question indique aussi, sans coût supplémentaire, si l’AI Overview de Google y répond et quels sites il cite.",
    coverage: "L'aperçu IA de Google cite des sources pour {withAi} des {checked} questions dont la réponse IA a pu être lue.",
    citedIn: "cité dans {count} sur {checked}",
    pngTop: "Les plus cités par AI Overview : {domains}",
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
    close: "Fermer",
    depth: "Niveau {depth}",
    branches: "dans {count} branches",
    matchingPages: "Pages qui la ciblent",
    checked: "Résultats examinés",
    volume: "Volume de recherche",
    resultsHeading:
      "Résultats de recherche · une page compte comme réponse à partir de {threshold}",
    noResults: "Les résultats de recherche n'ont <b>jamais été récupérés</b> pour cette question, personne ne sait donc si quelqu'un y répond - d'où le contour en pointillés. Il s'agit d'une analyse archivée ; lancez une recherche en direct sur le même terme pour l'évaluer.",
    notScoredYet: "Cette question n'a <b>pas encore été vérifiée</b>. La vérifier coûte un crédit, cela ne se produit donc jamais automatiquement — et d'ici là, personne ne sait si quelqu'un y répond.",
    scoreButton: "Vérifier cette question · 1 crédit",
    scoring: "Recherche de cette question… (30 à 60 secondes)",
    scoreCost: "La question est recherchée à part : son résultat s'affiche ici et elle obtient son propre arbre de questions. Une question déjà recherchée ne coûte rien.",
    openTree: "Ouvrir l'arbre de cette question",
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
    mobileNode: "Affichée sur la page mobile de Google",
    autocompleteNode: "Suggestion de recherche Google",
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
    credits: "{count} crédits",
    queueDiscount:
      "Moitié prix : la vérification groupée passe par la file d'attente au " +
      "lieu de répondre immédiatement.",
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

  rounds: {
    first: "Analyser et agrandir l'arbre · 2 crédits",
    second: "L'agrandir encore une fois · 3 crédits",
    confirmCount: "{count} questions à analyser",
    grows: "Chaque question analysée apporte ses propres questions, l'arbre grandit donc.",
    leftOut: "{count} autres dépassent la limite de ce tour et restent non analysées.",
    limit: "Limite de tours atteinte · {count} questions non analysées",
    limitNone: "Limite de tours atteinte",
  },

  deep: {
    open: "Ouvrir les branches fermées",
    openCount: "Ouvrir {count} branches fermées",
    closedHint: "Google a ouvert {open} des {total} questions principales et en a laissé {closed} fermées.",
    confirmCount: "{count} branches",
    queueDiscount:
      "Demi-tarif : les branches s'ouvrent dans la file au lieu de revenir " +
      "immédiatement.",
    alsoScores:
      "Chacune est aussi vérifiée pour les lacunes au passage, sans supplément.",
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
    fallbackMobile: "Google n'affiche aucune question pour cette recherche sur ordinateur. Voici celles qu'il affiche sur mobile.",
    fallbackAutocomplete: "Google n'affiche aucune question pour cette recherche. Voici plutôt ses suggestions de recherche, pas des questions de la page de résultats.",
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
    signUpTitle: "Créez votre compte GetTopQuestions",
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
    accountEmail: "Connecté en tant que",
    deleteTitle: "Supprimer mon compte",
    deleteLead: "C'est irréversible. Vos recherches sont déliées de vous ; votre adresse e-mail et vos justificatifs de paiement sont conservés.",
    deleteAction: "Supprimer mon compte…",
    deleteConfirmTitle: "Supprimer ce compte ?",
    deleteRemoves: "Supprimé : votre nom, votre photo, votre mot de passe, vos préférences et le lien entre vous et chacune de vos recherches. Vos analyses enregistrées cessent d'être les vôtres.",
    deleteKeeps: "Conservé : votre adresse e-mail, pour vous reconnaître si vous revenez, et vos justificatifs de paiement, que la fiscalité nous impose de garder.",
    deleteRevives: "Si vous vous réinscrivez avec cette adresse, le compte revient et les crédits payés sont toujours là. Les recherches, non.",
    deleteSubscription: "Votre forfait payant est résilié immédiatement et ne vous sera plus facturé. Le reste de la période en cours n'est pas remboursé.",
    deleteConfirmPassword: "Saisissez votre mot de passe pour confirmer",
    deleteConfirmEmail: "Saisissez {email} pour confirmer",
    deleteSubmit: "Supprimer mon compte",
    deleteCancel: "Garder mon compte",
    verifyExpiredTitle: "Ce lien a expiré",
    verifyExpiredSub:
      "Un lien de vérification ne sert qu'une fois et pour peu de temps. Indiquez votre adresse, nous en enverrons un nouveau.",
    verifyExpiredSubmit: "Envoyer un nouveau lien",
    close: "Fermer",
    dialogTitle: "Se connecter à GetTopQuestions",
    benefitCredits: "Des crédits pour lancer des recherches et vérifier des questions",
    benefitPrivate: "Vos recherches restent les vôtres — personne d'autre ne les voit",
    benefitScore: "Vérifiez chaque question face aux pages qui se positionnent",
    noCard: "Sans carte. Les crédits sont ajoutés à la main pendant la préversion.",
    signIn: "Se connecter avec Google",
    signOut: "Se déconnecter",
    signedInAs: "Connecté en tant que {email}",
    account: "Compte",
    alreadySignedIn: "Vous avez déjà un compte",
    failed: "La connexion n'a pas abouti. Réessayez.",
    why: "Connectez-vous pour conserver vos recherches et vos crédits.",
    whySearch: "La recherche nécessite un compte. La création est gratuite et les nouveaux comptes démarrent avec des crédits.",
  },

  credits: {
    label: "Crédits",
    balance: "{count} crédits",
    empty: "Plus de crédits",
    free: "Les résultats en cache sont gratuits : ils ne consomment aucun crédit.",
    manualNote: "Les crédits sont ajoutés à la main pour l'instant ; il n'y a pas encore de paiement.",
    periodHeading: "Cette période",
    periodUsed: "{used} crédits sur {granted} utilisés cette période",
    periodResets: "réinitialisé le {date}",
  },

  account: {
    title: "Votre compte",
    signedOutTitle: "Connectez-vous pour voir votre compte",
    signedOutLead:
      "Votre offre, vos crédits et tout ce à quoi vous les avez consacrés se trouvent derrière la connexion.",
    signedOutAction: "Se connecter",
    back: "Retour à la recherche",
    loading: "Chargement…",

    profileHeading: "Informations",
    email: "E-mail",
    name: "Nom",
    joined: "Membre depuis",
    unnamed: "Non renseigné",
    verified: "Confirmé",
    unverified: "Non confirmé",
    verifyAction: "Renvoyer le lien",
    verifySent: "Envoyé. Regardez votre boîte de réception.",
    doors: "Se connecter avec",
    doorPassword: "Mot de passe",
    doorGoogle: "Google",

    planHeading: "Votre offre",
    noPlan: "Aucune offre",
    noPlanLead:
      "Ce compte fonctionne uniquement avec des crédits. Une offre en ajoute chaque mois.",
    planCredits: "{count} crédits par période",
    given: "Attribuée par nos soins",
    bought: "Facturée via Stripe",
    renews: "Se renouvelle le {date}",
    endsOn: "Se termine le {date}",
    lapsed: "Cette offre a pris fin.",
    pastDue:
      "Le dernier paiement n'est pas passé. Mettez votre carte à jour pour conserver l'offre.",
    manage: "Gérer la facturation",
    manageLead:
      "Résilier, modifier votre carte ou télécharger vos factures. Ouvre Stripe.",

    creditsHeading: "Crédits",
    balanceLead:
      "Une recherche coûte un crédit. Rouvrir une recherche enregistrée est gratuit.",
    historyHeading: "Historique",
    historyWhen: "Quand",
    historyChange: "Variation",
    historyWhy: "Motif",
    noHistory: "Rien pour l'instant.",
    reasonSignup: "Crédits de bienvenue",
    reasonSearch: "Recherche",
    reasonSubscription: "Renouvellement de l'offre",
    reasonAdminGrant: "Ajoutés par nos soins",
    reasonAdminRevoke: "Retirés par nos soins",

    plansHeading: "Offres",
    plansLead: "Vous pouvez changer d'offre à tout moment.",
    current: "Votre offre",
    choose: "Choisir {plan}",
    monthly: "Mensuel",
    annual: "Annuel",
    notPurchasable: "Pas encore disponible",
    myPlansHeading: "Vos forfaits",
    myPlansLead: "Les crédits sont d'abord pris sur le forfait dont la période se termine le plus tôt ; une fois épuisés, le forfait suivant prend le relais. Les crédits qu'un forfait n'utilise pas pendant sa période sont supprimés à la fin de celle-ci. Les crédits ne venant d'aucun forfait sont utilisés en dernier.",
    otherCredits: "Crédits hors forfait (bienvenue, cadeaux) : {count}, utilisés en dernier",
    spendingFrom: "Utilisé en ce moment",
    creditsLeftOf: "{left} crédits sur {total} restants pour cette période",
    burnsOn: "Les crédits non utilisés sont supprimés le {date}",
    defaultBadge: "Par défaut",
    makeDefault: "Définir par défaut",
    ofTotalLeft: "crédits restants sur {total}",
    usedCount: "{count} utilisés",
    confirmDefault: "Définir {plan} comme forfait par défaut ? Vos autres forfaits ({others}) ne seront pas renouvelés ; vous pouvez utiliser leurs crédits jusqu'à la fin de leur période.",
    confirmDefaultAlone: "Définir {plan} comme forfait par défaut ?",
    confirmDefaultYes: "Oui, définir par défaut",
    defaultRenewsNote: "{plan} sera renouvelé automatiquement chaque mois. Vous pouvez l'arrêter à tout moment dans « {manage} ».",
    autoRenewHint: "Renouvelé automatiquement chaque mois · arrêtez-le à tout moment dans « {manage} »",
    cancelStep: "Annuler",
    endingMakeDefault: "Ce forfait se termine le {date}. Pour le garder, choisissez « Définir par défaut » ci-dessus ; inutile de le racheter.",
    endingRenewInPortal: "Ce forfait se termine le {date}. Pour le garder, renouvelez-le dans « {manage} » ; inutile de le racheter.",
    chooseAdditional: "Ajouter {plan} comme second forfait",
    additionalWarn: "Votre forfait actuel continue et ce forfait est facturé en plus. Seul votre forfait par défaut se renouvelle chaque mois : celui-ci se termine après sa première période. Pour qu'il se renouvelle, définissez-le par défaut ; vos autres forfaits s'arrêtent alors à la fin de leur période.",
    additionalYes: "J'ai compris, passer au paiement",
    contactUs: "Nous contacter",
    seeAllPlans: "Voir toutes les offres",

    billingDone:
      "Merci. Votre offre est en cours d'activation — elle peut mettre un instant à apparaître ici.",
    billingCancelled: "Rien n'a été débité.",

    settingsHeading: "Réglages",
    theme: "Apparence",
    language: "Langue",
    dangerHeading: "Supprimer le compte",

    navOverview: "Vue d'ensemble",
    navProfile: "Profil",
    navSubscription: "Abonnement",
    navSettings: "Paramètres",
    navSearches: "Mes recherches",
    hello: "Bonjour, {name}",
    overviewLead: "Vos crédits, votre offre et votre compte en un coup d'œil.",
    newSearch: "Lancer une nouvelle recherche",
    newSearchLead: "Chaque nouvelle recherche coûte un crédit. Rouvrir une recherche déjà faite est gratuit.",
    noAllowance: "Pas d'allocation mensuelle. Une offre ajoute des crédits chaque mois.",
    overdrawn: "Votre solde est de {count} : les prochains crédits le couvrent d'abord.",
    changePlan: "Changer d'offre",
    profileLead: "Qui vous êtes et comment vous vous connectez.",
    subscriptionLead: "Votre offre, vos crédits et les offres vers lesquelles passer.",
    settingsLead: "L'apparence de GetTopQuestions et sa langue.",
    themeLead: "Clair, sombre ou selon votre système.",
    languageLead: "La langue de l'interface.",
  },

  home: {
    statAnalyses: "analyses",
    statGaps: "questions sans réponse trouvées",
    filter: "Filtrer vos analyses…",
    sortLabel: "Trier",
    sortNewest: "Plus récentes",
    sortQuestions: "Plus de questions",
    sortGaps: "Plus sans réponse",
    noMatch: "Aucune analyse ne correspond à « {query} ».",
    unanswered: "sans réponse",
    notChecked: "Pas encore vérifiée",
    jobReady: "est prête.",
    jobOpen: "Ouvrir l'arbre",
    jobLost:
      "— la page a été rechargée pendant la recherche et son résultat n'est pas encore apparu. S'il n'est pas dans vos analyses ci-dessous, relancez-la : une recherche déjà terminée ne coûte rien la deuxième fois.",
  },

  strip: {
    left: "crédits restants",
    upgrade: "Changer d'offre",
    choosePlan: "Choisir une offre",
    jobRunning: "Recherche de « {seed} »…",
    jobReady: "« {seed} » est prête",
  },

  refresh: {
    live: "Live",
    title: "Relancer la recherche pour les données les plus récentes (1 crédit)",
    busy: "Une autre recherche est encore en cours",
    confirm: "Récupérer les données les plus récentes ? Utilise 1 crédit.",
    yes: "Mettre à jour",
    no: "Annuler",
    running: "Mise à jour…",
    processing: "Traitement en cours…",
    processingNote: "Collecte des questions et vérification des résultats. Cela prend un peu de temps.",
    saved: "Enregistré",
  },

  repeat: {
    title: "Vous avez déjà recherché « {seed} »",
    lead: "Ouvrez votre résultat enregistré ou récupérez les données les plus récentes.",
    leadDated: "Votre résultat enregistré date du {date}. Ouvrez-le ou récupérez les données les plus récentes.",
    open: "Ouvrir le résultat enregistré",
    openNote: "Gratuit · s’ouvre immédiatement",
    update: "Mettre à jour avec les données récentes",
    updateNote: "1 crédit · nouvelle recherche",
    cancel: "Annuler",
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
    unreachableRetry:
      "Si la recherche était déjà terminée, elle est enregistrée : la " +
      "relancer ne coûte aucun crédit.",
    notFound:
      "Cette analyse n'est pas ici. Elle a peut-être été supprimée, ou l'adresse est mal saisie.",
    http: "{status} {statusText} — {path}",
    noCredentials: "Les identifiants DataForSEO sont absents. Copiez .env.example vers .env, remplissez-le, puis redémarrez le backend.",
    budget: "Le plafond de requêtes a été atteint ; l’exploration s’est arrêtée plutôt que de dépenser davantage.",
    upstream: "DataForSEO est injoignable, ou a renvoyé une erreur. Une requête échouée n’est pas facturée.",
    searchUnavailable:
      "La recherche est temporairement indisponible. Nous avons été prévenus et nous nous en occupons. Aucun crédit n’a été utilisé.",
    searchFailed:
      "La recherche n’a pas pu aboutir. Aucun crédit n’a été utilisé - réessayez dans une minute.",
    alreadySearched: "Vous avez déjà fait cette recherche. Ouvrez-la depuis votre liste ou mettez-la à jour.",
    anonLimit: "Vous avez utilisé la recherche gratuite du jour. Créez un compte gratuit pour continuer.",
    anonDailyFull: "Les recherches gratuites du jour sont épuisées. Créez un compte gratuit pour chercher maintenant.",
    captchaFailed: "Nous n'avons pas pu confirmer que cette recherche vient d'une personne. Veuillez réessayer.",
    badRequest: "Cette requête ne peut pas être exécutée telle quelle.",
    planNotPurchasable:
      "Cette offre n'est pas encore achetable — nous finalisons sa " +
      "configuration de paiement. Écrivez-nous et nous nous en occupons.",
    noSuchPlan: "Cette offre n'est plus proposée.",
    roundLimit: "Cet arbre a déjà utilisé ses deux tours d'analyse.",
    roundInFlight: "Les résultats du tour précédent arrivent encore. Réessayez une fois qu'ils sont là.",
    noCustomer: "Il n'y a rien à gérer pour l'instant : ce compte n'a jamais été facturé.",
    paymentsOff: "Les paiements ne sont pas encore activés.",
    subscriptionCancelFailed: "Nous n'avons pas pu résilier votre abonnement, votre compte n'a donc pas été supprimé. Réessayez dans quelques minutes ou écrivez au support.",
    alreadyOnPlan: "Vous avez déjà ce forfait. S'il se termine, définissez-le par défaut dans « Vos forfaits » pour le garder ; ou choisissez-en un autre.",
    planPaymentFailed: "Le paiement de ce forfait n'a pas abouti, il ne peut donc pas être votre forfait par défaut. Mettez d'abord à jour votre carte dans « Gérer la facturation », ou choisissez un forfait payé.",
    stripeFailed: "Le prestataire de paiement a refusé cette demande et aucun paiement n'a été prélevé. Réessayez dans quelques minutes. Si cela continue, écrivez à support@gettopquestions.com.",
    signedOut: "Vous êtes déconnecté. Connectez-vous pour continuer.",
    noCredits: "Plus de crédits. Chaque recherche coûte un crédit. Choisissez une offre pour continuer.",
    seePlans: "Voir les offres",
    suspended: "Ce compte est suspendu. Contactez-nous, nous réglerons cela.",
    serverError:
      "Un problème est survenu de notre côté. Rien n'a été facturé pour une " +
      "recherche qui n'a pas abouti. Réessayez dans un instant.",
    backToAnalyses: "Retour aux analyses",
    startBackend: "Pour démarrer le backend, à la racine du projet :",
    loading: "Chargement…",
  },

  anon: {
    freeTitle: "Sans compte, vous avez {count} recherche gratuite par jour",
    freeNote: "Vous voyez l'arbre de questions et le tableau. Analyser les questions, agrandir l'arbre et exporter sont réservés aux membres.",
    usedTitle: "Vous avez utilisé la recherche gratuite du jour",
    resetsIn: "Votre prochaine recherche gratuite arrive dans {hours} h {minutes} min, à {clock}. Créez un compte gratuit pour chercher maintenant.",
    dailyFull: "Les recherches gratuites du jour sont épuisées.",
    usedUpReason: "Avec un compte gratuit, vous voyez tout l'arbre de questions et vos recherches sont conservées.",
    signUpFree: "Créer un compte gratuit",
    verifying: "Vérification…",
    previewTitle: "Votre recherche gratuite, sans compte",
    previewBody: "Vous voyez l'arbre et le tableau tels que la recherche les a renvoyés. Créez un compte gratuit pour analyser les questions, agrandir l'arbre et télécharger en PNG/CSV.",
    previewEmpty: "Google n'a montré aucune question pour cette recherche, votre recherche gratuite n'a donc pas été utilisée. Essayez une question ou quelques mots, comme « comment préparer un café filtre ».",
    hint: "Astuce : les questions ou quelques mots donnent les meilleurs résultats (« comment préparer un café filtre »). Pour les marques et les mots isolés, Google n'affiche souvent aucune question.",
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
      menu: "Menu",
    },
    hero: {
      eyebrow: "Recherche de questions pour créateurs, fondateurs et marketeurs",
      headlinePre: "Trouvez les questions",
      headlineHighlight: "qui méritent une réponse",
      sub:
        "Saisissez un terme, découvrez les questions associées les plus posées " +
        "et utilisez-les pour créer du contenu utile pour la recherche " +
        "classique, les Google AI Overviews et la recherche conversationnelle.",
      signedInTitle: "Que faut-il explorer ?",
      searchPlaceholder: "Saisissez un terme, comme bureau assis-debout",
      searchCta: "Rechercher",
      searching: "Recherche…",
      elapsed: "{seconds} s écoulées",
      tryLabel: "Essaie :",
      try1: "meilleur CRM pour startups",
      try2: "outils SEO pour l'IA",
    },
    picker: {
      open: "Choisir le marché de recherche",
      country: "Pays",
      language: "Langue",
      search: "Rechercher un pays",
      none: "Aucun pays trouvé",
    },

    howItWorks: {
      eyebrow: "Comment ça marche",
      title: "Partez de ce que les gens demandent vraiment.",
      sub:
        "GetTopQuestions fait ressortir les questions autour de votre terme pour " +
        "planifier du contenu utile et bien structuré, ancré dans une vraie " +
        "curiosité.",
      card1: {
        label: "Recherche de questions",
        title: "Découvrez les questions associées",
        body:
          "Transformez un seul terme en questions associées les plus posées, de " +
          "la première curiosité à la comparaison et à la décision.",
      },
      card2: {
        label: "Planification éditoriale",
        title: "Repérez les opportunités de contenu",
        body:
          "Lisez les questions avec l'œil d'un éditeur et repérez celles que " +
          "votre contenu laisse sans réponse ou n'aborde qu'en passant.",
      },
      card3: {
        label: "Autorité",
        title: "Construisez votre autorité thématique",
        body:
          "Regroupez les questions liées et planifiez un contenu qui couvre un " +
          "sujet en profondeur, écrit clairement pour les lecteurs, les moteurs " +
          "de recherche et les assistants IA.",
      },
    },

    workflow: {
      eyebrow: "Le déroulé",
      titleLead: "Un terme en entrée. Des questions en sortie.",
      titleMuted: "Le contenu, c'est vous.",
      body:
        "GetTopQuestions est un point de départ pour la recherche. Il n'écrit " +
        "pas et ne publie pas à votre place, et il ne suit pas les positions. " +
        "Il vous montre ce que les gens demandent, pour que votre contenu repose " +
        "sur leurs questions plutôt que sur vos suppositions.",
      step1: {
        label: "01 / Terme",
        title: "Partez des mots de votre audience",
        body:
          "Saisissez une catégorie de produit, un problème, une fonctionnalité " +
          "ou une expression simple comme « bureau assis-debout ». Large, c'est " +
          "très bien. L'idée est d'ouvrir la porte, pas de deviner le mot-clé " +
          "parfait.",
        sample: "bureau assis-debout",
      },
      step2: {
        label: "02 / Questions",
        title: "Voyez les questions posées autour",
        body:
          "GetTopQuestions fait ressortir les questions associées les plus " +
          "posées, pour lire le sujet comme le formulerait un acheteur curieux, " +
          "un débutant ou un sceptique.",
        sample: "Un bureau assis-debout est-il utile contre le mal de dos ?",
      },
      step3: {
        label: "03 / Contenu",
        title: "Décidez de ce que vous allez écrire",
        body:
          "Regroupez les questions par intention, choisissez celles auxquelles " +
          "vous pouvez répondre avec une vraie expertise, et transformez-les en " +
          "pages, sections, FAQ, vidéos ou articles. L'écriture reste la vôtre.",
        sample: "Guide : à qui la station debout profite vraiment, et à qui non",
      },
    },

    examples: {
      eyebrow: "De la question au contenu",
      title: "À quoi ressemble un manque.",
      sub:
        "Choisissez un sujet. Ces exemples ont été rédigés par notre équipe " +
        "pour montrer comment lire un résultat ; ce ne sont pas des résultats " +
        "réels de l'application.",
      columnQuestion: "Question posée",
      columnPages: "Pages qui la ciblent",
      columnVerdict: "Verdict",
      columnIdea: "Que faire",
      skipIdea: "Passez, sauf si vous avez quelque chose de nouveau à apporter",
      tab1: {
        term: "levain",
        q1: "Pourquoi mon levain ne monte plus après une semaine ?",
        idea1: "Une liste de diagnostic : température, farine, rafraîchi, timing",
        q2: "Peut-on faire un levain avec de la farine T55 ?",
        idea2: "Une réponse directe, puis les compromis, dans un bloc FAQ",
        q3: "Comment faire un levain ?",
      },
      tab2: {
        term: "logiciel de facturation",
        q1: "Puis-je facturer sans avoir créé d'entreprise ?",
        idea1: "Un guide en langage clair, découpé par situation",
        q2: "Un logiciel de facturation est-il déductible ?",
        idea2: "Une réponse courte avec des exemples chiffrés",
        q3: "Quel est le meilleur logiciel de facturation ?",
      },
      tab3: {
        term: "chaussures de trail",
        q1: "Peut-on courir sur rocher mouillé avec des chaussures de trail ?",
        idea1: "Un comparatif testé avec vos propres photos",
        q2: "Combien de temps durent des chaussures de trail ?",
        idea2: "Un guide du kilométrage avec les signes d'usure",
        q3: "Quelles sont les meilleures chaussures de trail ?",
      },
    },

    builtFor: {
      eyebrow: "Conçu pour la recherche IA",
      title: "Répondez à de vraies questions. Soyez découvert par l'IA.",
      body:
        "La recherche devient une conversation. GetTopQuestions vous montre ce " +
        "que votre audience demande et où les réponses actuelles sont " +
        "insuffisantes, pour écrire des réponses claires pour les AI Overviews, " +
        "les assistants et la recherche classique. La visibilité n'est jamais " +
        "garantie, mais une question sans réponse est le bon point de départ.",
      point1: "Voyez quels sites l'AI Overview de Google cite pour chaque question vérifiée",
      point2: "Saisissez votre site et voyez les questions où vous êtes cité",
      point3: "Structurez le contenu autour de vraies recherches conversationnelles",
      demoLabel: "Exemple : crm",
      demo1Q: "Quel est le meilleur CRM pour une petite entreprise ?",
      demo1Meta: "6 pages sur 8 la ciblent",
      demo2Q: "Ai-je besoin d'un CRM si j'utilise Google Workspace ?",
      demo2Meta: "0 page sur 8 la cible",
      demo3Q: "Comment passer d'un tableur à un CRM ?",
      demo3Meta: "2 pages sur 8 la ciblent",
      demoNote: "Exemple rédigé par notre équipe. Pas de mesures réelles.",
    },

    formats: {
      eyebrow: "Formats de contenu",
      title: "Laissez la question choisir le format.",
      body:
        "La façon dont une question est formulée indique comment y répondre. " +
        "Des réponses claires et bien organisées servent le lecteur aussi bien " +
        "sur les pages de résultats classiques que dans les Google AI Overviews " +
        "et les assistants conversationnels. Rien n'est garanti, mais une " +
        "structure utile est un choix solide.",
      card1: {
        title: "Sections FAQ",
        when: "Quand une question a une réponse courte et factuelle.",
        how: "Commencez par la réponse en une ou deux phrases, puis nuancez.",
      },
      card2: {
        title: "Guides approfondis",
        when: "Quand plusieurs questions partagent un même problème de fond.",
        how: "Faites de chaque question un sous-titre pour que le lecteur aille à la sienne.",
      },
      card3: {
        title: "Pages comparatives",
        when: "Quand les questions contiennent « vs », « ou » ou « mieux ».",
        how: "Précisez à qui convient chaque option. Les tableaux aident.",
      },
      card4: {
        title: "Tutoriels pas à pas",
        when: "Quand les questions commencent par « comment faire ».",
        how: "Numérotez les étapes et dites à quoi ressemble le résultat final.",
      },
      card5: {
        title: "Vidéo courte et réseaux sociaux",
        when: "Quand la réponse est visuelle ou rapide à montrer.",
        how: "Affichez la question à l'écran dès les premières secondes.",
      },
      card6: {
        title: "Newsletter et notes commerciales",
        when: "Quand les questions révèlent des objections ou des hésitations.",
        how: "Répondez honnêtement au doute avant qu'il ne fasse perdre la vente.",
      },
    },

    faq: {
      eyebrow: "Réponses pratiques",
      title: "Questions sur GetTopQuestions",
      q1: "Que fait exactement GetTopQuestions ?",
      a1:
        "Vous saisissez un terme et GetTopQuestions affiche les questions les " +
        "plus posées qui s'y rapportent. Vous utilisez ensuite ces questions " +
        "pour planifier et écrire du contenu utile. C'est toute l'idée : un " +
        "point de départ pratique pour la recherche de questions.",
      q2: "Écrit-il ou publie-t-il du contenu à ma place ?",
      a2:
        "Non. GetTopQuestions vous aide à décider de quoi écrire. La rédaction, " +
        "la relecture et la publication vous reviennent, et c'est là que votre " +
        "expertise et votre voix comptent.",
      q3: "Suit-il mes positions ou mes mentions dans l'IA ?",
      a3:
        "Non. GetTopQuestions n'est ni un outil de suivi de positions, ni un " +
        "outil de veille de marque, ni un analyseur de citations, et il " +
        "n'indique pas de volumes de recherche. Il se concentre sur la " +
        "découverte de questions.",
      q4: "Répondre à ces questions me fera-t-il entrer dans les AI Overviews ?",
      a4:
        "Personne ne peut le promettre. Répondre clairement et précisément à de " +
        "vraies questions est une base raisonnable pour la recherche classique, " +
        "les Google AI Overviews et la recherche conversationnelle, mais le " +
        "placement est décidé par ces plateformes.",
      q5: "Par quel type de terme commencer ?",
      a5:
        "Par ce que votre audience taperait ou dirait vraiment : une catégorie " +
        "de produit, un problème, une tâche ou une comparaison. Si les résultats " +
        "semblent trop larges, essayez une expression plus précise tirée des " +
        "questions que vous venez de trouver.",
      q6: "À combien de questions une page doit-elle répondre ?",
      a6:
        "En général, une question principale et les questions proches que le " +
        "lecteur se poserait ensuite. Si deux questions appellent des réponses " +
        "différentes pour des personnes différentes, elles méritent sans doute " +
        "des contenus séparés.",
    },

    pricing: {
      billed: "Facturation mensuelle",
      signUpNow: "S'inscrire maintenant",
      tax: "+ Taxes",
      title: "Des tarifs simples et transparents",
      sub:
        "Trouve les questions qui peuvent développer ta visibilité dans " +
        "l'IA et la recherche. Annule quand tu veux.",
      seeAll: "Comparer toutes les fonctionnalités →",
      note:
        "Tarifs statiques — le checkout n'est pas encore branché. Les " +
        "crédits sont attribués à la main tant que le produit est en preview.",
    },
    cta: {
      title: "Prêt à trouver votre prochaine question ?",
      sub:
        "Saisissez un terme, voyez ce que les gens demandent et planifiez un " +
        "contenu qui les aide vraiment, où qu'ils cherchent.",
      primary: "Commencer gratuitement",
      secondary: "Voir les tarifs",
    },

    footer: {
      tagline:
        "Découvrez les questions posées sur votre sujet, puis créez un contenu " +
        "utile qui y répond.",
      product: {
        heading: "Produit",
        features: "Fonctionnalités",
        pricing: "Tarifs",
        api: "API",
        changelog: "Journal des modifications",
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
      copyright: "© {year} GetTopQuestions. Tous droits réservés.",
    },

    saved: {
      heading: "Tes analyses récentes",
      demoHeading: "Voir sur des données réelles",
      count: "{count} enregistrés",
    },
  },
};
