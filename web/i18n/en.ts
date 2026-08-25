/* English is the SOURCE OF TRUTH for the message catalogue.
 *
 * `Messages` is derived from this object's shape (see types.ts). Every other
 * locale is typed `const xx: Messages`, so the moment a key is added here the
 * other five files STOP COMPILING until they are updated too.
 *
 * That is the whole design. Keeping translations in sync is not a discipline
 * problem to remember — it is a build error.
 *
 * Placeholders use {name} and are filled by t(key, { name: value }).
 */

export const en = {
  brand: {
    name: "AnswerGap",
    tagline: "Find the questions your competitors never answered.",
    prototype: "prototype",
  },

  landing: {
    headline: "Find the questions your competitors never answered.",
    intro:
      "AnswerGap expands Google's “People also ask” into a question tree, checks " +
      "the search results behind every question, and shows you which ones no " +
      "page actually targets.",
    searchPlaceholder: "Enter a keyword — e.g. teeth whitening",
    searchButton: "Analyze",
    searchDisabledHint: "Live crawling is not connected yet",
    liveNotice:
      "Live crawling is <b>not connected yet</b> — the analyses below were built " +
      "from real Google data.",
    savedAnalyses: "Saved analyses",
    questionCount: "{count} questions",
    country: "Country",
    language: "Language",
    languageHint:
      "Gap scoring only runs in languages we have a matching pack for.",
  },

  status: {
    gap: "Gap",
    weak: "Weak",
    covered: "Covered",
    no_data: "No data",
    gapExplained:
      "No search result targets this question directly. The answer has to be " +
      "dug out of a page written about something else.",
    weakExplained:
      "One or two pages target this question. Competition has started, but " +
      "there is still room.",
    coveredExplained:
      "Three or more pages target this question. Ranking for it would be hard.",
    no_dataExplained:
      "Search results have not been fetched for this question, so whether it " +
      "is a gap is UNKNOWN. It is not counted as a gap.",
  },

  toolbar: {
    tree: "Tree",
    table: "Table",
    searchPlaceholder: "Filter questions…",
    showing: "{shown} of {total} questions",
    zoomIn: "Zoom in",
    zoomOut: "Zoom out",
    fit: "Fit to screen",
  },

  table: {
    question: "Question",
    status: "Status",
    matchingPages: "Pages targeting it",
    matchingPagesHint: "Organic results clearing the overlap threshold",
    checked: "Checked",
    checkedHint: "Organic results examined",
    branches: "Branches",
    branchesHint: "How many different parents this question appeared under",
    depth: "Depth",
    volume: "Volume",
    volumeHint: "Google Ads is not connected",
    noVolume: "no data",
    empty: "No question matches the filter.",
  },

  detail: {
    empty:
      "Select a question to see which pages target it, which don't, and why it " +
      "counts as a gap.",
    depth: "Depth {depth}",
    branches: "in {count} branches",
    matchingPages: "Pages targeting it",
    checked: "Results checked",
    volume: "Search volume",
    resultsHeading: "Search results · overlap ≥ {threshold} counts as a match",
    noResults:
      "Search results were <b>never fetched</b> for this question, so we do not " +
      "know whether it is a gap. That is why it is drawn with a dashed outline. " +
      "It will be scored once live crawling is connected.",
    untitled: "(no title)",
    aiHeading: "Google AI Overview sources",
    aiNote:
      "Google answers this question with an AI Overview and cites these sites. " +
      "It may be a zero-click question.",
    sourceHeading: "Source",
    updated: "Last updated: {date}",
    matching: "Matching: {strategy} · threshold {threshold}",
    unvalidated: "(unvalidated)",
  },

  notice: {
    archiveData: "Archive data",
    archiveDataDetail: "not live",
    provisionalThreshold: "Provisional threshold",
    thresholdNote:
      "The gap threshold has not been validated against labelled data. Results " +
      "indicate direction; they are not definitive.",
    volumeNote: "Google Ads is not connected — search volume is not shown.",
    dataNote: "Read from the Phase 0 validation archive, not live Google data.",
  },

  error: {
    unreachable: "Could not reach the API ({url}). Is the backend running?",
    http: "{status} {statusText} — {path}",
    backToAnalyses: "Back to analyses",
    startBackend: "To start the backend, from the project root:",
    loading: "Loading…",
  },

  language: {
    label: "Interface language",
  },
} as const;
