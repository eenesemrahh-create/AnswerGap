import type { SolutionsShape } from "../blocks";

/**
 * English solutions copy. This file pins the shape for the four translations.
 *
 * Word for word from the Replit design (operator, 2026-11-01), with only the
 * product name changed.
 *
 * THE TEAM EXAMPLES ARE WRITTEN BY HAND AND SAY SO ON THE SCREEN (`teams.lead`),
 * which is what keeps them inside CLAUDE.md's rule on static data. Two claims
 * are not true yet: "Read questions by intent" needs an intent classifier, and
 * "most-asked" conflicts with "PAA ordering is NOT popularity ordering".
 */
export const en = {
  title: "Solutions",
  description: "How founders, agencies, SEO and content teams use GetTopQuestions to discover the questions people ask and plan helpful content.",
  hero: {
    eyebrow: "Built for everyone who decides what to write next",
    head: "One term. Many teams.",
    headTinted: "Better questions.",
    headTail: "",
    lead: "GetTopQuestions helps teams discover the questions people ask around a term, then turn them into helpful content for traditional search, Google AI Overviews and conversational AI search."
  },
  heroPrimary: "Start free",
  heroSecondary: "View pricing",
  teams: {
    eyebrow: "Solutions by team",
    heading: "Built around how you work.",
    lead: "Each card shows an illustrative term, a question it might surface, and the kind of content a team could create from it. Examples are written by us, not app output.",
    questionLabel: "Example question",
    ideaLabel: "Content idea",
    cards: [
      {
        title: "SaaS founders",
        desc: "Learn the questions buyers ask before they sign up, and answer them on your site in their words.",
        term: "employee onboarding software",
        question: "What should an onboarding checklist include for remote hires?",
        idea: "A practical checklist page that mentions your product only where it genuinely helps."
      },
      {
        title: "Startups",
        desc: "Build helpful coverage of your category early, so new audiences find clear answers from you.",
        term: "carbon accounting",
        question: "Do small companies need to report emissions?",
        idea: "A plain-language explainer with a clear \"it depends\" section by situation."
      },
      {
        title: "Marketing agencies",
        desc: "Bring question research into client kickoffs and turn it into content proposals grounded in real curiosity.",
        term: "home solar panels",
        question: "How long do solar panels take to pay for themselves?",
        idea: "A client-ready brief: one guide, three FAQ answers, a short video script."
      },
      {
        title: "SEO teams",
        desc: "Add question research to keyword work and plan pages that cover a topic thoroughly for search and AI answers.",
        term: "mortgage refinancing",
        question: "Is it worth refinancing for a small rate drop?",
        idea: "Restructure an existing page with question-led subheadings and direct answers."
      },
      {
        title: "Content teams",
        desc: "Fill editorial planning with questions your readers actually ask, and decide which deserve a piece.",
        term: "houseplant care",
        question: "Why are my monstera leaves turning yellow?",
        idea: "A troubleshooting guide, plus a series of short answers for social."
      },
      {
        title: "Ecommerce",
        desc: "Answer pre-purchase questions on product, category and guide pages to help shoppers decide.",
        term: "cast iron skillet",
        question: "Can you use soap on a cast iron pan?",
        idea: "A care section on the product page and a longer seasoning guide."
      },
      {
        title: "In-house marketing",
        desc: "Give brand, content and search colleagues one shared list of customer questions to work from.",
        term: "business travel insurance",
        question: "Does travel insurance cover cancelled conferences?",
        idea: "A shared FAQ library used by the blog, help center and sales team."
      },
      {
        title: "Enterprise brands",
        desc: "Research topics across regions and languages to see how questions shift from market to market.",
        term: "heat pump",
        question: "Do heat pumps work in very cold winters?",
        idea: "Localized answers per market, reviewed by regional experts."
      },
      {
        title: "Publishers & media",
        desc: "Find the questions readers keep asking around a story and build helpful, explanatory coverage.",
        term: "four-day work week",
        question: "Do four-day work weeks reduce pay?",
        idea: "An explainer that answers the follow-up questions a news piece leaves open."
      }
    ]
  },
  advantage: {
    eyebrow: "One shared advantage",
    heading: "Move from questions to useful content.",
    cards: [
      {
        title: "Discover real questions",
        desc: "Turn one term into the most-asked related questions people raise as they learn, compare and decide.",
        bullets: [
          "Read questions by intent",
          "Notice overlooked subtopics",
          "Research across regions and languages"
        ]
      },
      {
        title: "Find content gaps",
        desc: "Compare the questions with what you have already published and see where your expertise could help.",
        bullets: [
          "Shortlist questions you can answer well",
          "Spot pages missing an FAQ",
          "Choose what deserves its own piece"
        ]
      },
      {
        title: "Create with confidence",
        desc: "Give writers a question-led starting point for every page, video or post they produce.",
        bullets: [
          "Plan connected content by hand",
          "Export questions on supported plans",
          "Keep the writing in your voice"
        ]
      }
    ]
  },
  workflow: {
    heading: "A simple workflow for a changing search landscape.",
    lead: "Give everyone, from solo creators to large search teams, the same simple starting point: what are people asking?",
    steps: [
      {
        title: "Enter a topic",
        desc: "Start with a product, category, customer problem, or strategic keyword."
      },
      {
        title: "Map the questions",
        desc: "GetTopQuestions surfaces the most-asked related questions around your term."
      },
      {
        title: "Act on the opportunity",
        desc: "Choose the questions you can answer best and create helpful content in your own voice."
      }
    ]
  },
  cta: {
    head: "Find the questions your audience is already asking.",
    lead: "Start with a term and leave with a clear idea of what to write next.",
    primary: "Start free",
    secondary: "Talk to us"
  }
} as const satisfies SolutionsShape;
