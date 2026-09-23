import type { SolutionsContent } from "./index";

/**
 * Lösungsseite - Übersetzung der englischen Fassung.
 *
 * Maßgeblich ist `en.ts`. Diese Datei muss ihr Karte für Karte entsprechen -
 * neun Team-Karten bleiben neun, drei Vorteilskarten bleiben drei; der Typ
 * macht daraus einen Compile-Fehler.
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
          "Jede Frage stammt aus Googles eigenem „Ähnliche Fragen“, " +
          "aufgeklappt zu einem Baum statt zu einer Liste - so sehen Sie, wie " +
          "ein Thema sich ins nächste verzweigt.",
      },
      {
        title: "Sichtbarkeitslücken finden",
        desc:
          "Zu jeder Frage holen wir die Seiten, die dafür ranken, und zählen, " +
          "wie viele sie tatsächlich beantworten. Wenige Seiten über der " +
          "Schwelle sind die Chance - und um diese Zahl herum ist dieses " +
          "Produkt gebaut.",
      },
      {
        title: "Mit Sicherheit erstellen",
        desc:
          "Sehen Sie, welche Quellen Googles AI Overview zu jeder Frage " +
          "zitiert und ob Ihre eigene Domain darunter ist, bevor Sie " +
          "entscheiden, was Sie schreiben.",
      },
    ],
  },
};
