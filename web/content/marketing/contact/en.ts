import type { ContactShape } from "../blocks";

/**
 * English contact copy. This file pins the shape for the four translations.
 *
 * `form.privacy` is a promise, so it is a visible sentence rather than a
 * tooltip: the form posts a name, an address and a message to the API, which
 * mails them to the support mailbox and stores nothing. If that ever stops
 * being true, this line is the first thing that has to change.
 */
export const en = {
  title: "Contact",
  description:
    "Talk to the AnswerGap team about enterprise volume, API access or " +
    "anything else about AI search visibility.",

  hero: {
    eyebrow: "Contact Us",
    head: "Let's shape your",
    headTinted: "AI visibility",
    headTail: "together.",
    lead:
      "Whether you're exploring enterprise scale, looking for technical " +
      "guidance on our API, or just have a strategic question about " +
      "generative search, our team is ready to help.",
  },

  reasons: [
    {
      title: "Enterprise Solutions",
      desc:
        "Custom data volume, priority support, and bespoke strategy for " +
        "large brands.",
    },
    {
      title: "Technical Support",
      desc:
        "Get help integrating our insights into your existing SEO " +
        "dashboards and workflows.",
    },
    {
      title: "Strategic Partnerships",
      desc:
        "Join us in mapping out the future of brand discovery in " +
        "generative engines.",
    },
  ],

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
    privacy:
      "We use what you send here to answer you, and nothing else. It is " +
      "emailed to our support mailbox and not stored on this site.",
  },
} as const satisfies ContactShape;
