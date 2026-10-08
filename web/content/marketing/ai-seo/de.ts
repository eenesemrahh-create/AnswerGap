import type { AiSeoShape } from "../blocks";

/** German AI SEO copy. Shape, sources of every figure and the reasoning are in `en.ts`. */
export const de = {
  title: "AI SEO: In Googles AI Overview zitiert werden",
  description:
    "Google beantwortet viele Fragen inzwischen mit einer AI Overview, die " +
    "einige Quellen nennt. Sehen Sie, welche Fragen Menschen stellen, welche " +
    "keine Seite beantwortet und welche Websites die KI zitiert, auch Ihre.",

  hero: {
    eyebrow: "AI SEO",
    head: "Werden Sie die Quelle,",
    headTinted: "die die KI-Suche zitiert.",
    headTail: "",
    lead:
      "Google beantwortet viele Fragen inzwischen mit einer AI Overview und " +
      "nennt daneben einige Quellen. AnswerGap zeigt, was Menschen fragen, " +
      "welche Fragen keine Seite wirklich beantwortet und welche Websites die " +
      "KI zitiert, auch Ihre.",
  },
  heroPrimary: "Kostenlos starten",
  heroSecondary: "So funktioniert es",

  shift: {
    eyebrow: "Was sich geändert hat",
    heading: "Die Antwort kommt jetzt vor den Links.",
    lead:
      "Früher bestand die Suche aus zehn blauen Links. Heute steht darüber " +
      "eine von der KI geschriebene Antwort, und sie entscheidet, welche " +
      "wenigen Websites genannt werden.",
    cards: [
      {
        figure: "32 / 32",
        title: "People-Also-Ask-Antworten mit KI",
        desc:
          "In einer Stichprobe, die wir beim Bau dieses Produkts gezogen " +
          "haben, war jede der 32 aufgeklappten People-Also-Ask-Antworten " +
          "eine AI Overview und kein Zitat von einer Seite.",
      },
      {
        figure: "13 / 16",
        title: "Die KI nennt ihre Quellen",
        desc:
          "Bei einem Thema zur Zahnaufhellung hat Googles AI Overview für " +
          "13 der 16 geprüften Fragen Quellen genannt. Diese wenigen Links " +
          "sind die neue Startseite.",
      },
      {
        figure: "Über Platz 1",
        title: "Rank-Tracking sieht das nicht",
        desc:
          "Ein Rank-Tracker meldet Ihre Position in der Liste. Er sagt Ihnen " +
          "nicht, ob die Antwort über der Liste Sie nennt, und diese " +
          "Antwort lesen Menschen zuerst.",
      },
    ],
  },

  product: {
    eyebrow: "Was AnswerGap misst",
    heading: "Von einem Keyword zu einer Liste von Chancen.",
    lead:
      "Drei Dinge, aus denselben Google-Ergebnissen gelesen und für jede " +
      "Frage im Baum nebeneinander dargestellt.",
    points: [
      {
        title: "Was Menschen fragen",
        desc:
          "Eine Suche öffnet Googles People-Also-Ask-Kette: etwa 15 Fragen, " +
          "fünf Ebenen tief, in dem Land und der Sprache, die Sie wählen.",
      },
      {
        title: "Welche Fragen niemand beantwortet",
        desc:
          "Wir lesen die Suchergebnisse zu einer Frage und zählen die " +
          "Seiten, die sie wirklich behandeln. Wenige oder keine bedeuten " +
          "eine Lücke: eine Frage, die Sie besetzen können. Jedes Urteil " +
          "zeigt seine Belege.",
      },
      {
        title: "Wen die KI zitiert und ob Sie dabei sind",
        desc:
          "Zu jeder geprüften Frage listen wir die Websites auf, die " +
          "Googles AI Overview zitiert. Geben Sie Ihre Domain ein und sehen " +
          "Sie, wo Sie genannt werden und wo stattdessen ein Wettbewerber.",
      },
    ],
    demo: {
      badge: "Beispiel",
      seed: "Zahnaufhellung",
      pagesLabel: "{matching} von {checked} Seiten behandeln sie",
      rows: [
        {
          question: "Empfehlen Zahnärzte Zahnaufhellung?",
          status: "gap",
          label: "Unbeantwortet",
          matching: 0,
          checked: 8,
          ai: "AI 4",
          you: false,
        },
        {
          question: "Was hellt Zähne am schnellsten auf?",
          status: "weak",
          label: "Kaum beantwortet",
          matching: 1,
          checked: 7,
          ai: "AI 6",
          you: false,
        },
        {
          question: "Was kostet eine Zahnaufhellung?",
          status: "covered",
          label: "Gut beantwortet",
          matching: 6,
          checked: 8,
          ai: "AI 5 · Sie",
          you: true,
        },
      ],
      note:
        "Beispielhaft. Ein echtes Ergebnis listet jede gelesene Seite und " +
        "jede Website auf, die die KI zitiert.",
    },
  },

  playbook: {
    head: "Ein Leitfaden für",
    headTinted: "die KI-Suche",
    headTail: ".",
    lead:
      "Vier Schritte, immer wieder. Der Baum zeigt Ihnen, wo Sie anfangen; " +
      "eine neue Suche zeigt Ihnen, ob es gewirkt hat.",
    steps: [
      {
        title: "Suchen Sie Ihr Thema",
        desc:
          "Starten Sie mit den Wörtern, die Ihre Kundschaft benutzt. Eine " +
          "Suche kostet einen Credit, die Quellen der AI Overview sind " +
          "inklusive.",
      },
      {
        title: "Wählen Sie die Lücken",
        desc:
          "Sortieren Sie die Tabelle nach der Zahl der Seiten, die eine " +
          "Frage behandeln. Wo es am wenigsten sind, fehlt eine Antwort.",
      },
      {
        title: "Prüfen Sie, wen die KI zitiert",
        desc:
          "Geben Sie Ihre Domain ein. Fragen, bei denen die KI einen " +
          "Wettbewerber nennt und nicht Sie, sind Ihre zweite Liste.",
      },
      {
        title: "Schreiben Sie die Antwort, dann suchen Sie erneut",
        desc:
          "Veröffentlichen Sie eine Seite, die die Frage direkt beantwortet, " +
          "und wiederholen Sie die Suche. Jedes Ergebnis ist datiert, sodass " +
          "Sie vergleichen können.",
      },
    ],
  },

  citable: {
    eyebrow: "Für KI-Antworten schreiben",
    heading: "Was eine Seite leicht zitierbar macht.",
    lead:
      "Niemand außerhalb von Google weiß genau, wie die AI Overview ihre " +
      "Quellen auswählt. Diese Gewohnheiten machen eine Antwort leicht " +
      "auffindbar, zitierbar und glaubwürdig, was für menschliche Leser " +
      "ohnehin gut ist.",
    cards: [
      {
        title: "Antworten Sie im ersten Satz",
        desc:
          "Setzen Sie die direkte Antwort gleich unter die Überschrift und " +
          "erklären Sie danach. Eine Antwort im vierten Absatz lässt sich " +
          "schwer zitieren.",
      },
      {
        title: "Nehmen Sie die Frage als Überschrift",
        desc:
          "Formulieren Sie Überschriften so, wie Menschen fragen. So " +
          "erscheint die Frage auch schon in People Also Ask.",
      },
      {
        title: "Eine Frage, ein Abschnitt",
        desc:
          "Geben Sie jeder Frage einen klar abgegrenzten Abschnitt, damit " +
          "eine Passage auch allein, aus dem Zusammenhang gelöst, " +
          "verständlich bleibt.",
      },
      {
        title: "Decken Sie die Folgefragen ab",
        desc:
          "Der Baum zeigt, was Menschen als Nächstes fragen. Wenn Sie die " +
          "Unterfragen einer Frage beantworten, wird Ihre Seite die " +
          "vollständige Quelle und nicht nur eine von vielen.",
      },
      {
        title: "Zeigen Sie Ihre Belege",
        desc:
          "Zahlen, benannte Quellen und ein benannter Autor. Eine konkrete " +
          "Aussage ist glaubwürdiger als eine allgemeine.",
      },
      {
        title: "Halten Sie sie datiert und aktuell",
        desc:
          "Zeigen Sie, wann die Seite zuletzt aktualisiert wurde, und " +
          "überarbeiten Sie sie, wenn sich die Fragen in Ihrem Baum ändern.",
      },
    ],
  },

  limits: {
    eyebrow: "Klar gesagt",
    heading: "Was wir nicht behaupten.",
    lead:
      "Die KI-Suche ist neu, und viele Tools dafür verkaufen eine Sicherheit, " +
      "die niemand hat. Hier steht genau, was AnswerGap misst und was nicht.",
    items: [
      {
        title: "Vorerst nur Google",
        desc:
          "Wir lesen Googles AI Overview. ChatGPT, Claude und Perplexity " +
          "werden nicht gemessen, und niemand kann Ihnen deren echte " +
          "Prompt-Volumen verkaufen.",
      },
      {
        title: "Eine Momentaufnahme, nicht live",
        desc:
          "Jedes Ergebnis trägt den Zeitpunkt, zu dem es abgerufen wurde. " +
          "Googles Ergebnisse ändern sich; suchen Sie erneut, um zu " +
          "aktualisieren.",
      },
      {
        title: "Das Lückenurteil ist eine Schätzung",
        desc:
          "Es wird aus den gelesenen Seiten berechnet und wird manchmal " +
          "falsch sein. Die Belege werden immer angezeigt, und Sie können " +
          "jedes Urteil als richtig oder falsch markieren.",
      },
      {
        title: "Keine garantierten Zitate",
        desc:
          "Niemand kann versprechen, dass eine KI Sie zitiert. Wir zeigen, " +
          "wo die Chance liegt; die Antwort schreiben Sie selbst.",
      },
    ],
  },

  faq: {
    heading: "AI SEO, kurz erklärt",
    items: [
      {
        title: "Was ist AI SEO?",
        desc:
          "AI SEO, auch GEO (Generative Engine Optimization) oder AEO " +
          "(Answer Engine Optimization) genannt, bedeutet, dafür zu sorgen, " +
          "dass Ihre Inhalte in KI-geschriebenen Antworten wie Googles AI " +
          "Overview verwendet und zitiert werden, und nicht nur in den Links " +
          "darunter ranken.",
      },
      {
        title: "Unterscheidet sich AI SEO von klassischem SEO?",
        desc:
          "Es baut darauf auf. KI-Antworten stützen sich auf Seiten, die " +
          "Suchmaschinen ohnehin finden können, daher zählen Crawlbarkeit " +
          "und Qualität weiterhin. Das Ziel ändert sich: eine klare, " +
          "zitierbare Antwort auf eine konkrete Frage statt einer Seite, die " +
          "für ein Keyword rankt.",
      },
      {
        title: "Welche KI-Engines verfolgt AnswerGap?",
        desc:
          "Googles AI Overview, gelesen aus denselben Suchergebnissen, mit " +
          "denen wir Lücken finden. Andere Assistenten werden derzeit nicht " +
          "verfolgt.",
      },
      {
        title: "Wie entscheidet AnswerGap, dass eine Frage eine Lücke ist?",
        desc:
          "Zu jeder Frage holen wir die Suchergebnisse, vergleichen jede " +
          "Seite mit der Frage und zählen die Seiten, die sie wirklich " +
          "behandeln. Wenige oder keine bedeuten eine Lücke. Das ist eine " +
          "Schätzung, und die Seiten dahinter werden immer angezeigt.",
      },
      {
        title: "Was kostet es?",
        desc:
          "Jede Suche kostet einen Credit, und die Quellen der AI Overview " +
          "sind ohne Aufpreis dabei. Ein Ergebnis, das Sie schon haben, " +
          "erneut zu öffnen ist kostenlos.",
      },
    ],
  },

  cta: {
    head: "Finden Sie die Fragen, die die KI ohne Sie beantwortet.",
    lead:
      "Suchen Sie ein Thema und sehen Sie die Lücken und die Websites, die " +
      "die KI zitiert, in einer Ansicht.",
    primary: "Kostenlos starten",
    secondary: "Preise ansehen",
  },
} as const satisfies AiSeoShape;
