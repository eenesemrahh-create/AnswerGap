import type { PricingContent } from "./index";

/**
 * Preisseite - Übersetzung der englischen Fassung.
 *
 * Maßgeblich ist `en.ts`; dort steht auch der Hinweis, welche dieser Leistungen
 * noch nicht gebaut sind. Diese Datei muss der englischen Fassung Karte für
 * Karte und Zeile für Zeile entsprechen; der Typ macht daraus einen
 * Compile-Fehler. Preise werden unverändert übernommen.
 */
export const de: PricingContent = {
  title: "Preise",
  description:
    "Tarife für Teams, die wissen müssen, welche Fragen die KI-Suche " +
    "beantwortet, welche nicht und wen sie zitiert.",

  hero: {
    eyebrow: null,
    head: "Preise für das Zeitalter der",
    headTinted: "KI-Suche.",
    headTail: "",
    lead:
      "Hören Sie auf zu raten, was die KI-Engines beantworten. Finden Sie " +
      "genau die Fragen, mit denen Sie Sichtbarkeit gewinnen und zitiert werden.",
  },

  billing: {
    monthly: "Monatlich",
    annually: "Jährlich",
    save: "20 % sparen",
    billedMonthly: "Monatlich abgerechnet",
    billedAnnually: "Jährlich abgerechnet",
    plusTax: "+ Steuern",
  },

  plans: [
    {
      name: "Starter",
      desc: "Für Creator und kleine Teams, die Sichtbarkeit in der KI-Suche aufbauen.",
      priceMonthly: "$9.99",
      priceAnnual: "$7.99",
      per: "/Monat",
      cta: "7 Tage kostenlos testen",
      badge: null,
      featuresHeading: "Bester Einstiegstarif",
      features: [
        "100 Credits pro Monat",
        "Unbegrenzt viele Nutzer",
        "Alle Regionen",
        "Alle Sprachen",
        "PNG-Bildexport",
        "Unbegrenzter Suchverlauf",
        "Tiefe Suche",
        "CSV-Datenexport",
      ],
    },
    {
      name: "Lite",
      desc: "Für SEO-Profis, die ihre Autorität in der KI-Suche ausbauen.",
      priceMonthly: "$19.99",
      priceAnnual: "$15.99",
      per: "/Monat",
      cta: "Lite wählen",
      badge: "Am beliebtesten",
      featuresHeading: "Am beliebtesten",
      features: [
        "300 Credits pro Monat",
        "Unbegrenzt viele Nutzer",
        "Alle Regionen",
        "Alle Sprachen",
        "PNG-Bildexport",
        "Unbegrenzter Suchverlauf",
        "Tiefe Suche",
        "CSV-Datenexport",
      ],
    },
    {
      name: "Pro",
      desc: "Für Teams und Agenturen mit hohem Volumen, die White-Labeling brauchen.",
      priceMonthly: "$39.99",
      priceAnnual: "$31.99",
      per: "/Monat",
      cta: "Pro wählen",
      badge: null,
      featuresHeading: "Bestes Preis-Leistungs-Verhältnis",
      features: [
        "1.000 Credits pro Monat",
        "Unbegrenzt viele Nutzer",
        "Alle Regionen",
        "Alle Sprachen",
        "PNG-Bildexport",
        "Unbegrenzter Suchverlauf",
        "Tiefe Suche",
        "CSV-Datenexport",
      ],
    },
  ],

  compare: {
    heading: "Tarifleistungen vergleichen",
    featureColumn: "Funktionen",
    groupHeading: "Tarifleistungen",
    rows: [
      { label: "Credits pro Monat", values: ["100", "300", "1.000"] },
      { label: "Unbegrenzt viele Nutzer", values: [true, true, true] },
      { label: "Alle Regionen", values: [true, true, true] },
      { label: "Alle Sprachen", values: [true, true, true] },
      { label: "PNG-Bildexport", values: [true, true, true] },
      { label: "Unbegrenzter Suchverlauf", values: [true, true, true] },
      { label: "Tiefe Suche", values: [true, true, true] },
      { label: "CSV-Datenexport", values: [true, true, true] },
    ],
  },

  faq: {
    heading: "Häufig gestellte Fragen",
    items: [
      {
        title: "Was zählt als Abfrage?",
        desc:
          "Ein Credit ist eine Suche. Ein Keyword zu seinem Fragenbaum " +
          "aufzuklappen kostet einen einzigen Credit, gleich wie viele Fragen " +
          "zurückkommen. Zu prüfen, wer eine Frage tatsächlich beantwortet, " +
          "wird gesondert berechnet, weil jede Prüfung eine eigene Anfrage ist.",
      },
      {
        title: "Kann ich meinen Tarif später wechseln?",
        desc:
          "Ja, jederzeit. Kaufen Sie den neuen Tarif auf Ihrer Kontoseite - " +
          "er beginnt sofort und wird separat abgerechnet - und machen Sie " +
          "ihn zu Ihrem Standardtarif. Ihr bisheriger Tarif verlängert sich " +
          "zum Ende des bereits bezahlten Zeitraums nicht mehr, seine Credits " +
          "bleiben bis dahin nutzbar. Credits werden immer zuerst aus dem " +
          "Tarif verbraucht, der am frühesten endet; nicht genutzte Credits " +
          "eines Tarifs verfallen am Ende seines Zeitraums.",
      },
      {
        title: "Gibt es individuelle Enterprise-Preise?",
        desc:
          "Ja. Wenn Sie höheres Volumen, Berichte im White-Label oder mehrere " +
          "Workspaces brauchen, sprechen Sie uns an, und wir stellen einen " +
          "Tarif für das Volumen zusammen, das Sie tatsächlich fahren.",
      },
    ],
  },

  cta: {
    heading: "Bereit, die Antworten zu finden?",
    lead:
      "Schließen Sie sich führenden Content-Teams an, die mit AnswerGap ihre " +
      "Strategie auf die Intention der KI-Suche ausrichten.",
    primary: "7 Tage kostenlos testen",
    secondary: "Vertrieb kontaktieren",
  },
};
