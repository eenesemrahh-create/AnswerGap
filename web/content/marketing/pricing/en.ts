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
      "Stop guessing what the AI engines are answering. Uncover the exact " +
      "questions you need to dominate visibility and earn citations.",
  },

  billing: {
    monthly: "Monthly",
    annually: "Annually",
    save: "Save 20%",
    billedMonthly: "Billed monthly",
    billedAnnually: "Billed annually",
    plusTax: "+ Tax",
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

  faq: {
    heading: "Frequently asked questions",
    items: [
      {
        title: "What counts as a query?",
        desc:
          "One credit is one search. Expanding a keyword into its question " +
          "tree costs a single credit however many questions come back. " +
          "Checking who actually answers a question is priced separately, " +
          "because each check is its own request.",
      },
      {
        title: "Can I change my plan later?",
        desc:
          "Yes, at any time. Buy the new plan from your account page - it " +
          "starts right away and is billed separately - then make it your " +
          "default. Your old plan stops renewing at the end of the period " +
          "you have already paid for, and its credits stay usable until " +
          "then. Credits are always spent from the plan that ends first, " +
          "and a plan's unused credits expire when its period ends.",
      },
      {
        title: "Do you offer custom enterprise pricing?",
        desc:
          "Yes. If you need higher volume, white-labelled reports or " +
          "multiple workspaces, contact us and we will put together a plan " +
          "around the volume you actually run.",
      },
    ],
  },

  cta: {
    heading: "Ready to uncover the answers?",
    lead:
      "Join leading content teams who use AnswerGap to align their strategy " +
      "with AI search intent.",
    primary: "Start your 7-day free trial",
    secondary: "Contact Sales",
  },
} as const satisfies PricingShape;
