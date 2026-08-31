import type { Messages } from "./types";

export const de: Messages = {
  brand: {
    name: "AnswerGap",
    tagline: "Finde die Fragen, die deine Wettbewerber nie beantwortet haben.",
    prototype: "Prototyp",
  },

  landing: {
    headline: "Finde die Fragen, die deine Wettbewerber nie beantwortet haben.",
    intro:
      "AnswerGap entfaltet Googles „Ähnliche Fragen“ zu einem Fragenbaum, prüft " +
      "die Suchergebnisse hinter jeder Frage und zeigt dir, welche davon keine " +
      "Seite wirklich adressiert.",
    searchPlaceholder: "Suchbegriff eingeben — z. B. Zahnaufhellung",
    searchButton: "Analysieren",
    searchDisabledHint: "Keine DataForSEO-Zugangsdaten gefunden - .env.example nach .env kopieren und ausfüllen.",
    searching: "Suche läuft…",
    searchingHint: "Google wird einmal abgefragt, mit aufgeklapptem „Ähnliche Fragen“-Block. Das dauert 30-60 Sekunden.",
    liveNotice: "Eine Suche führt <b>eine einzige Live-Anfrage</b> aus und liefert den Fragenbaum. Die Lücken-Bewertung läuft <b>pro Frage</b> und wird von der Frage selbst gestartet.",
    savedAnalyses: "Gespeicherte Analysen",
    questionCount: "{count} Fragen",
    country: "Land",
    language: "Sprache",
    languageHint:
      "Die Lücken-Bewertung läuft nur in Sprachen, für die ein Sprachpaket vorliegt.",
  },

  status: {
    gap: "Unbeantwortet",
    weak: "Kaum beantwortet",
    covered: "Gut beantwortet",
    no_data: "Nicht geprüft",
    evidence: "{matching} von {checked} Seiten",
    gapExplained:
      "Kein Suchergebnis adressiert diese Frage direkt. Die Antwort muss aus " +
      "einer Seite herausgeklaubt werden, die über etwas anderes geschrieben wurde.",
    weakExplained:
      "Ein bis zwei Seiten adressieren diese Frage. Der Wettbewerb hat begonnen, " +
      "aber es ist noch Platz.",
    coveredExplained:
      "Drei oder mehr Seiten adressieren diese Frage. Hier zu ranken wäre schwer.",
    no_dataExplained:
      "Für diese Frage wurden keine Suchergebnisse abgerufen, daher " +
      "weiß niemand, ob sie jemand beantwortet. Unbekannt ist nicht " +
      "dasselbe wie unbeantwortet.",
  },

  toolbar: {
    seeds: "Ähnliche Suchanfragen",
    tree: "Baum",
    table: "Tabelle",
    searchPlaceholder: "Fragen filtern…",
    showing: "{shown} von {total} Fragen",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    fit: "An Bildschirm anpassen",
  },

  table: {
    question: "Frage",
    status: "Status",
    matchingPages: "Passende Seiten",
    matchingPagesHint: "Suchergebnisse, die diese Frage tatsächlich adressieren",
    checked: "Geprüft",
    checkedHint: "Geprüfte Suchergebnisse",
    branches: "Zweige",
    branchesHint: "Unter wie vielen verschiedenen Elternfragen sie auftauchte",
    depth: "Ebene",
    volume: "Volumen",
    volumeHint: "Google Ads ist nicht angebunden",
    noVolume: "keine Daten",
    empty: "Keine Frage passt zum Filter.",
  },

  seeds: {
    note:
      "Google zeigt diese Begriffe neben den Ergebnissen. Es sind Suchanfragen, keine Fragen — deshalb werden sie nie zu Knoten im Baum, sondern sind die nächsten Startbegriffe.",
    empty: "Für diesen Baum wurden noch keine ähnlichen Suchanfragen erfasst.",
  },

  detail: {
    empty:
      "Wählen Sie eine Frage, um zu sehen, welche Seiten sie adressieren, " +
      "welche nicht, und wie viele davon sie wirklich beantworten.",
    depth: "Ebene {depth}",
    branches: "in {count} Zweigen",
    matchingPages: "Passende Seiten",
    checked: "Geprüfte Treffer",
    volume: "Suchvolumen",
    resultsHeading:
      "Suchergebnisse · eine Seite gilt ab {threshold} als Antwort",
    noResults: "Für diese Frage wurden <b>nie Suchergebnisse abgerufen</b>, daher weiß niemand, ob sie jemand beantwortet - deshalb ist sie gestrichelt umrandet. Dies ist eine archivierte Analyse; führen Sie eine Live-Suche mit demselben Begriff aus, um sie zu bewerten.",
    notScoredYet: "Diese Frage wurde <b>noch nicht geprüft</b>. Die Prüfung kostet eine Suchanfrage und passiert deshalb nie automatisch — und bis dahin weiß niemand, ob sie jemand beantwortet.",
    scoreButton: "Diese Frage prüfen",
    scoring: "Wird geprüft…",
    scoreCost: "Eine SERP-Anfrage. Eine bereits abgerufene Frage kostet nichts.",
    untitled: "(ohne Titel)",
    aiHeading: "Quellen der Google KI-Übersicht",
    aiNote:
      "Google beantwortet diese Frage mit einer KI-Übersicht und zitiert diese " +
      "Seiten. Möglicherweise eine Zero-Click-Frage.",
    sourceHeading: "Quelle",
    updated: "Zuletzt aktualisiert: {date}",
    matching: "Abgleich: {strategy} · Schwelle {threshold}",
    unvalidated: "(nicht validiert)",
    harvestFound: "Diese Anfrage brachte ohne Zusatzkosten {count} weitere neue Fragen zutage.",
    harvestDropped: "{count} weitere blieben außen vor, weil sie zu weit vom Startbegriff abweichen.",
    harvestedNode: "In den Ergebnissen einer anderen Frage gefunden",
    relevance: "Nähe zum Startbegriff {value}",
  },

  verdict: {
    heading: "Beantworten diese Seiten die Frage?",
    ask: "Der Schwellenwert steht noch nicht fest. Ihre Antwort entscheidet ihn — kostenlos, es wird keine Suche ausgeführt.",
    gap: "Nein, keine davon",
    notGap: "Ja, mindestens eine",
    gapHint: "Keine der Seiten hier wurde geschrieben, um diese Frage zu beantworten.",
    notGapHint: "Mindestens eine Seite hier beantwortet sie direkt.",
    recorded: "Gespeichert. Zum Zurückziehen dieselbe Schaltfläche erneut anklicken.",
    retracted: "Urteil zurückgezogen.",
    saving: "Wird gespeichert…",
    tally: "Bisher {questions} Fragen beurteilt ({gap} unbeantwortet, {notGap} beantwortet).",
    disagrees: "Das widerspricht der Metrik — genau das ist der nützliche Fall.",
  },

  batch: {
    size: "Stapelgröße",
    check: "Top {count} prüfen",
    pricing: "Preis wird ermittelt…",
    confirmCount: "{count} Fragen",
    vsLive: "in der {queue}-Warteschlange · {live} über Live",
    skipped: "{count} übersprungen — bereits geprüft oder bereits in der Warteschlange.",
    noCallback: "Kein Callback konfiguriert: Ergebnisse werden per Abfrage eingesammelt, was Minuten statt Sekunden dauert.",
    confirm: "In die Warteschlange",
    cancel: "Abbrechen",
    posting: "Wird eingereiht…",
    running: "{done} von {total} zurück",
    failed: "{count} fehlgeschlagen",
    allChecked: "Alle Fragen wurden geprüft.",
  },

  dev: {
    role: "Entwickler",
    loading: "Wird gelesen…",
    liveQueue: "Live",
    standardQueue: "Standard",
    crawls: "{count} Suchen",
    tasks: "{count} Fragen",
    saved: "Gespart",
    savedNote: "dieselbe Arbeit über Live hätte {ifLive} gekostet",
    total: "Gesamt",
    perRequest: "Pro Anfrage: {live} Live · {standard} Standard",
    rows: "{questions} Fragen · {scores} Bewertungen · {snapshots} gespeicherte Antworten",
    storage: "Speicher {state} · {tables} Tabellen",
    ok: "ok",
    broken: "FEHLERHAFT",
    callback: "Callback {state}",
    on: "an",
    offSweep: "aus — fällt auf Abfrage zurück",
    pending: "{count} noch in der Warteschlange",
    failedTasks: "{count} Aufgaben fehlgeschlagen",
  },

  notice: {
    archiveData: "Archivdaten",
    archiveDataDetail: "nicht live",
    liveData: "Live-Crawl",
    liveDataDetail: "eine Momentaufnahme, nicht live",
    liveDataNote: "Einmal zum angezeigten Zeitpunkt abgerufen. Googles Ergebnisse ändern sich; für eine Aktualisierung die Suche erneut ausführen.",
    provisionalThreshold: "Vorläufige Schwelle",
    thresholdNote:
      "Die Lücken-Schwelle wurde nicht gegen gelabelte Daten validiert. Die " +
      "Ergebnisse zeigen eine Richtung, sie sind nicht endgültig.",
    volumeNote: "Google Ads ist nicht angebunden — Suchvolumen wird nicht angezeigt.",
    dataNote:
      "Gelesen aus dem Validierungsarchiv von Phase 0, nicht aus Live-Google-Daten.",
  },

  error: {
    unreachable: "API nicht erreichbar ({url}). Läuft das Backend?",
    http: "{status} {statusText} — {path}",
    noCredentials: "DataForSEO-Zugangsdaten fehlen. .env.example nach .env kopieren, ausfüllen und das Backend neu starten.",
    budget: "Das Anfragelimit wurde erreicht; der Crawl wurde gestoppt, statt mehr auszugeben.",
    upstream: "DataForSEO war nicht erreichbar oder hat einen Fehler geliefert. Eine fehlgeschlagene Anfrage wird nicht berechnet.",
    badRequest: "Diese Anfrage kann so nicht ausgeführt werden.",
    backToAnalyses: "Zurück zu den Analysen",
    startBackend: "Zum Starten des Backends, im Projektverzeichnis:",
    loading: "Wird geladen…",
  },

  language: {
    label: "Oberflächensprache",
  },
};
