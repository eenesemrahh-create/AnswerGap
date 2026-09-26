import type { Messages } from "./types";

export const de: Messages = {
  brand: {
    name: "AnswerGap",
    tagline: "Finde die Fragen, die deine Wettbewerber nie beantwortet haben.",
    prototype: "Prototyp",
  },

  landing: {
    treeCount: "{count} gespeichert",
    emptyTitle: "Noch keine Suchen.",
    emptyBody:
      "Suchen Sie oben nach einem Keyword, dann erscheint es hier. Ihre " +
      "Suchen bleiben privat und gehören zu Ihrem Konto.",
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
    seedLabel: "Ihre Suche",
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
    aiSources: "AI Overview",
    aiSourcesHint: "Websites, die Googles AI Overview für diese Frage als Quelle nennt. Nur für geprüfte Fragen bekannt.",
    aiCount: "{count} Websites",
    aiNone: "keine",
    aiYou: "du",
    aiYouHint: "{site} ist unter den zitierten Quellen",
    aiUnknown: "unbekannt",
    aiUnknownHint: "Googles KI-Antwort wird nach der Seite geladen; ihre Quellen konnten nicht gelesen werden. Unbekannt, nicht unzitiert.",
  },

  ai: {
    heading: "Google AI Overview in diesem Baum",
    noneChecked: "Es wurde noch keine Frage geprüft. Eine Prüfung zeigt ohne Zusatzkosten auch, ob Googles AI Overview die Frage beantwortet und welche Websites es zitiert.",
    coverage: "Googles KI-Übersicht zitiert Quellen bei {withAi} von {checked} Fragen, deren KI-Antwort lesbar war.",
    citedIn: "zitiert bei {count} von {checked}",
    note: "Gezählt werden nur Fragen mit lesbarer KI-Antwort. Alles andere ist unbekannt, nicht unzitiert.",
    unreadable: "Bei {count} weiteren nicht lesbar.",
    siteLabel: "Deine Website",
    sitePlaceholder: "beispiel.de",
    siteInvalid: "Gib eine Domain ein, z. B. beispiel.de.",
    siteCited: "{site} wird in {count} von {checked} geprüften Fragen zitiert.",
    siteHint: "Subdomains zählen mit: beispiel.de passt auch zu blog.beispiel.de. Nur in diesem Browser gespeichert.",
    treeMarker: "KI {count}",
    treeHint: "Googles KI-Übersicht zitiert für diese Frage {count} Websites.",
    treeYouHint: "{site} ist darunter.",
  },

  seeds: {
    note:
      "Google zeigt diese Begriffe neben den Ergebnissen. Es sind Suchanfragen, keine Fragen — deshalb werden sie nie zu Knoten im Baum, sondern sind die nächsten Startbegriffe.",
    empty: "Für diesen Baum wurden noch keine ähnlichen Suchanfragen erfasst.",
    noQuestionsTitle: "Google zeigt für diese Suche keine Fragen",
    noQuestionsBody:
      "Auf dieser Ergebnisseite gibt es keinen „Ähnliche Fragen“-Block, daher lässt sich kein Fragenbaum aufbauen. Bei Markennamen und Ein-Wort-Suchen ist das normal – dort suchen Menschen eine Website, keine Antwort. Suchanfragen in Frageform funktionieren am besten.",
    noQuestionsTry: "Stattdessen schlägt Google diese ähnlichen Suchanfragen vor:",
  },

  detail: {
    close: "Schließen",
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
    aiYou: "{site} ist unter den zitierten Websites.",
    aiNotYou: "{site} wird für diese Frage nicht zitiert.",
    aiUnreadable: "Google beantwortet diese Frage mit einer KI-Übersicht, die aber nach der Seite lädt und deren Quellen nicht gelesen werden konnten. Wer hier zitiert wird, ist unbekannt.",
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
    skipped:
      "{count} übersprungen — bereits geprüft, bereits in der Warteschlange " +
      "oder jenseits Ihres verbleibenden Guthabens.",
    noCallback: "Kein Callback konfiguriert: Ergebnisse werden per Abfrage eingesammelt, was Minuten statt Sekunden dauert.",
    confirm: "In die Warteschlange",
    cancel: "Abbrechen",
    posting: "Wird eingereiht…",
    running: "{done} von {total} zurück",
    failed: "{count} fehlgeschlagen",
    allChecked: "Alle Fragen wurden geprüft.",
  },

  dev: {
    role: "Administrator",
    scopeTree: "Nur diese Analyse.",
    scopeAll: "Alles, alle Bäume.",
    grandTotal: "Alle Bäume: {total}",
    rowsTree: "{questions} Fragen · {tasks} eingereihte Prüfungen",
    loading: "Wird gelesen…",
    liveQueue: "Live",
    standardQueue: "Standard",
    requests: "{count} Anfragen · {crawls} Suchen",
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

  diff: {
    first: "Erster Crawl · {at}",
    firstNote: "Noch nichts zum Vergleichen. Führen Sie diese Suche später erneut aus, dann erscheinen die Änderungen hier.",
    stable: "Keine Änderung seit {since} · {count} Fragen unverändert",
    changed: "{added} neu · {removed} verschwunden · seit {since}",
    scope: "Vergleicht, was Google zurückgab, nicht was die Bewertung später zutage förderte. Eine neue Reihenfolge ist keine Änderung.",
    addedHeading: "Neue Fragen",
    removedHeading: "Nicht mehr gefragt",
    removedNote: "Eine dafür geschriebene Seite zielt jetzt ins Leere.",
    historyHeading: "Crawl-Verlauf",
    questionCount: "{count} Fragen",
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

  auth: {
    // --- Anmeldung mit E-Mail und Passwort ---------------------------
    signUpTitle: "AnswerGap-Konto erstellen",
    tabSignIn: "Anmelden",
    tabSignUp: "Konto erstellen",
    emailLabel: "E-Mail",
    passwordLabel: "Passwort",
    nameLabel: "Name (optional)",
    newPassword: "Neues Passwort",
    passwordHint:
      "Mindestens 10 Zeichen. Auf die Länge kommt es an — ein kurzer Satz schlägt ein kurzes Passwort.",
    or: "oder",
    forgot: "Passwort vergessen?",
    forgotTitle: "Passwort zurücksetzen",
    forgotSub:
      "Gib deine Adresse ein und wir senden dir einen Link für ein neues Passwort.",
    forgotSubmit: "Link senden",
    sentTitle: "Sieh in dein Postfach",
    sentBody:
      "Wir haben einen Link an {email} geschickt. Öffne ihn, um deine Adresse zu bestätigen und deine kostenlosen Credits zu erhalten.",
    sentSpam: "Das kann eine Minute dauern. Falls nichts ankommt, sieh im Spam nach.",
    sentResend: "Erneut senden",
    sentAgain: "Gesendet. Sieh gleich noch einmal in dein Postfach.",
    backToSignIn: "Zurück zur Anmeldung",
    resetTitle: "Neues Passwort wählen",
    resetSub:
      "Damit wirst du überall sonst abgemeldet — genau darum geht es beim Zurücksetzen.",
    resetSubmit: "Speichern und anmelden",
    working: "Läuft…",
    yourAddress: "deine Adresse",
    verifyBanner:
      "Bestätige deine E-Mail-Adresse, um deine Credits zu nutzen.",
    verifyBannerAction: "Link erneut senden",
    verifiedToast: "Deine E-Mail ist bestätigt. Deine Credits sind bereit.",
    alreadyVerified:
      "Diese Adresse ist bereits bestätigt. Melde dich an und mach weiter.",
    accountEmail: "Angemeldet als",
    deleteTitle: "Mein Konto löschen",
    deleteLead: "Das lässt sich nicht rückgängig machen. Deine Suchen werden von dir gelöst; deine E-Mail-Adresse und deine Zahlungsbelege bleiben.",
    deleteAction: "Mein Konto löschen…",
    deleteConfirmTitle: "Dieses Konto löschen?",
    deleteRemoves: "Entfernt: dein Name, dein Bild, dein Passwort, deine gespeicherten Einstellungen und die Verbindung zwischen dir und jeder Suche. Deine gespeicherten Analysen gehören dir dann nicht mehr.",
    deleteKeeps: "Behalten: deine E-Mail-Adresse, damit wir dich bei einer Rückkehr wiedererkennen, und deine Zahlungsbelege, die wir steuerlich aufbewahren müssen.",
    deleteRevives: "Meldest du dich mit dieser Adresse erneut an, kommt das Konto zurück und bezahlte Credits sind noch da. Die Suchen nicht.",
    deleteConfirmPassword: "Zum Bestätigen dein Passwort eingeben",
    deleteConfirmEmail: "Zum Bestätigen {email} eingeben",
    deleteSubmit: "Mein Konto löschen",
    deleteCancel: "Konto behalten",
    verifyExpiredTitle: "Dieser Link ist abgelaufen",
    verifyExpiredSub:
      "Ein Bestätigungslink gilt nur einmal und nur kurze Zeit. Gib deine Adresse ein, wir senden einen neuen.",
    verifyExpiredSubmit: "Neuen Link senden",
    close: "Schließen",
    dialogTitle: "Bei AnswerGap anmelden",
    benefitCredits: "Guthaben für Suchen und Fragenprüfungen",
    benefitPrivate: "Ihre Suchen bleiben Ihre — niemand sonst sieht sie",
    benefitScore: "Jede Frage gegen die Seiten prüfen, die dafür ranken",
    noCard: "Keine Karte. In der Vorschau wird Guthaben von Hand vergeben.",
    signIn: "Mit Google anmelden",
    signOut: "Abmelden",
    signedInAs: "Angemeldet als {email}",
    account: "Konto",
    failed: "Die Anmeldung wurde nicht abgeschlossen. Versuchen Sie es erneut.",
    why: "Melden Sie sich an, damit Ihre Suchen und Ihr Guthaben erhalten bleiben.",
    whySearch: "Für die Suche ist ein Konto nötig. Es ist kostenlos, und neue Konten starten mit Guthaben.",
  },

  credits: {
    label: "Guthaben",
    balance: "{count} Credits",
    empty: "Kein Guthaben mehr",
    free: "Ergebnisse aus dem Cache sind kostenlos — sie verbrauchen kein Guthaben.",
    manualNote: "Guthaben wird vorerst von Hand vergeben; es gibt noch keine Kasse.",
  },

  account: {
    title: "Ihr Konto",
    signedOutTitle: "Melden Sie sich an, um Ihr Konto zu sehen",
    signedOutLead:
      "Ihr Tarif, Ihr Guthaben und alles, wofür Sie es ausgegeben haben, liegen hinter einer Anmeldung.",
    signedOutAction: "Anmelden",
    back: "Zurück zur Suche",
    loading: "Wird geladen…",

    profileHeading: "Angaben",
    email: "E-Mail",
    name: "Name",
    joined: "Mitglied seit",
    unnamed: "Nicht angegeben",
    verified: "Bestätigt",
    unverified: "Nicht bestätigt",
    verifyAction: "Link erneut senden",
    verifySent: "Gesendet. Sehen Sie in Ihrem Posteingang nach.",
    doors: "Anmelden mit",
    doorPassword: "Passwort",
    doorGoogle: "Google",

    planHeading: "Ihr Tarif",
    noPlan: "Kein Tarif",
    noPlanLead:
      "Dieses Konto läuft allein auf Guthaben. Ein Tarif fügt jeden Monat Guthaben hinzu.",
    planCredits: "{count} Guthaben pro Zeitraum",
    given: "Von uns vergeben",
    bought: "Abrechnung über Stripe",
    renews: "Verlängert sich am {date}",
    endsOn: "Endet am {date}",
    lapsed: "Dieser Tarif ist abgelaufen.",
    pastDue:
      "Die letzte Zahlung ist fehlgeschlagen. Aktualisieren Sie Ihre Karte, um den Tarif zu behalten.",
    manage: "Abrechnung verwalten",
    manageLead:
      "Kündigen, Tarif wechseln, Karte ändern oder Rechnungen herunterladen. Öffnet Stripe.",

    creditsHeading: "Guthaben",
    balanceLead:
      "Eine Suche kostet ein Guthaben. Ergebnisse aus dem Cache sind kostenlos.",
    historyHeading: "Verlauf",
    historyWhen: "Wann",
    historyChange: "Änderung",
    historyWhy: "Grund",
    noHistory: "Noch nichts.",
    reasonSignup: "Startguthaben",
    reasonSearch: "Suche",
    reasonSubscription: "Tarifverlängerung",
    reasonAdminGrant: "Von uns hinzugefügt",
    reasonAdminRevoke: "Von uns abgezogen",

    plansHeading: "Tarife",
    plansLead: "Sie können Ihren Tarif jederzeit wechseln.",
    current: "Ihr Tarif",
    choose: "{plan} wählen",
    monthly: "Monatlich",
    annual: "Jährlich",
    notPurchasable: "Noch nicht verfügbar",
    contactUs: "Kontakt aufnehmen",
    seeAllPlans: "Alle Tarife ansehen",

    billingDone:
      "Vielen Dank. Ihr Tarif wird eingerichtet — es kann einen Moment dauern, bis er hier erscheint.",
    billingCancelled: "Es wurde nichts berechnet.",

    dangerHeading: "Konto löschen",
  },

  error: {
    invalidEmail: "Das sieht nicht nach einer E-Mail-Adresse aus.",
    badCredentials: "E-Mail und Passwort passen zu keinem Konto.",
    emailUnverified:
      "Bestätige zuerst deine E-Mail-Adresse — der Link liegt in deinem Postfach.",
    tooManyAttempts:
      "Zu viele Versuche. Warte ein paar Minuten und versuche es erneut.",
    passwordTooShort: "Passwörter brauchen mindestens {minLength} Zeichen.",
    passwordTooCommon:
      "Dieses Passwort steht in Leak-Listen. Wähle ein anderes.",
    resetExpired:
      "Dieser Link ist abgelaufen oder wurde bereits verwendet. Fordere einen neuen an.",
    googleOff:
      "Google-Anmeldung ist in dieser Installation nicht eingerichtet. Nutze E-Mail.",
    unreachable: "API nicht erreichbar ({url}). Läuft das Backend?",
    unreachableRetry:
      "War die Suche bereits fertig, ist sie gespeichert — ein erneuter " +
      "Lauf kostet kein Guthaben.",
    notFound:
      "Diese Analyse gibt es hier nicht. Sie wurde gelöscht, oder die Adresse ist vertippt.",
    http: "{status} {statusText} — {path}",
    noCredentials: "DataForSEO-Zugangsdaten fehlen. .env.example nach .env kopieren, ausfüllen und das Backend neu starten.",
    budget: "Das Anfragelimit wurde erreicht; der Crawl wurde gestoppt, statt mehr auszugeben.",
    upstream: "DataForSEO war nicht erreichbar oder hat einen Fehler geliefert. Eine fehlgeschlagene Anfrage wird nicht berechnet.",
    badRequest: "Diese Anfrage kann so nicht ausgeführt werden.",
    planNotPurchasable:
      "Dieser Tarif kann noch nicht gekauft werden — wir richten die Zahlung " +
      "dafür noch ein. Melden Sie sich bei uns, wir kümmern uns darum.",
    noSuchPlan: "Diesen Tarif gibt es nicht mehr.",
    noCustomer:
      "Es gibt noch nichts zu verwalten — für dieses Konto wurde nie abgerechnet.",
    paymentsOff: "Zahlungen sind noch nicht freigeschaltet.",
    signedOut: "Sie sind abgemeldet. Melden Sie sich an, um fortzufahren.",
    noCredits:
      "Kein Guthaben mehr. Eine Suche kostet ein Credit; Ergebnisse aus dem " +
      "Cache sind kostenlos.",
    suspended: "Dieses Konto ist gesperrt. Melden Sie sich bei uns, wir klären das.",
    serverError:
      "Auf unserer Seite ist etwas schiefgelaufen. Für eine nicht beendete " +
      "Suche wurde nichts berechnet. Versuchen Sie es gleich noch einmal.",
    backToAnalyses: "Zurück zu den Analysen",
    startBackend: "Zum Starten des Backends, im Projektverzeichnis:",
    loading: "Wird geladen…",
  },

  theme: {
    light: "Zu Dunkel wechseln",
    dark: "Dem System folgen",
    system: "Zu Hell wechseln",
  },

  language: {
    label: "Oberflächensprache",
  },

  market: {
    nav: {
      pricing: "Preise",
      solutions: "Lösungen",
      aiSeo: "AI-SEO",
      blog: "Blog",
      contact: "Kontakt",
      signIn: "Anmelden",
      signUp: "Registrieren",
    },
    hero: {
      eyebrow: "Sichtbarkeit in KI-Suche beginnt hier",
      headlinePre: "Ranken und erscheinen in",
      headlineHighlight: "KI-gestützter Suche",
      sub:
        "Entdecke, was Menschen fragen, identifiziere die Antworten, die " +
        "KI-Engines brauchen, und erstelle Inhalte, die gefunden, zitiert " +
        "und empfohlen werden.",
      signedInTitle: "Was sollen wir untersuchen?",
      searchPlaceholder: "Thema eingeben — z. B. Zahnaufhellung",
      searchCta: "Analysieren",
      searching: "Suche…",
      elapsed: "seit {seconds} s",
      tryLabel: "Beispielsuchen:",
      try1: "bestes CRM für Startups",
      try2: "AI-SEO-Tools",
    },
    howItWorks: {
      eyebrow: "So funktioniert es",
      title: "Werde die Antwort, die KI-Suche empfiehlt.",
      sub:
        "AnswerGap zeigt dir die Fragen hinter KI-gesteuerter Entdeckung, " +
        "damit du nützliche, strukturierte Inhalte veröffentlichst, bevor " +
        "Wettbewerber es tun.",
      card1: {
        label: "Nachfrage-Intelligenz",
        title: "KI-Suchnachfrage kartieren",
        body:
          "Verwandle ein einzelnes Thema in eine vollständige Karte der " +
          "Fragen, die Menschen in jeder Phase der Entscheidung stellen.",
      },
      card2: {
        label: "KI-Sichtbarkeit",
        title: "Zitierungsmöglichkeiten finden",
        body:
          "Erkenne Fragen mit schwachen, unvollständigen oder fehlenden " +
          "Antworten — genau dort, wo klarere Inhalte die besten Chancen " +
          "haben, von KI hervorgehoben zu werden.",
      },
      card3: {
        label: "Autorität",
        title: "Thematische Autorität aufbauen",
        body:
          "Priorisiere verbundene Fragen und veröffentliche umfassende " +
          "Antworten, denen Suchmaschinen und KI-Assistenten vertrauen können.",
      },
    },
    builtFor: {
      eyebrow: "Für KI-Suche gebaut",
      title: "Beantworte echte Fragen. Werde von KI entdeckt.",
      body:
        "Suche wird zu einem Gespräch. AnswerGap zeigt, was dein Publikum " +
        "fragt und wo aktuelle Antworten unzureichend sind — damit deine " +
        "Marke Sichtbarkeit in AI Overviews, Assistenten und klassischer " +
        "Suche gewinnt.",
      point1: "Klare Antworten, die KI extrahieren und zitieren kann",
      point2: "Inhalte um echte Konversationsfragen strukturieren",
      point3: "Verbundene Fragen abdecken, um thematische Autorität zu stärken",
      demoUrl: "answergap.com/suche",
      demo1Q: "Welches CRM ist das beste für kleine Unternehmen?",
      demo1Meta: "Vollständige Antwort · Hohe Sichtbarkeitschance",
      demo2Q: "Brauche ich ein CRM, wenn ich Google Workspace nutze?",
      demo2Meta: "Keine vollständige Antwort · Hohe Sichtbarkeitschance",
      demo3Q: "Wie migriert man von Tabellen zu einem CRM?",
      demo3Meta: "Teilantworten · Mittlere Sichtbarkeitschance",
    },
    pricing: {
      title: "Einfache, transparente Preise",
      sub:
        "Finde die Fragen, die deine Sichtbarkeit in KI und Suche wachsen " +
        "lassen. Jederzeit kündbar.",
      seeAll: "Alle Funktionen vergleichen →",
      note:
        "Statische Preise — Checkout ist noch nicht angebunden. Guthaben " +
        "wird manuell vergeben, solange das Produkt in der Preview ist.",
    },
    cta: {
      title: "Bereit, die Antwort zu werden?",
      sub:
        "Finde die relevanten Fragen, veröffentliche Antworten, die KI " +
        "versteht, und baue Sichtbarkeit, wo auch immer dein Publikum sucht.",
      primary: "Kostenlos starten",
      secondary: "Preise ansehen",
    },
    footer: {
      tagline:
        "Finde die Fragen, auf die KI-Suche Antworten braucht — und mach " +
        "deine Marke zur vertrauenswürdigen Quelle, die sie empfiehlt.",
      product: {
        heading: "Produkt",
        features: "Funktionen",
        pricing: "Preise",
        api: "API",
        changelog: "Changelog",
      },
      resources: {
        heading: "Ressourcen",
        blog: "Blog",
        seoGuides: "SEO-Guides",
        helpCenter: "Hilfezentrum",
        community: "Community",
      },
      company: {
        heading: "Unternehmen",
        about: "Über uns",
        contact: "Kontakt",
        privacy: "Datenschutz",
        terms: "Nutzungsbedingungen",
      },
      copyright: "© {year} AnswerGap. Alle Rechte vorbehalten.",
    },
    saved: {
      heading: "Deine letzten Analysen",
      demoHeading: "An echten Daten ansehen",
      count: "{count} gespeichert",
    },
  },
};
