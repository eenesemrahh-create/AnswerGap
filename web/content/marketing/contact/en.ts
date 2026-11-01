import type { ContactShape } from "../blocks";

/**
 * English contact copy, word for word from the Replit design (operator,
 * 2026-11-01). This file pins the shape for the four translations.
 */
export const en = {
  title: "Contact",
  description:
    "Questions about plans, setup or turning question research into content? Send the GetTopQuestions team a note.",

  hero: {
    eyebrow: "Contact Us",
    head: "Questions about",
    headTinted: "GetTopQuestions",
    headTail: "? Ask us.",
    lead: "Whether you are choosing a plan, connecting the Pro API, or figuring out how to turn question research into content, send us a note."
  },

  reasons: [
    {
      title: "Larger Teams",
      desc: "Tell us how many terms, sites or clients you research and we will talk through what fits."
    },
    {
      title: "Technical Support",
      desc: "Help with your account, exports, and API or MCP setup on the Pro plan."
    },
    {
      title: "Partnerships and Feedback",
      desc: "Ideas, partnership proposals or feedback on how question research fits your work."
    }
  ],

  before: {
    heading: "Before you write",
    intro: "Including a few details helps us give a useful answer the first time:",
    items: [
      "The terms or topics you are researching",
      "Which plan you are on, or are considering",
      "For API, bulk or MCP questions: what you want to connect it to",
      "For billing or account questions: the email you signed up with"
    ],
    pricingLead: "Comparing plans? The ",
    pricingLink: "pricing page",
    pricingTail: " lists every feature by plan.",
    solutionsLead: " Wondering how other teams use question research? See ",
    solutionsLink: "solutions",
    solutionsTail: "."
  },

  form: {
    name: "Full Name",
    namePlaceholder: "Jane Doe",
    email: "Email Address",
    emailPlaceholder: "jane@example.com",
    company: "Company (Optional)",
    companyPlaceholder: "Acme Corp",
    subject: "Subject",
    subjectPlaceholder: "How can we help?",
    message: "Message",
    messagePlaceholder: "Tell us a bit about your needs...",
    submit: "Send Message",
    sending: "Sending…",
    sent: "Thanks — your message is on its way.",
    sentDetail: "We read every message and usually reply within two working days.",
    failed: "That did not send. Please try again, or email us directly.",
    tooMany: "That is a lot of messages from one place. Please try again later.",
  },
} as const satisfies ContactShape;
