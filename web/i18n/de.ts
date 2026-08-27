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
    gap: "Lücke",
    weak: "Schwach",
    covered: "Abgedeckt",
    no_data: "Keine Daten",
    gapExplained:
      "Kein Suchergebnis adressiert diese Frage direkt. Die Antwort muss aus " +
      "einer Seite herausgeklaubt werden, die über etwas anderes geschrieben wurde.",
    weakExplained:
      "Ein bis zwei Seiten adressieren diese Frage. Der Wettbewerb hat begonnen, " +
      "aber es ist noch Platz.",
    coveredExplained:
      "Drei oder mehr Seiten adressieren diese Frage. Hier zu ranken wäre schwer.",
    no_dataExplained:
      "Für diese Frage wurden keine Suchergebnisse abgerufen, daher ist " +
      "UNBEKANNT, ob es eine Lücke ist. Sie zählt nicht als Lücke.",
  },

  toolbar: {
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
    matchingPagesHint: "Organische Treffer über der Überschneidungsschwelle",
    checked: "Geprüft",
    checkedHint: "Untersuchte organische Treffer",
    branches: "Zweige",
    branchesHint: "Unter wie vielen verschiedenen Elternfragen sie auftauchte",
    depth: "Ebene",
    volume: "Volumen",
    volumeHint: "Google Ads ist nicht angebunden",
    noVolume: "keine Daten",
    empty: "Keine Frage passt zum Filter.",
  },

  detail: {
    empty:
      "Wähle eine Frage, um zu sehen, welche Seiten sie adressieren, welche " +
      "nicht, und warum sie als Lücke gilt.",
    depth: "Ebene {depth}",
    branches: "in {count} Zweigen",
    matchingPages: "Passende Seiten",
    checked: "Geprüfte Treffer",
    volume: "Suchvolumen",
    resultsHeading: "Suchergebnisse · Überschneidung ≥ {threshold} zählt als Treffer",
    noResults: "Für diese Frage wurden <b>nie Suchergebnisse abgerufen</b>, daher ist unbekannt, ob es eine Lücke ist - deshalb die gestrichelte Umrandung. Dies ist eine archivierte Analyse; für eine Bewertung eine Live-Suche mit demselben Begriff ausführen.",
    notScoredYet: "Diese Frage wurde <b>noch nicht bewertet</b>. Die Prüfung kostet eine Suchanfrage und läuft deshalb nie automatisch — bis dahin ist unbekannt, ob es eine Lücke ist.",
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
