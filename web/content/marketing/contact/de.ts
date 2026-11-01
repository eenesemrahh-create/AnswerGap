import type { ContactContent } from "./index";

/**
 * Kontaktseite - Übersetzung der englischen Fassung. Muss `en.ts` Feld für
 * Feld entsprechen; der Typ macht das zu einem Build-Fehler.
 */
export const de: ContactContent = {
  title: "Kontakt",
  description:
    "Fragen zu Tarifen, Einrichtung oder dazu, wie aus Fragenrecherche Inhalte werden? Schreiben Sie dem GetTopQuestions-Team.",

  hero: {
    eyebrow: "Kontakt",
    head: "Fragen zu",
    headTinted: "GetTopQuestions",
    headTail: "? Fragen Sie uns.",
    lead: "Ob Sie einen Tarif wählen, die Pro-API anbinden oder herausfinden möchten, wie aus Fragenrecherche Inhalte werden: Schreiben Sie uns."
  },

  reasons: [
    {
      title: "Größere Teams",
      desc: "Sagen Sie uns, wie viele Begriffe, Websites oder Kunden Sie recherchieren, und wir besprechen, was passt."
    },
    {
      title: "Technischer Support",
      desc: "Hilfe zu Ihrem Konto, zu Exporten und zur API- oder MCP-Einrichtung im Pro-Tarif."
    },
    {
      title: "Partnerschaften und Feedback",
      desc: "Ideen, Partnerschaftsvorschläge oder Feedback dazu, wie Fragenrecherche zu Ihrer Arbeit passt."
    }
  ],

  before: {
    heading: "Bevor Sie schreiben",
    intro: "Ein paar Angaben helfen uns, gleich beim ersten Mal hilfreich zu antworten:",
    items: [
      "Die Begriffe oder Themen, die Sie recherchieren",
      "Welchen Tarif Sie nutzen oder in Betracht ziehen",
      "Bei Fragen zu API, Massensuche oder MCP: womit Sie es verbinden möchten",
      "Bei Fragen zu Abrechnung oder Konto: die E-Mail-Adresse Ihrer Registrierung"
    ],
    pricingLead: "Sie vergleichen Tarife? Die ",
    pricingLink: "Preisseite",
    pricingTail: " listet jede Funktion nach Tarif auf.",
    solutionsLead: " Wie andere Teams Fragenrecherche nutzen, erfahren Sie unter ",
    solutionsLink: "Lösungen",
    solutionsTail: "."
  },

  form: {
    name: "Vollständiger Name",
    namePlaceholder: "Erika Mustermann",
    email: "E-Mail-Adresse",
    emailPlaceholder: "erika@beispiel.de",
    company: "Unternehmen (optional)",
    companyPlaceholder: "Acme GmbH",
    subject: "Betreff",
    subjectPlaceholder: "Wie können wir helfen?",
    message: "Nachricht",
    messagePlaceholder: "Sagen Sie uns kurz, worum es geht …",
    submit: "Nachricht senden",
    sending: "Wird gesendet…",
    sent: "Danke - Ihre Nachricht ist unterwegs.",
    sentDetail: "Wir lesen jede Nachricht und antworten in der Regel innerhalb von zwei Werktagen.",
    failed: "Das konnte nicht gesendet werden. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt.",
    tooMany: "Das sind viele Nachrichten von einem Ort. Bitte versuchen Sie es später erneut.",
  },
};
