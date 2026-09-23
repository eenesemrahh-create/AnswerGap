import type { SolutionsShape } from "../blocks";

/**
 * English solutions copy. This file pins the shape for the four translations.
 *
 * The nine team cards describe who the product is for, not features it has,
 * so they are safe: every claim in them is about the question tree and the
 * gap check, and both exist.
 *
 * THE ADVANTAGE BULLETS ARE NOT ALL TRUE YET, and they are transcribed from
 * the approved design rather than invented here. "Explore questions by
 * intent" needs the intent classifier, "Export data for your workflow" needs
 * CSV export, and "Measure progress over time" needs history nobody records.
 * Same standing as the pricing page's feature list: the plan is to build
 * them after the screens, and CLAUDE.md item 16 is the reminder that this
 * page is making promises until then.
 *
 * The workflow steps and the closing CTA describe what the product already
 * does, and are safe.
 */
export const en = {
  title: "Solutions",
  description:
    "How SEO teams, agencies, publishers and brands use AnswerGap to find " +
    "the questions AI search has not answered yet.",

  hero: {
    eyebrow: "Built for every team shaping AI discovery",
    head: "One platform. More ways to win in",
    headTinted: "AI search.",
    headTail: "",
    lead:
      "AnswerGap helps teams understand what people ask, where AI answers " +
      "fall short, and what to create to become the source AI recommends.",
  },
  heroPrimary: "Start free",
  heroSecondary: "View pricing",

  teams: {
    eyebrow: "Solutions by team",
    heading: "Built around how you work.",
    lead:
      "From the first category search to a global content program, " +
      "AnswerGap gives every team a practical next step.",
    cards: [
      {
        title: "SaaS founders",
        desc:
          "Track AI visibility for your SaaS and uncover the questions " +
          "buyers ask before they convert.",
      },
      {
        title: "Startups",
        desc:
          "Get discovered by AI early and build authority before your " +
          "category becomes crowded.",
      },
      {
        title: "Marketing agencies",
        desc:
          "Report AI visibility across every client and turn citation gaps " +
          "into new campaign opportunities.",
      },
      {
        title: "SEO teams",
        desc:
          "Extend traditional SEO reporting to AI answers, citations, and " +
          "conversational search demand.",
      },
      {
        title: "Content teams",
        desc:
          "Prove which content drives AI visibility and prioritize the " +
          "questions most worth answering.",
      },
      {
        title: "Ecommerce",
        desc:
          "See which brands AI recommends and create useful content for " +
          "product discovery journeys.",
      },
      {
        title: "In-house marketing",
        desc:
          "Connect brand, content, and search teams around one measurable " +
          "AI visibility strategy.",
      },
      {
        title: "Enterprise brands",
        desc:
          "Monitor topics, regions, and languages at scale while " +
          "identifying gaps across your portfolio.",
      },
      {
        title: "Publishers & media",
        desc:
          "Find emerging question clusters and create authoritative " +
          "coverage that AI systems can cite.",
      },
    ],
  },

  advantage: {
    eyebrow: "One shared advantage",
    heading: "Move from questions to measurable action.",
    cards: [
      {
        title: "Discover real demand",
        desc:
          "Turn one topic into the connected questions people ask throughout " +
          "their decision journey.",
        bullets: [
          "Explore questions by intent",
          "Find overlooked topic clusters",
          "Research every market and language",
        ],
      },
      {
        title: "Find visibility gaps",
        desc:
          "See where current answers are weak, incomplete, or missing—and " +
          "where your expertise can help.",
        bullets: [
          "Prioritize high-opportunity questions",
          "Understand answer coverage",
          "Spot competitor blind spots",
        ],
      },
      {
        title: "Create with confidence",
        desc:
          "Give content and SEO teams a clear, evidence-based brief for " +
          "every page they produce.",
        bullets: [
          "Build connected content plans",
          "Export data for your workflow",
          "Measure progress over time",
        ],
      },
    ],
  },

  workflow: {
    head: "A simple workflow for a",
    headTinted: "changing search landscape",
    headTail: ".",
    lead:
      "Give everyone—from founders to enterprise search teams—the same clear " +
      "view of demand and opportunity.",
    steps: [
      {
        title: "Enter a topic",
        desc:
          "Start with a product, category, customer problem, or strategic " +
          "keyword.",
      },
      {
        title: "Map the questions",
        desc:
          "AnswerGap reveals related searches and the gaps inside existing " +
          "AI answers.",
      },
      {
        title: "Act on the opportunity",
        desc:
          "Prioritize, export, and create content designed to become a " +
          "trusted source.",
      },
    ],
  },

  cta: {
    head: "Find the gaps your audience is already searching through.",
    lead:
      "Start with a topic and turn real AI-search demand into a focused " +
      "visibility strategy.",
    primary: "Start free",
    secondary: "Talk to us",
  },
} as const satisfies SolutionsShape;
