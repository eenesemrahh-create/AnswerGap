import type { SolutionsContent } from "./index";

/**
 * Lösungsseite - Übersetzung der englischen Fassung.
 *
 * Maßgeblich ist `en.ts`. Diese Datei muss ihr Karte für Karte entsprechen -
 * neun Team-Karten bleiben neun, drei Vorteilskarten bleiben drei, mit je drei
 * Stichpunkten, und der Ablauf bleibt bei drei Schritten; der Typ macht aus
 * jeder Abweichung einen Compile-Fehler.
 */
export const de: SolutionsContent = {
  title: "Lösungen",
  description: "Wie Gründer, Agenturen, SEO- und Content-Teams mit GetTopQuestions die Fragen der Menschen entdecken und hilfreiche Inhalte planen.",
  hero: {
    eyebrow: "Für alle, die entscheiden, was als Nächstes geschrieben wird",
    head: "Ein Begriff. Viele Teams.",
    headTinted: "Bessere Fragen.",
    headTail: "",
    lead: "GetTopQuestions hilft Teams, die Fragen rund um einen Begriff zu entdecken und daraus hilfreiche Inhalte für die klassische Suche, Google AI Overviews und die dialogische KI-Suche zu machen."
  },
  heroPrimary: "Kostenlos starten",
  heroSecondary: "Preise ansehen",
  teams: {
    eyebrow: "Lösungen nach Team",
    heading: "Gebaut für Ihre Arbeitsweise.",
    lead: "Jede Karte zeigt einen Beispielbegriff, eine mögliche Frage dazu und die Art von Inhalt, die ein Team daraus erstellen könnte. Die Beispiele stammen von uns, nicht aus der App.",
    questionLabel: "Beispielfrage",
    ideaLabel: "Content-Idee",
    cards: [
      {
        title: "SaaS-Gründer",
        desc: "Erfahren Sie, was Käufer vor der Anmeldung fragen, und beantworten Sie es auf Ihrer Website in deren Worten.",
        term: "Onboarding-Software",
        question: "Was gehört in eine Onboarding-Checkliste für Remote-Mitarbeitende?",
        idea: "Eine praktische Checkliste, die Ihr Produkt nur dort erwähnt, wo es wirklich hilft."
      },
      {
        title: "Startups",
        desc: "Decken Sie Ihre Kategorie früh hilfreich ab, damit neue Zielgruppen klare Antworten bei Ihnen finden.",
        term: "CO₂-Bilanzierung",
        question: "Müssen kleine Unternehmen Emissionen berichten?",
        idea: "Eine verständliche Erklärung mit einem klaren „Kommt darauf an“-Abschnitt je nach Situation."
      },
      {
        title: "Marketing-Agenturen",
        desc: "Bringen Sie Fragenrecherche in Kunden-Kickoffs und machen Sie daraus Content-Vorschläge, die auf echter Neugier beruhen.",
        term: "Solaranlage fürs Haus",
        question: "Wann amortisieren sich Solarmodule?",
        idea: "Ein kundenfertiges Briefing: ein Leitfaden, drei FAQ-Antworten, ein kurzes Videoskript."
      },
      {
        title: "SEO-Teams",
        desc: "Ergänzen Sie die Keyword-Arbeit um Fragenrecherche und planen Sie Seiten, die ein Thema für Suche und KI-Antworten gründlich abdecken.",
        term: "Anschlussfinanzierung",
        question: "Lohnt sich eine Umschuldung bei einer kleinen Zinssenkung?",
        idea: "Eine bestehende Seite mit fragegeleiteten Zwischenüberschriften und direkten Antworten neu gliedern."
      },
      {
        title: "Content-Teams",
        desc: "Füllen Sie die Redaktionsplanung mit Fragen, die Ihre Leser wirklich stellen, und entscheiden Sie, welche einen eigenen Beitrag verdienen.",
        term: "Zimmerpflanzen pflegen",
        question: "Warum werden die Blätter meiner Monstera gelb?",
        idea: "Ein Leitfaden zur Fehlerbehebung plus eine Reihe kurzer Antworten für Social Media."
      },
      {
        title: "E-Commerce",
        desc: "Beantworten Sie Fragen vor dem Kauf auf Produkt-, Kategorie- und Ratgeberseiten und helfen Sie bei der Entscheidung.",
        term: "Gusseisenpfanne",
        question: "Darf man eine Gusseisenpfanne mit Spülmittel reinigen?",
        idea: "Ein Pflegeabschnitt auf der Produktseite und ein längerer Leitfaden zum Einbrennen."
      },
      {
        title: "Inhouse-Marketing",
        desc: "Geben Sie Marken-, Content- und Suchkollegen eine gemeinsame Liste von Kundenfragen als Arbeitsgrundlage.",
        term: "Geschäftsreiseversicherung",
        question: "Deckt eine Reiseversicherung abgesagte Konferenzen ab?",
        idea: "Eine gemeinsame FAQ-Bibliothek für Blog, Hilfe-Center und Vertrieb."
      },
      {
        title: "Enterprise-Marken",
        desc: "Recherchieren Sie Themen über Regionen und Sprachen hinweg und sehen Sie, wie sich Fragen von Markt zu Markt verändern.",
        term: "Wärmepumpe",
        question: "Funktionieren Wärmepumpen in sehr kalten Wintern?",
        idea: "Lokalisierte Antworten je Markt, geprüft von regionalen Fachleuten."
      },
      {
        title: "Verlage & Medien",
        desc: "Finden Sie die Fragen, die Leser rund um eine Geschichte immer wieder stellen, und bauen Sie hilfreiche, erklärende Berichterstattung auf.",
        term: "Vier-Tage-Woche",
        question: "Sinkt das Gehalt bei einer Vier-Tage-Woche?",
        idea: "Ein Erklärstück, das die Folgefragen beantwortet, die eine Nachricht offenlässt."
      }
    ]
  },
  advantage: {
    eyebrow: "Ein gemeinsamer Vorteil",
    heading: "Von Fragen zu nützlichen Inhalten.",
    cards: [
      {
        title: "Echte Fragen entdecken",
        desc: "Machen Sie aus einem Begriff die meistgestellten verwandten Fragen, die Menschen beim Lernen, Vergleichen und Entscheiden stellen.",
        bullets: [
          "Fragen nach Absicht lesen",
          "Übersehene Unterthemen erkennen",
          "Über Regionen und Sprachen hinweg recherchieren"
        ]
      },
      {
        title: "Content-Lücken finden",
        desc: "Vergleichen Sie die Fragen mit dem, was Sie bereits veröffentlicht haben, und sehen Sie, wo Ihre Expertise helfen kann.",
        bullets: [
          "Fragen auswählen, die Sie gut beantworten können",
          "Seiten ohne FAQ erkennen",
          "Entscheiden, was einen eigenen Beitrag verdient"
        ]
      },
      {
        title: "Mit Zuversicht erstellen",
        desc: "Geben Sie Autoren für jede Seite, jedes Video und jeden Beitrag einen fragegeleiteten Startpunkt.",
        bullets: [
          "Zusammenhängende Inhalte von Hand planen",
          "Fragen in unterstützten Tarifen exportieren",
          "Das Schreiben bleibt in Ihrer Stimme"
        ]
      }
    ]
  },
  workflow: {
    heading: "Ein einfacher Ablauf für eine sich wandelnde Suchlandschaft.",
    lead: "Geben Sie allen, von Solo-Creatorn bis zu großen Suchteams, denselben einfachen Startpunkt: Was fragen die Menschen?",
    steps: [
      {
        title: "Thema eingeben",
        desc: "Beginnen Sie mit einem Produkt, einer Kategorie, einem Kundenproblem oder einem strategischen Keyword."
      },
      {
        title: "Fragen erfassen",
        desc: "GetTopQuestions zeigt die meistgestellten verwandten Fragen rund um Ihren Begriff."
      },
      {
        title: "Die Chance nutzen",
        desc: "Wählen Sie die Fragen, die Sie am besten beantworten können, und erstellen Sie hilfreiche Inhalte in Ihrer eigenen Stimme."
      }
    ]
  },
  cta: {
    head: "Finden Sie die Fragen, die Ihre Zielgruppe bereits stellt.",
    lead: "Beginnen Sie mit einem Begriff und gehen Sie mit einer klaren Idee, was Sie als Nächstes schreiben.",
    primary: "Kostenlos starten",
    secondary: "Sprechen Sie mit uns"
  }
};
