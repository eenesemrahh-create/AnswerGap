import type { PricingShape } from "../blocks";

/**
 * English pricing copy. This file pins the shape; the four translations are
 * checked against it clause for clause.
 *
 * ────────────────────────────────────────────────────────────────────────
 * WHAT THIS PAGE CLAIMS THAT THE PRODUCT DOES NOT YET DO
 *
 * Recorded here rather than in a commit message because the words are here,
 * and whoever edits them next is the person who needs to know. Every line
 * below is copy transcribed from the approved design; none of it is invented,
 * and none of it is currently true:
 *
 *   - Deep search is built but switched off (`BATCH_AND_DEEP_ENABLED`).
 *     CSV and PNG export are gated by the plan's capabilities, set on the
 *     admin's Subscription features page - every plan must tick them for
 *     this page to be true.
 *   - Bulk searches, API access, pay-as-you-go credits and the MCP server
 *     were removed from the page on 2026-10-17 (operator): not built.
 *     Since then every plan offers the same features; only credits differ.
 *   - Monthly subscriptions. Nothing charges on a cycle; the Stripe webhook
 *     records a payment and grants no credits yet.
 *   - The 7-day trial. There is no trial state in the schema.
 *   - "24-hour search history" on Starter contradicts a standing product
 *     rule in CLAUDE.md: "Do not restrict search history (AlsoAsked's
 *     24-hour lock is bad practice)."
 *
 *   - 2026-11-01 (operator): the "Which plan fits" section and the FAQ were
 *     taken word for word from the Replit design. They say history is 24
 *     hours / 1 month / 1 year and that API access, bulk searches,
 *     pay-as-you-go and an MCP server are on Pro. None of that is built, and
 *     the cards on the same page say every plan has unlimited history.
 *
 * So this page is BUILT but must not be advertised as live until either the
 * features exist or these lines change. A pricing page is a contract offer,
 * and the one thing this codebase has been careful about is not claiming more
 * than it can show.
 * ────────────────────────────────────────────────────────────────────────
 */
export const en = {
  title: "Pricing",
  description:
    "Plans for teams who need to know which questions AI search answers, " +
    "which it does not, and who it cites.",

  hero: {
    eyebrow: null,
    head: "Pricing for the",
    headTinted: "AI Search",
    headTail: "era.",
    lead:
      "Stop guessing what your audience wants to know. Discover the questions people ask and plan content for search, AI Overviews and conversational AI.",
  },

  billing: {
    monthly: "Monthly",
    annually: "Annually",
    save: "Save 20%",
    billedMonthly: "Billed monthly",
    billedAnnually: "Billed annually",
    plusTax: "+ Tax",
    signUpNow: "Sign up now",
  },

  plans: [
    {
      name: "Starter",
      desc: "For creators and small teams building visibility in AI search.",
      priceMonthly: "$9.99",
      priceAnnual: "$7.99",
      per: "/month",
      cta: "Start 7-Day Trial",
      badge: null,
      featuresHeading: "Best starter plan",
      features: [
        "100 credits per month",
        "Unlimited users",
        "All regions",
        "All languages",
        "PNG image export",
        "Unlimited search history",
        "Deep search",
        "CSV data export",
      ],
    },
    {
      name: "Lite",
      desc: "For SEO professionals scaling AI search authority.",
      priceMonthly: "$19.99",
      priceAnnual: "$15.99",
      per: "/month",
      cta: "Go Lite",
      badge: "Most Popular",
      featuresHeading: "Most popular",
      features: [
        "300 credits per month",
        "Unlimited users",
        "All regions",
        "All languages",
        "PNG image export",
        "Unlimited search history",
        "Deep search",
        "CSV data export",
      ],
    },
    {
      name: "Pro",
      desc: "For high-volume teams and agencies requiring white-labeling.",
      priceMonthly: "$39.99",
      priceAnnual: "$31.99",
      per: "/month",
      cta: "Go Pro",
      badge: null,
      featuresHeading: "Best value for money",
      features: [
        "1,000 credits per month",
        "Unlimited users",
        "All regions",
        "All languages",
        "PNG image export",
        "Unlimited search history",
        "Deep search",
        "CSV data export",
      ],
    },
  ],

  compare: {
    heading: "Compare plan features",
    featureColumn: "Features",
    groupHeading: "Plan features",
    rows: [
      { label: "Credits per month", values: ["100", "300", "1,000"] },
      { label: "Unlimited users", values: [true, true, true] },
      { label: "All regions", values: [true, true, true] },
      { label: "All languages", values: [true, true, true] },
      { label: "PNG image export", values: [true, true, true] },
      { label: "Unlimited search history", values: [true, true, true] },
      { label: "Deep search", values: [true, true, true] },
      { label: "CSV data export", values: [true, true, true] },
    ],
  },

  guide: {
    eyebrow: "Plan selection",
    title: "Which plan fits how you work?",
    lead: "Every plan includes unlimited users, all regions and all languages. The differences are credits, how long history is kept, and how you get questions out of GetTopQuestions.",
    cards: [
      {
        name: "Starter",
        choose: "Choose Starter if you",
        points: [
          "research a handful of terms each week, up to 100 credits a month",
          "act on results the same day, since history is kept for 24 hours",
          "share findings as PNG images rather than spreadsheets"
        ],
        next: "Consider Lite when you find yourself wishing you could revisit last week's searches or open results in a spreadsheet."
      },
      {
        name: "Lite",
        choose: "Choose Lite if you",
        points: [
          "plan content regularly and need up to 300 credits a month",
          "come back to research over a few weeks with 1-month history",
          "want deep search and CSV export to sort questions into a plan"
        ],
        next: "Consider Pro when you research many terms at once or want results inside your own tools."
      },
      {
        name: "Pro",
        choose: "Choose Pro if you",
        points: [
          "run research for several clients or sites, up to 1,000 credits a month",
          "need bulk searches, API access or the MCP server",
          "keep a year of search history or want pay-as-you-go credits"
        ],
        next: "API access, bulk searches and the MCP server are only on Pro."
      }
    ],
    estimateLabel: "Estimating credits:",
    estimate: "credits are used when you run searches. A simple way to choose is to list the terms you expect to research in a typical month, across every site or client, and compare that with each plan's monthly credits. If you are unsure, starting smaller and upgrading later is a reasonable approach."
  },

  faq: {
    heading: "Frequently asked questions",
    items: [
      {
        title: "What are credits used for?",
        desc: "Credits are used for running searches. Each plan includes a monthly allowance: 100 on Starter, 300 on Lite and 1,000 on Pro. For specifics on how a particular search uses credits, contact us."
      },
      {
        title: "Can I change my plan later?",
        desc: "Yes, you can change or cancel your subscription. If you have questions about how a change applies to your billing, contact us before switching."
      },
      {
        title: "Which plan includes API access?",
        desc: "API access is available on the Pro plan only, along with bulk searches, pay-as-you-go credits and the MCP server. It lets you bring question research into your own tools and workflows."
      },
      {
        title: "What if my needs go beyond the Pro plan?",
        desc: "Get in touch through the contact page and describe what you need. We will tell you honestly what is possible."
      },
      {
        title: "Does any plan track rankings or AI citations?",
        desc: "No. GetTopQuestions is a question research tool. It helps you discover the questions people ask so you can create helpful content. It does not track rankings, monitor brands or report search volumes."
      }
    ],
  },

  cta: {
    heading: "Ready to uncover the answers?",
    lead:
      "Start with a term, find the questions people ask, and decide what to write next.",
    primary: "Start your 7-day free trial",
    secondary: "Contact Sales",
  },
} as const satisfies PricingShape;
