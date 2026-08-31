import type { Messages } from "./types";

export const fr: Messages = {
  brand: {
    name: "AnswerGap",
    tagline: "Trouvez les questions auxquelles vos concurrents n'ont jamais répondu.",
    prototype: "prototype",
  },

  landing: {
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
  },

  seeds: {
    note:
      "Google affiche ces expressions à côté des résultats. Ce sont des requêtes, pas des questions : elles ne deviennent donc jamais des nœuds de l'arbre, ce sont les prochains mots-clés à analyser.",
    empty: "Aucune recherche associée n'a encore été enregistrée pour cet arbre.",
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
    skipped: "{count} ignorées — déjà vérifiées, ou déjà en file.",
    noCallback: "Aucun callback configuré : les résultats seront récupérés par sondage, ce qui prend des minutes plutôt que des secondes.",
    confirm: "Les mettre en file",
    cancel: "Annuler",
    posting: "Mise en file…",
    running: "{done} sur {total} revenues",
    failed: "{count} en échec",
    allChecked: "Toutes les questions ont été vérifiées.",
  },

  dev: {
    role: "développeur",
    loading: "Lecture…",
    liveQueue: "Live",
    standardQueue: "Standard",
    crawls: "{count} recherches",
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

  error: {
    unreachable: "API injoignable ({url}). Le backend est-il démarré ?",
    http: "{status} {statusText} — {path}",
    noCredentials: "Les identifiants DataForSEO sont absents. Copiez .env.example vers .env, remplissez-le, puis redémarrez le backend.",
    budget: "Le plafond de requêtes a été atteint ; l’exploration s’est arrêtée plutôt que de dépenser davantage.",
    upstream: "DataForSEO est injoignable, ou a renvoyé une erreur. Une requête échouée n’est pas facturée.",
    badRequest: "Cette requête ne peut pas être exécutée telle quelle.",
    backToAnalyses: "Retour aux analyses",
    startBackend: "Pour démarrer le backend, à la racine du projet :",
    loading: "Chargement…",
  },

  language: {
    label: "Langue de l'interface",
  },
};
