import type { AiSeoShape } from "../blocks";

/**
 * English AI SEO copy. This file pins the shape for the four translations.
 *
 * EVERY FIGURE ON THIS PAGE WAS MEASURED IN THIS REPOSITORY. Keep it that way;
 * a page selling honesty about AI search cannot open with a borrowed statistic.
 *   32 / 32  Phase 0: every expanded People Also Ask element came back as
 *            `people_also_ask_ai_overview_expanded_element` (CLAUDE.md, "How a
 *            gap is computed").
 *   13 / 16  The teeth-whitening demo tree: AI Overview cited sources for 13
 *            of the 16 questions checked (CLAUDE.md, 2026-09-17 session).
 *   ~15 questions, five levels  One request with click depth 4 (CLAUDE.md,
 *            "DataForSEO rules").
 *
 * The "what we don't claim" section is the product's accuracy rules turned
 * outward: Google only, a dated snapshot, a gap verdict that is an estimate
 * (precision 0.20 on 14 labels), and prompt volume that cannot be bought.
 *
 * The citable-page advice is general good practice and is worded as such:
 * nobody outside Google knows how AI Overview picks its sources, and the
 * section says so in its lead rather than implying a formula.
 *
 * The demo rows are illustrative and the badge says "Example". Their
 * questions are real ones from the teeth-whitening tree; their numbers are
 * not a measurement.
 */
