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
  description:
    "Wie SEO-Teams, Agenturen, Publisher und Marken mit AnswerGap die Fragen " +
    "finden, die die KI-Suche noch nicht beantwortet hat.",

  hero: {
    eyebrow: "Für jedes Team, das die Entdeckung durch KI prägt",
    head: "Eine Plattform. Mehr Wege, in der",
    headTinted: "KI-Suche",
    headTail: "zu gewinnen.",
    lead:
      "AnswerGap hilft Teams zu verstehen, was Menschen fragen, wo die " +
      "Antworten der KI zu kurz greifen und was zu erstellen ist, um die " +
      "Quelle zu werden, die die KI empfiehlt.",
  },
  heroPrimary: "Kostenlos starten",
  heroSecondary: "Preise ansehen",

  teams: {
    eyebrow: "Lösungen nach Team",
    heading: "Gebaut um Ihre Arbeitsweise herum.",
    lead:
      "Von der ersten Suche in einer Kategorie bis zum globalen " +
      "Content-Programm gibt AnswerGap jedem Team einen konkreten nächsten " +
      "Schritt.",
    cards: [
      {
        title: "SaaS-Gründer",
        desc:
          "Verfolgen Sie die KI-Sichtbarkeit Ihres SaaS und finden Sie die " +
          "Fragen, die Käufer vor dem Abschluss stellen.",
      },
      {
        title: "Start-ups",
        desc:
          "Werden Sie früh von der KI gefunden und bauen Sie Autorität auf, " +
          "bevor Ihre Kategorie überfüllt ist.",
      },
      {
        title: "Marketing-Agenturen",
        desc:
          "Berichten Sie die KI-Sichtbarkeit für jeden Kunden und machen Sie " +
          "aus Zitationslücken neue Chancen für Kampagnen.",
      },
      {
        title: "SEO-Teams",
        desc:
          "Erweitern Sie klassisches SEO-Reporting um KI-Antworten, Zitate " +
          "und die Nachfrage aus dialogorientierter Suche.",
      },
      {
        title: "Content-Teams",
        desc:
          "Belegen Sie, welche Inhalte KI-Sichtbarkeit bringen, und " +
          "priorisieren Sie die Fragen, die sich am meisten lohnen.",
      },
      {
        title: "E-Commerce",
        desc:
          "Sehen Sie, welche Marken die KI empfiehlt, und erstellen Sie " +
          "nützliche Inhalte für die Wege zur Produktentdeckung.",
      },
      {
        title: "Inhouse-Marketing",
        desc:
          "Verbinden Sie Marken-, Content- und Suchteams rund um eine " +
          "messbare Strategie für KI-Sichtbarkeit.",
      },
      {
        title: "Enterprise-Marken",
        desc:
          "Beobachten Sie Themen, Regionen und Sprachen im großen Maßstab " +
          "und finden Sie dabei Lücken über Ihr ganzes Portfolio hinweg.",
      },
      {
        title: "Publisher & Medien",
        desc:
          "Finden Sie aufkommende Fragencluster und erstellen Sie " +
          "maßgebliche Beiträge, die KI-Systeme zitieren können.",
      },
    ],
  },

  advantage: {
    eyebrow: "Ein gemeinsamer Vorteil",
    heading: "Von Fragen zu messbarem Handeln.",
    cards: [
      {
        title: "Echte Nachfrage entdecken",
        desc:
          "Machen Sie aus einem Thema die zusammenhängenden Fragen, die " +
          "Menschen auf ihrem ganzen Entscheidungsweg stellen.",
        bullets: [
          "Fragen nach Suchintention erkunden",
          "Übersehene Themencluster finden",
          "Jeden Markt und jede Sprache recherchieren",
        ],
      },
      {
        title: "Sichtbarkeitslücken finden",
        desc:
          "Sehen Sie, wo die vorhandenen Antworten schwach, unvollständig " +
          "oder gar nicht da sind - und wo Ihr Fachwissen weiterhilft.",
        bullets: [
          "Fragen mit großem Potenzial priorisieren",
          "Die Abdeckung durch Antworten verstehen",
          "Blinde Flecken der Wettbewerber erkennen",
        ],
      },
      {
        title: "Mit Sicherheit erstellen",
        desc:
          "Geben Sie Content- und SEO-Teams für jede Seite, die sie " +
          "erstellen, ein klares, belegtes Briefing.",
        bullets: [
          "Zusammenhängende Content-Pläne aufbauen",
          "Daten für Ihren Workflow exportieren",
          "Fortschritt über die Zeit messen",
        ],
      },
    ],
  },

  workflow: {
    head: "Ein einfacher Ablauf für eine",
    headTinted: "Suchlandschaft im Wandel",
    headTail: ".",
    lead:
      "Geben Sie allen - von Gründern bis zu Suchteams in Konzernen - " +
      "denselben klaren Blick auf Nachfrage und Chancen.",
    steps: [
      {
        title: "Ein Thema eingeben",
        desc:
          "Beginnen Sie mit einem Produkt, einer Kategorie, einem " +
          "Kundenproblem oder einem strategischen Keyword.",
      },
      {
        title: "Die Fragen abbilden",
        desc:
          "AnswerGap zeigt verwandte Suchanfragen und die Lücken in den " +
          "vorhandenen KI-Antworten.",
      },
      {
        title: "Die Chance nutzen",
        desc:
          "Priorisieren Sie, exportieren Sie die Daten und erstellen Sie " +
          "Inhalte, die zu einer vertrauenswürdigen Quelle werden.",
      },
    ],
  },

  cta: {
    head: "Finden Sie die Lücken, in denen Ihre Zielgruppe längst sucht.",
    lead:
      "Beginnen Sie mit einem Thema und machen Sie aus echter Nachfrage in " +
      "der KI-Suche eine fokussierte Sichtbarkeitsstrategie.",
    primary: "Kostenlos starten",
    secondary: "Sprechen Sie mit uns",
  },
};
