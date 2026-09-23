import type { ContactContent } from "./index";

/**
 * Kontaktseite - Übersetzung der englischen Fassung.
 *
 * Maßgeblich ist `en.ts`. `form.privacy` ist ein Versprechen und keine
 * Floskel: Das Formular sendet Name, Adresse und Nachricht an unser
 * Support-Postfach und speichert nichts. Ändert sich das, ändert sich zuerst
 * dieser Satz.
 */
export const de: ContactContent = {
  title: "Kontakt",
  description:
    "Sprechen Sie mit dem AnswerGap-Team über Enterprise-Volumen, " +
    "API-Zugang oder alles andere rund um Sichtbarkeit in der KI-Suche.",

  hero: {
    eyebrow: "Kontakt",
    head: "Gestalten wir Ihre",
    headTinted: "KI-Sichtbarkeit",
    headTail: "gemeinsam.",
    lead:
      "Ob Sie Enterprise-Größenordnungen ausloten, technische Unterstützung " +
      "zu unserer API suchen oder einfach eine strategische Frage zur " +
      "generativen Suche haben - unser Team hilft Ihnen gern weiter.",
  },

  reasons: [
    {
      title: "Enterprise-Lösungen",
      desc:
        "Individuelles Datenvolumen, bevorzugter Support und eine " +
        "maßgeschneiderte Strategie für große Marken.",
    },
    {
      title: "Technischer Support",
      desc:
        "Hilfe dabei, unsere Erkenntnisse in Ihre bestehenden SEO-Dashboards " +
        "und Arbeitsabläufe einzubinden.",
    },
    {
      title: "Strategische Partnerschaften",
      desc:
        "Gestalten Sie mit uns die Zukunft der Markenentdeckung in " +
        "generativen Engines.",
    },
  ],

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
    privacy:
      "Wir verwenden Ihre Angaben ausschließlich, um Ihnen zu antworten. Sie " +
      "gehen per E-Mail an unser Support-Postfach und werden auf dieser " +
      "Website nicht gespeichert.",
  },
};