export const en = {
  title: "AI SEO: get cited in Google's AI Overview",
  description:
    "Google now answers many questions with an AI Overview that names a few " +
    "sources. See which questions people ask, which ones no page answers, " +
    "and which sites the AI cites, including yours.",

  hero: {
    eyebrow: "AI SEO",
    head: "Become the source",
    headTinted: "AI search cites.",
    headTail: "",
    lead:
      "Google now answers many questions with an AI Overview and names a few " +
      "sources beside it. AnswerGap shows what people ask, which questions no " +
      "page really answers, and which sites the AI cites, including yours.",
  },
  heroPrimary: "Start free",
  heroSecondary: "See how it works",

  shift: {
    eyebrow: "What changed",
    heading: "The answer now comes before the links.",
    lead:
      "Search used to be ten blue links. Now an AI-written answer sits on top " +
      "of them, and it decides which few sites get named.",
    cards: [
      {
        figure: "32 / 32",
        title: "People Also Ask answers with AI",
        desc:
          "In a sample we pulled while building this product, every one of 32 " +
          "expanded People Also Ask answers was an AI Overview, not a quote " +
          "from a page.",
      },
      {
        figure: "13 / 16",
        title: "The AI names its sources",
        desc:
          "On a teeth-whitening topic, Google's AI Overview cited sources for " +
          "13 of the 16 questions we checked. Those few links are the new " +
          "front page.",
      },
      {
        figure: "Above #1",
        title: "Rank tracking can't see it",
        desc:
          "A rank tracker reports your position in the list. It does not tell " +
          "you whether the answer above the list names you, and that answer " +
          "is what people read first.",
      },
    ],
  },

  product: {
    eyebrow: "What AnswerGap measures",
    heading: "From one keyword to a list of openings.",
    lead:
      "Three things, read from the same Google results, shown side by side for " +
      "every question in the tree.",
    points: [
      {
        title: "What people ask",
        desc:
          "One search opens Google's People Also Ask chain: about 15 questions, " +
          "five levels deep, in the country and language you choose.",
      },
      {
        title: "Which questions nobody answers",
        desc:
          "We read the search results behind a question and count the pages " +
          "that genuinely target it. Few or none is a gap: a question you can " +
          "own. Every verdict shows its evidence.",
      },
      {
        title: "Who the AI cites, and whether it's you",
        desc:
          "Each checked question lists the sites Google's AI Overview cites. " +
          "Enter your domain to see where you are named, and where a " +
          "competitor is instead.",
      },
    ],
    demo: {
      badge: "Example",
      seed: "teeth whitening",
      pagesLabel: "{matching} of {checked} pages target it",
      rows: [
        {
          question: "Do dentists recommend teeth whitening?",
          status: "gap",
          label: "Unanswered",
          matching: 0,
          checked: 8,
          ai: "AI 4",
          you: false,
        },
        {
          question: "What whitens teeth fastest?",
          status: "weak",
          label: "Barely answered",
          matching: 1,
          checked: 7,
          ai: "AI 6",
          you: false,
        },
        {
          question: "How much does teeth whitening cost?",
          status: "covered",
          label: "Well answered",
          matching: 6,
          checked: 8,
          ai: "AI 5 · you",
          you: true,
        },
      ],
      note:
        "Illustrative. A real result lists every page we read and every site " +
        "the AI cites.",
    },
  },

  playbook: {
    head: "A playbook for",
    headTinted: "AI search",
    headTail: ".",
    lead:
      "Four steps, repeated. The tree tells you where to start; searching " +
      "again tells you whether it worked.",
    steps: [
      {
        title: "Search your topic",
        desc:
          "Start with the words your customers use. One search is one credit, " +
          "and the AI Overview sources come with it.",
      },
      {
        title: "Pick the gaps",
        desc:
          "Sort the table by pages targeting each question. Fewest first is " +
          "where an answer is missing.",
      },
      {
        title: "Check who the AI cites",
        desc:
          "Enter your domain. Questions where the AI names a competitor and " +
          "not you are your second list.",
      },
      {
        title: "Write the answer, then search again",
        desc:
          "Publish a page that answers the question directly, then run the " +
          "search again. Every result is dated, so you can compare.",
      },
    ],
  },

  citable: {
    eyebrow: "Writing for AI answers",
    heading: "What makes a page easy to cite.",
    lead:
      "Nobody outside Google knows exactly how AI Overview picks its sources. " +
      "These habits make an answer easy to find, quote and trust, which is " +
      "good for human readers either way.",
    cards: [
      {
        title: "Answer in the first sentence",
        desc:
          "Put the direct answer right under the heading, then explain. An " +
          "answer buried in the fourth paragraph is hard to quote.",
      },
      {
        title: "Use the question as the heading",
        desc:
          "Phrase headings the way people ask. It is how the question already " +
          "appears in People Also Ask.",
      },
      {
        title: "One question, one section",
        desc:
          "Give each question its own clearly bounded section, so a passage " +
          "still makes sense when it is lifted out alone.",
      },
      {
        title: "Cover the follow-ups",
        desc:
          "The tree shows what people ask next. Answering a question's " +
          "children makes your page the complete source, not one of many.",
      },
      {
        title: "Show your evidence",
        desc:
          "Numbers, named sources and a named author. A specific claim is " +
          "easier to trust than a general one.",
      },
      {
        title: "Keep it dated and current",
        desc:
          "Show when the page was last updated, and revisit it when the " +
          "questions in your tree change.",
      },
    ],
  },

  limits: {
    eyebrow: "Plainly stated",
    heading: "What we don't claim.",
    lead:
      "AI search is new, and many tools in it sell certainty nobody has. This " +
      "is exactly what AnswerGap measures, and what it doesn't.",
    items: [
      {
        title: "Google only, for now",
        desc:
          "We read Google's AI Overview. ChatGPT, Claude and Perplexity are not " +
          "measured, and nobody can sell you their real prompt volumes.",
      },
      {
        title: "A snapshot, not live",
        desc:
          "Every result carries the time it was fetched. Google's results " +
          "move; search again to refresh.",
      },
      {
        title: "The gap verdict is an estimate",
        desc:
          "It is computed from the pages we read and it will sometimes be " +
          "wrong. The evidence is always shown, and you can mark any verdict " +
          "right or wrong.",
      },
      {
        title: "No guaranteed citations",
        desc:
          "Nobody can promise an AI will cite you. We show where the opening " +
          "is; the answer is yours to write.",
      },
    ],
  },

  faq: {
    heading: "AI SEO, briefly",
    items: [
      {
        title: "What is AI SEO?",
        desc:
          "AI SEO, also called GEO (generative engine optimization) or AEO " +
          "(answer engine optimization), is the work of getting your content " +
          "used and cited in AI-written answers such as Google's AI Overview, " +
          "not only ranked in the links below them.",
      },
      {
        title: "Is AI SEO different from regular SEO?",
        desc:
          "It builds on it. AI answers draw on pages search engines can already " +
          "find, so crawlability and quality still matter. What changes is the " +
          "target: a clear, quotable answer to a specific question, rather than " +
          "a page that ranks for a keyword.",
      },
      {
        title: "Which AI engines does AnswerGap track?",
        desc:
          "Google's AI Overview, read from the same search results we use to " +
          "find gaps. Other assistants are not tracked today.",
      },
      {
        title: "How does AnswerGap decide a question is a gap?",
        desc:
          "For each question we fetch the search results and compare every " +
          "page against the question, then count the pages that genuinely " +
          "target it. Few or none means a gap. It is an estimate, and the " +
          "pages behind it are always shown.",
      },
      {
        title: "What does it cost?",
        desc:
          "Every search is one credit, and the AI Overview sources come with " +
          "it at no extra cost. Reopening a result you already have is free.",
      },
    ],
  },

  cta: {
    head: "Find the questions AI answers without you.",
    lead:
      "Search a topic and see the gaps, and the sites the AI cites, in one view.",
    primary: "Start free",
    secondary: "View pricing",
  },
} as const satisfies AiSeoShape;
