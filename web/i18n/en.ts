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
    searchDisabledHint: "No DataForSEO credentials found - copy .env.example to .env and fill it in.",
    searching: "Searching…",
    searchingHint: "Asking Google once, with the “People also ask” block expanded. This takes 30-60 seconds.",
    liveNotice: "A search runs <b>one live request</b> and returns the question tree. Gap scoring is <b>per question</b> and is started from the question itself.",
    savedAnalyses: "Saved analyses",
    questionCount: "{count} questions",
    country: "Country",
    language: "Language",
    languageHint:
      "Gap scoring only runs in languages we have a matching pack for.",
  },

  // Names the reader's conclusion, not our measurement.
  //
  // These used to read Gap / Weak / Covered / No data. Two problems with that.
  // "Weak" never said weak WHAT - the question, the competition, the evidence?
  // And "Gap" is a verdict, while CLAUDE.md's own measurement puts the best
  // lexical rule at precision 0.20: one real gap against four false alarms. A
  // badge asserting it in one confident word claims more than the data
  // supports, which is the accuracy rule, not a matter of taste.
  //
  // So the label says what was found and `evidence` carries the count beside
  // it. The count is defensible on its own; the category is a threshold
  // judgement that is still open. "Gap" survives as the product's idea - the
  // name, the promise - and disappears as a per-row verdict.
  status: {
    gap: "Unanswered",
    weak: "Barely answered",
    covered: "Well answered",
    no_data: "Not checked",
    // Shown next to the label wherever a single question is on screen. This is
    // the honest half of the claim, so it leads rather than hides in a tooltip.
    evidence: "{matching} of {checked} pages",
    gapExplained:
      "No search result targets this question directly. The answer has to be " +
      "dug out of a page written about something else.",
    weakExplained:
      "One or two pages target this question. Competition has started, but " +
      "there is still room.",
    coveredExplained:
      "Three or more pages target this question. Ranking for it would be hard.",
    no_dataExplained:
      "Search results have not been fetched for this question, so nobody " +
      "knows whether anyone answers it. Unknown is not the same as unanswered.",
  },

  toolbar: {
    seeds: "Related searches",
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
    matchingPagesHint: "Search results that actually target this question",
    checked: "Checked",
    checkedHint: "Search results we looked at",
    branches: "Branches",
    branchesHint: "How many different parents this question appeared under",
    depth: "Depth",
    volume: "Volume",
    volumeHint: "Google Ads is not connected",
    noVolume: "no data",
    empty: "No question matches the filter.",
  },

  seeds: {
    note:
      "Google shows these phrases beside the results. They are queries, not questions, so they are never nodes in the tree — they are the next seeds to search.",
    empty: "No related searches have been recorded for this tree yet.",
  },

  detail: {
    empty:
      "Select a question to see which pages target it, which don't, and how " +
      "many of them actually answer it.",
    depth: "Depth {depth}",
    branches: "in {count} branches",
    matchingPages: "Pages targeting it",
    checked: "Results checked",
    volume: "Search volume",
    // The number stays - it is the evidence - but the heading now says what
    // it means instead of naming the variable it came from.
    resultsHeading:
      "Search results · a page counts as an answer at {threshold} or higher",
    noResults: "Search results were <b>never fetched</b> for this question, so nobody knows whether anyone answers it - that is why it is drawn with a dashed outline. This is an archived analysis; run a live search for the same seed to score it.",
    notScoredYet: "This question has <b>not been checked yet</b>. Checking it costs one search request, so it never happens automatically — and until it does, nobody knows whether anyone answers it.",
    scoreButton: "Check this question",
    scoring: "Checking…",
    scoreCost: "One SERP request. A question already fetched costs nothing.",
    untitled: "(no title)",
    aiHeading: "Google AI Overview sources",
    aiNote:
      "Google answers this question with an AI Overview and cites these sites. " +
      "It may be a zero-click question.",
    sourceHeading: "Source",
    updated: "Last updated: {date}",
    matching: "Matching: {strategy} · threshold {threshold}",
    unvalidated: "(unvalidated)",
    harvestFound: "This request also revealed {count} new questions, at no extra cost.",
    harvestDropped: "{count} more were left out for drifting away from the seed.",
    harvestedNode: "Found inside another question's results",
    relevance: "Seed relevance {value}",
  },

  // CLAUDE.md already wrote this question in plain words - "do these page
  // titles answer it?" - and explains why the buttons sit BELOW the results:
  // it can only be asked once the titles have been read. Asking it as "is this
  // really a gap?" made the reader translate our vocabulary before they could
  // answer, and both buttons must stay equally weighted or the set this is
  // collecting is biased before it exists.
  verdict: {
    heading: "Do these pages answer the question?",
    ask: "The threshold is not settled yet. Your answer is what settles it — it costs nothing and no search is run.",
    gap: "No, none of them",
    notGap: "Yes, at least one does",
    gapHint: "No page here was written to answer this question.",
    notGapHint: "At least one page here answers it directly.",
    recorded: "Recorded. Click the same button again to withdraw it.",
    retracted: "Verdict withdrawn.",
    saving: "Saving…",
    tally: "{questions} questions judged so far ({gap} unanswered, {notGap} answered).",
    disagrees: "This disagrees with the metric — which is the useful case.",
  },

  notice: {
    archiveData: "Archive data",
    archiveDataDetail: "not live",
    liveData: "Live crawl",
    liveDataDetail: "a snapshot, not live",
    liveDataNote: "Fetched once, at the time shown. Google’s results move; run the search again to refresh.",
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
    noCredentials: "DataForSEO credentials are missing. Copy .env.example to .env, fill it in, then restart the backend.",
    budget: "The request ceiling was reached, so the crawl stopped rather than spend more.",
    upstream: "DataForSEO could not be reached, or returned an error. A failed request is not charged.",
    badRequest: "That request cannot be run as asked.",
    backToAnalyses: "Back to analyses",
    startBackend: "To start the backend, from the project root:",
    loading: "Loading…",
  },

  language: {
    label: "Interface language",
  },
} as const;
