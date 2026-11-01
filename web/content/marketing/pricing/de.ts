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
      "Hören Sie auf zu raten, was Ihre Zielgruppe wissen will. Entdecken Sie die Fragen, die Menschen stellen, und planen Sie Inhalte für die Suche, AI Overviews und dialogische KI.",
  },

  billing: {
    monthly: "Monatlich",
    annually: "Jährlich",
    save: "20 % sparen",
    billedMonthly: "Monatlich abgerechnet",
    billedAnnually: "Jährlich abgerechnet",
    plusTax: "+ Steuern",
    signUpNow: "Jetzt registrieren",
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

  guide: {
    eyebrow: "Tarifwahl",
    title: "Welcher Tarif passt zu Ihrer Arbeitsweise?",
    lead: "Jeder Tarif umfasst unbegrenzt viele Nutzer, alle Regionen und alle Sprachen. Die Unterschiede liegen bei den Credits, der Aufbewahrung des Verlaufs und dabei, wie Sie Fragen aus GetTopQuestions herausholen.",
    cards: [
      {
        name: "Starter",
        choose: "Wählen Sie Starter, wenn Sie",
        points: [
          "jede Woche eine Handvoll Begriffe recherchieren, bis zu 100 Credits im Monat",
          "noch am selben Tag handeln, denn der Verlauf bleibt 24 Stunden erhalten",
          "Ergebnisse als PNG-Bilder statt als Tabellen teilen"
        ],
        next: "Ziehen Sie Lite in Betracht, wenn Sie die Suchen der letzten Woche wieder aufrufen oder Ergebnisse in einer Tabelle öffnen möchten."
      },
      {
        name: "Lite",
        choose: "Wählen Sie Lite, wenn Sie",
        points: [
          "regelmäßig Inhalte planen und bis zu 300 Credits im Monat brauchen",
          "mit 1 Monat Verlauf über mehrere Wochen zu Ihrer Recherche zurückkehren",
          "Deep Search und CSV-Export nutzen wollen, um Fragen in einen Plan zu sortieren"
        ],
        next: "Ziehen Sie Pro in Betracht, wenn Sie viele Begriffe gleichzeitig recherchieren oder Ergebnisse in Ihren eigenen Tools möchten."
      },
      {
        name: "Pro",
        choose: "Wählen Sie Pro, wenn Sie",
        points: [
          "für mehrere Kunden oder Websites recherchieren, bis zu 1.000 Credits im Monat",
          "Massensuchen, API-Zugang oder den MCP-Server brauchen",
          "ein Jahr Suchverlauf behalten oder Pay-as-you-go-Credits wollen"
        ],
        next: "API-Zugang, Massensuchen und der MCP-Server sind nur bei Pro enthalten."
      }
    ],
    estimateLabel: "Credits schätzen:",
    estimate: "Credits werden bei Suchen verbraucht. Am einfachsten listen Sie die Begriffe auf, die Sie in einem typischen Monat über alle Websites oder Kunden hinweg recherchieren wollen, und vergleichen das mit den monatlichen Credits jedes Tarifs. Im Zweifel ist es sinnvoll, klein anzufangen und später aufzustocken."
  },

  faq: {
    heading: "Häufig gestellte Fragen",
    items: [
      {
        title: "Wofür werden Credits verwendet?",
        desc: "Credits werden für Suchen verwendet. Jeder Tarif enthält ein monatliches Kontingent: 100 bei Starter, 300 bei Lite und 1.000 bei Pro. Details dazu, wie eine bestimmte Suche Credits verbraucht, erhalten Sie von uns."
      },
      {
        title: "Kann ich meinen Tarif später ändern?",
        desc: "Ja, Sie können Ihr Abonnement ändern oder kündigen. Wenn Sie Fragen dazu haben, wie sich eine Änderung auf Ihre Abrechnung auswirkt, kontaktieren Sie uns vor dem Wechsel."
      },
      {
        title: "Welcher Tarif enthält API-Zugang?",
        desc: "API-Zugang gibt es nur im Pro-Tarif, zusammen mit Massensuchen, Pay-as-you-go-Credits und dem MCP-Server. Damit holen Sie die Fragenrecherche in Ihre eigenen Tools und Abläufe."
      },
      {
        title: "Was, wenn mein Bedarf über den Pro-Tarif hinausgeht?",
        desc: "Melden Sie sich über die Kontaktseite und beschreiben Sie, was Sie brauchen. Wir sagen Ihnen ehrlich, was möglich ist."
      },
      {
        title: "Verfolgt ein Tarif Rankings oder KI-Zitate?",
        desc: "Nein. GetTopQuestions ist ein Tool für die Fragenrecherche. Es hilft Ihnen, die Fragen der Menschen zu entdecken, damit Sie hilfreiche Inhalte erstellen können. Es verfolgt keine Rankings, überwacht keine Marken und meldet keine Suchvolumen."
      }
    ],
  },

  cta: {
    heading: "Bereit, die Antworten zu finden?",
    lead:
      "Beginnen Sie mit einem Begriff, finden Sie die Fragen der Menschen und entscheiden Sie, was Sie als Nächstes schreiben.",
    primary: "7 Tage kostenlos testen",
    secondary: "Vertrieb kontaktieren",
  },
};
