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
    treeCount: "{count} saved",
    emptyTitle: "No searches yet.",
    emptyBody:
      "Search a keyword above and it appears here. Your searches are private " +
      "to your account.",
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

  // Batch scoring. The price is stated before it is spent and the Live figure
  // sits beside it, because the argument for the Standard queue is a ratio and
  // a ratio with one half hidden is just a number.
  batch: {
    size: "Batch size",
    check: "Check top {count}",
    pricing: "Pricing…",
    confirmCount: "{count} questions",
    vsLive: "on the {queue} queue · {live} on Live",
    skipped:
      "{count} skipped — already checked, already queued, or beyond your " +
      "remaining credits.",
    noCallback: "No callback configured: results will be collected by polling, which takes minutes rather than seconds.",
    confirm: "Queue them",
    cancel: "Cancel",
    posting: "Queueing…",
    running: "{done} of {total} back",
    failed: "{count} failed",
    allChecked: "Every question has been checked.",
  },

  // The developer role's surface. Dollars, not credits - see DevPanel.
  dev: {
    role: "admin",
    scopeTree: "This analysis only.",
    scopeAll: "Everything, all trees.",
    grandTotal: "All trees: {total}",
    rowsTree: "{questions} questions · {tasks} queued checks",
    loading: "Reading…",
    liveQueue: "Live",
    standardQueue: "Standard",
    requests: "{count} requests · {crawls} searches",
    tasks: "{count} questions",
    saved: "Saved",
    savedNote: "the same work on Live would have been {ifLive}",
    total: "Total",
    perRequest: "Per request: {live} Live · {standard} Standard",
    rows: "{questions} questions · {scores} scores · {snapshots} stored responses",
    storage: "Storage {state} · {tables} tables",
    ok: "ok",
    broken: "FAILING",
    callback: "Callback {state}",
    on: "on",
    offSweep: "off — falling back to polling",
    pending: "{count} still queued",
    failedTasks: "{count} tasks failed",
  },

  // What Google changed since the last crawl. The wording carries two of
  // CLAUDE.md's rules: `scope` says out loud that ordering is excluded, and
  // `first` says "nothing to compare" rather than "no changes" - a measurement
  // that was never made must not be reported as a result.
  diff: {
    first: "First crawl · {at}",
    firstNote: "Nothing to compare against yet. Run this search again later and the changes will appear here.",
    stable: "No change since {since} · {count} questions the same",
    changed: "{added} new · {removed} gone · since {since}",
    scope: "Compares what Google returned, not what scoring later uncovered. Reordering is not a change.",
    addedHeading: "New questions",
    removedHeading: "No longer asked",
    removedNote: "A page written for these is now aimed at nothing.",
    historyHeading: "Crawl history",
    questionCount: "{count} questions",
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

  // Sign-in and credits. Wording rule, same as the status badges: name what
  // the reader has to DECIDE, not what we measured.
  auth: {
    close: "Close",
    dialogTitle: "Sign in to AnswerGap",
    benefitCredits: "Credits to run searches and check questions",
    benefitPrivate: "Your searches stay yours — nobody else sees them",
    benefitScore: "Check any question against the pages that rank for it",
    noCard: "No card. Credits are added by hand while we are in preview.",
    signIn: "Sign in with Google",
    signOut: "Sign out",
    signedInAs: "Signed in as {email}",
    account: "Account",
    failed: "Sign-in did not finish. Try again.",
    why: "Sign in to keep your searches and your credits.",
  },

  credits: {
    label: "Credits",
    balance: "{count} credits",
    empty: "No credits left",
    free: "Cached results are free — they do not use a credit.",
    manualNote: "Credits are added by hand for now; there is no checkout yet.",
  },

  error: {
    unreachable: "Could not reach the API ({url}). Is the backend running?",
    http: "{status} {statusText} — {path}",
    noCredentials: "DataForSEO credentials are missing. Copy .env.example to .env, fill it in, then restart the backend.",
    budget: "The request ceiling was reached, so the crawl stopped rather than spend more.",
    upstream: "DataForSEO could not be reached, or returned an error. A failed request is not charged.",
    badRequest: "That request cannot be run as asked.",
    // One key per ErrorKind, in all five locales. Errors render as
    // t(`error.${kind}`) and a missing key would print its own name to a
    // customer at the worst possible moment.
    signedOut: "You are signed out. Sign in to continue.",
    noCredits:
      "No credits left. A search costs one credit; cached results are free.",
    anonLimit:
      "Today's free search has been used on this connection. Sign in to keep going.",
    suspended: "This account is suspended. Get in touch and we will sort it out.",
    backToAnalyses: "Back to analyses",
    startBackend: "To start the backend, from the project root:",
    loading: "Loading…",
  },

  theme: {
    light: "Switch to dark",
    dark: "Follow the system",
    system: "Switch to light",
  },

  language: {
    label: "Interface language",
  },

  // Marketing surface. Grouped under `market` so the product-side landing
  // keys stay untouched - `landing.headline` is still what the search screen
  // reads. When these two ever diverge (a hosted marketing site separate from
  // the product page), the keys are already segregated by their prefix.
  //
  // FUTURE CONTENT is deliberately static here (pricing amounts, blog links,
  // solutions copy). CLAUDE.md's rule holds: never present static data as if
  // it were measured - so anything the user can ACT on (the search box, the
  // saved analyses, the sign-in) stays wired to the real API, and everything
  // that is purely marketing copy is what these strings describe.
  market: {
    nav: {
      pricing: "Pricing",
      solutions: "Solutions",
      aiSeo: "AI SEO",
      blog: "Blog",
      contact: "Contact",
      signIn: "Sign In",
      signUp: "Sign Up",
    },

    hero: {
      eyebrow: "AI search visibility starts here",
      headlinePre: "Rank and appear in",
      headlineHighlight: "AI-powered search",
      sub:
        "Discover what people ask, identify the answers AI engines need, " +
        "and create content that gets found, cited, and recommended.",
      searchPlaceholder: "Enter a topic — e.g. teeth whitening",
      searchCta: "Analyze",
      searching: "Searching…",
      tryLabel: "Try searching:",
      try1: "best CRM for startups",
      try2: "AI SEO tools",
    },

    howItWorks: {
      eyebrow: "How it works",
      title: "Become the answer AI search recommends.",
      sub:
        "AnswerGap reveals the questions behind AI-driven discovery so you " +
        "can create useful, structured content before competitors do.",
      card1: {
        label: "Demand Intelligence",
        title: "Map AI Search Demand",
        body:
          "Turn a single topic into a complete map of the questions people " +
          "ask across every stage of discovery and decision-making.",
      },
      card2: {
        label: "AI Visibility",
        title: "Find Citation Opportunities",
        body:
          "Identify questions with weak, incomplete, or missing answers — " +
          "exactly where clearer content has the best chance to be surfaced " +
          "by AI.",
      },
      card3: {
        label: "Authority",
        title: "Build Topical Authority",
        body:
          "Prioritize connected questions and publish comprehensive answers " +
          "that search engines and AI assistants can understand and trust.",
      },
    },

    builtFor: {
      eyebrow: "Built for AI Search",
      title: "Answer real questions. Get discovered by AI.",
      body:
        "Search is becoming a conversation. AnswerGap shows you what your " +
        "audience asks and where current answers fall short, helping your " +
        "brand earn visibility in AI Overviews, assistants, and traditional " +
        "search.",
      point1: "Create clear answers AI systems can extract and cite",
      point2: "Structure content around real conversational searches",
      point3: "Cover connected questions to strengthen topical authority",
      demoUrl: "answergap.com/search",
      demo1Q: "What is the best CRM for small business?",
      demo1Meta: "Complete answer · High visibility opportunity",
      demo2Q: "Do I need a CRM if I use Google Workspace?",
      demo2Meta: "No complete answer · High visibility opportunity",
      demo3Q: "How to migrate from spreadsheet to CRM?",
      demo3Meta: "Partial answers · Medium visibility opportunity",
    },

    pricing: {
      title: "Simple, transparent pricing",
      sub:
        "Find the questions that can grow your visibility across AI and " +
        "search. Cancel anytime.",
      starter: {
        name: "Starter",
        desc: "For creators building visibility in AI search.",
        price: "$49",
        per: "/month",
        feat1: "100 topic searches per month",
        feat2: "AI search question maps",
        feat3: "Search intent classification",
        feat4: "Opportunity export",
        cta: "Get Started",
      },
      pro: {
        name: "Pro",
        badge: "Most Popular",
        desc: "For teams scaling AI search authority.",
        price: "$149",
        per: "/month",
        feat1: "Unlimited topic searches",
        feat2: "AI visibility opportunity scoring",
        feat3: "Answer and citation gap analysis",
        feat4: "API access",
        feat5: "Priority support",
        cta: "Go Pro",
      },
      note:
        "Static pricing — checkout is not wired up yet. Credits are granted " +
        "by hand while the product is in preview.",
    },

    cta: {
      title: "Ready to become the answer?",
      sub:
        "Find the questions that matter, publish answers AI can understand, " +
        "and build visibility wherever your audience searches.",
      primary: "Start for free",
      secondary: "View pricing",
    },

    footer: {
      tagline:
        "Find the questions AI search needs answered — and help your brand " +
        "become the trusted source it recommends.",
      product: {
        heading: "Product",
        features: "Features",
        pricing: "Pricing",
        api: "API",
        changelog: "Changelog",
      },
      resources: {
        heading: "Resources",
        blog: "Blog",
        seoGuides: "SEO Guides",
        helpCenter: "Help Center",
        community: "Community",
      },
      company: {
        heading: "Company",
        about: "About",
        contact: "Contact",
        privacy: "Privacy Policy",
        terms: "Terms of Service",
      },
      copyright: "© {year} AnswerGap. All rights reserved.",
    },

    saved: {
      heading: "Your recent analyses",
      count: "{count} saved",
    },
  },
} as const;
