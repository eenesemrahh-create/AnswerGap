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
    searchDisabledHint: "L'exploration en direct n'est pas encore connectée",
    liveNotice:
      "L'exploration en direct <b>n'est pas encore connectée</b> — les analyses " +
      "ci-dessous ont été construites à partir de vraies données Google.",
    savedAnalyses: "Analyses enregistrées",
    questionCount: "{count} questions",
    country: "Pays",
    language: "Langue",
    languageHint:
      "Le score de lacune ne fonctionne que dans les langues disposant d'un module.",
  },

  status: {
    gap: "Lacune",
    weak: "Faible",
    covered: "Couverte",
    no_data: "Aucune donnée",
    gapExplained:
      "Aucun résultat de recherche ne cible directement cette question. La " +
      "réponse doit être extraite d'une page écrite sur un autre sujet.",
    weakExplained:
      "Une ou deux pages ciblent cette question. La concurrence a commencé, " +
      "mais il reste de la place.",
    coveredExplained:
      "Trois pages ou plus ciblent cette question. S'y positionner serait difficile.",
    no_dataExplained:
      "Les résultats de recherche n'ont pas été récupérés pour cette question ; " +
      "on IGNORE donc s'il s'agit d'une lacune. Elle n'est pas comptée comme telle.",
  },

  toolbar: {
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
    matchingPagesHint: "Résultats organiques dépassant le seuil de recouvrement",
    checked: "Examinés",
    checkedHint: "Résultats organiques examinés",
    branches: "Branches",
    branchesHint: "Sous combien de questions parentes différentes elle est apparue",
    depth: "Niveau",
    volume: "Volume",
    volumeHint: "Google Ads n'est pas connecté",
    noVolume: "aucune donnée",
    empty: "Aucune question ne correspond au filtre.",
  },

  detail: {
    empty:
      "Sélectionnez une question pour voir quelles pages la ciblent, lesquelles " +
      "non, et pourquoi elle compte comme une lacune.",
    depth: "Niveau {depth}",
    branches: "dans {count} branches",
    matchingPages: "Pages qui la ciblent",
    checked: "Résultats examinés",
    volume: "Volume de recherche",
    resultsHeading:
      "Résultats de recherche · recouvrement ≥ {threshold} compte comme succès",
    noResults:
      "Les résultats de recherche n'ont <b>jamais</b> été récupérés pour cette " +
      "question ; nous ignorons donc s'il s'agit d'une lacune. C'est pourquoi " +
      "elle est tracée en pointillés. Elle sera évaluée dès que l'exploration " +
      "en direct sera connectée.",
    untitled: "(sans titre)",
    aiHeading: "Sources de l'aperçu IA de Google",
    aiNote:
      "Google répond à cette question par un aperçu IA et cite ces sites. Il " +
      "peut s'agir d'une question sans clic.",
    sourceHeading: "Source",
    updated: "Dernière mise à jour : {date}",
    matching: "Correspondance : {strategy} · seuil {threshold}",
    unvalidated: "(non validé)",
  },

  notice: {
    archiveData: "Données d'archive",
    archiveDataDetail: "pas en direct",
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
    backToAnalyses: "Retour aux analyses",
    startBackend: "Pour démarrer le backend, à la racine du projet :",
    loading: "Chargement…",
  },

  language: {
    label: "Langue de l'interface",
  },
};
