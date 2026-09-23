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
        "24 Stunden Suchverlauf",
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
        "1 Monat Suchverlauf",
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
        "1 Jahr Suchverlauf",
        "Tiefe Suche",
        "CSV-Datenexport",
        "Massensuchen",
        "API-Zugang",
        "Credits nach Verbrauch",
        "MCP-Server",
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
      { label: "Suchverlauf", values: ["24 Stunden", "1 Monat", "1 Jahr"] },
      { label: "Tiefe Suche", values: [false, true, true] },
      { label: "CSV-Datenexport", values: [false, true, true] },
      { label: "Massensuchen", values: [false, false, true] },
      { label: "API-Zugang", values: [false, false, true] },
      { label: "Credits nach Verbrauch", values: [false, false, true] },
      { label: "MCP-Server", values: [false, false, true] },
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
          "Ja, jederzeit. Ein Wechsel nach oben gilt sofort; ein Wechsel nach " +
          "unten gilt zum Ende des Zeitraums, den Sie bereits bezahlt haben. " +
          "Bereits gekaufte Credits bleiben Ihnen erhalten.",
      },
      {
        title: "Wie funktioniert der API-Zugang?",
        desc:
          "Pro enthält API-Zugang und einen MCP-Server, damit Ihre eigenen " +
          "Werkzeuge und Assistenten Suchen ausführen und Ergebnisse direkt " +
          "lesen können, statt über diese Oberfläche.",
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
