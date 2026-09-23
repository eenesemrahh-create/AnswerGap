import type { SolutionsShape } from "../blocks";

/**
 * English solutions copy. This file pins the shape for the four translations.
 *
 * The nine team cards describe who the product is for, not features it has,
 * which is why this page can ship ahead of the pricing page: every claim here
 * is about the question tree and the gap check, and both exist. The three
 * cards under "one shared advantage" are deliberately worded around what is
 * measured rather than what is promised — "where no page clears the bar" is
 * the metric the product actually computes.
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
          "Every question comes from Google's own People Also Ask, expanded " +
          "into a tree rather than a list, so you see how one topic branches " +
          "into the next.",
      },
      {
        title: "Find visibility gaps",
        desc:
          "For any question we fetch the pages that rank for it and count " +
          "how many actually answer it. Few pages clearing the bar is the " +
          "opening — and it is the number this product is built around.",
      },
      {
        title: "Create with confidence",
        desc:
          "See which sources Google's AI Overview cites for each question, " +
          "and whether your own domain is among them, before you decide what " +
          "to write.",
      },
    ],
  },
} as const satisfies SolutionsShape;
