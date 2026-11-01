import type { Messages } from "./types";

export const de: Messages = {
  brand: {
    name: "GetTopQuestions",
    tagline: "Finde die Fragen, die deine Wettbewerber nie beantwortet haben.",
  },

  landing: {
    treeCount: "{count} gespeichert",
    emptyTitle: "Noch keine Suchen.",
    emptyBody:
      "Suchen Sie oben nach einem Keyword, dann erscheint es hier. Ihre " +
      "Suchen bleiben privat und gehören zu Ihrem Konto.",
    headline: "Finde die Fragen, die deine Wettbewerber nie beantwortet haben.",
    intro:
      "GetTopQuestions entfaltet Googles „Ähnliche Fragen“ zu einem Fragenbaum, prüft " +
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
    pngUncheckedNote: "Noch keine Frage geprüft: Jedes Feld bleibt grau, bis seine Suchergebnisse geprüft sind",
    pngRepeatNote: "×N = Google zeigte diese Frage unter N verschiedenen Zweigen",
    seeds: "Ähnliche Suchanfragen",
    tree: "Baum",
    showDetails: "Details anzeigen",
    table: "Tabelle",
    searchPlaceholder: "Fragen filtern…",
    showing: "{shown} von {total} Fragen",
    exportCsv: "CSV exportieren",
    exportCsvHint: "Lädt die angezeigten Zeilen herunter, mit Ihren Filtern.",
    exportPng: "Bild herunterladen",
    exportPngHint: "Speichert den ganzen Baum als PNG, nicht nur den sichtbaren Teil.",
    zoomIn: "Vergrößern",
    zoomOut: "Verkleinern",
    zoomLevel: "Zoomstufe",
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
    sortBy: "Sortieren nach",
    volumeNote: "Suchvolumen: noch keine Daten, weil Google Ads nicht verbunden ist. Bis dahin sind die Zweige (unter wie vielen Fragen eine Frage auftauchte) das Interessensignal.",
  },

  ai: {
    heading: "Google AI Overview in diesem Baum",
    noneChecked: "Es wurde noch keine Frage geprüft. Eine Prüfung zeigt ohne Zusatzkosten auch, ob Googles AI Overview die Frage beantwortet und welche Websites es zitiert.",
    coverage: "Googles KI-Übersicht zitiert Quellen bei {withAi} von {checked} Fragen, deren KI-Antwort lesbar war.",
    citedIn: "zitiert bei {count} von {checked}",
    pngTop: "Am häufigsten in AI Overviews zitiert: {domains}",
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
    notScoredYet: "Diese Frage wurde <b>noch nicht geprüft</b>. Die Prüfung kostet einen Credit und passiert deshalb nie automatisch — und bis dahin weiß niemand, ob sie jemand beantwortet.",
    scoreButton: "Diese Frage prüfen · 1 Credit",
    scoring: "Diese Frage wird gesucht… (30–60 Sekunden)",
    scoreCost: "Die Frage wird eigenständig gesucht: Ihr Ergebnis erscheint hier, und sie bekommt ihren eigenen Fragenbaum. Eine bereits gesuchte Frage kostet nichts.",
    openTree: "Fragenbaum dieser Frage öffnen",
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
    credits: "{count} Guthaben",
    queueDiscount:
      "Halber Preis: Die Sammelprüfung läuft über die Warteschlange, statt " +
      "sofort zurückzukommen.",
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

  rounds: {
    first: "Baum analysieren und erweitern · 2 Credits",
    second: "Noch einmal erweitern · 3 Credits",
    confirmCount: "{count} Fragen werden analysiert",
    grows: "Jede analysierte Frage bringt ihre eigenen Fragen mit, daher wächst der Baum.",
    leftOut: "{count} weitere liegen über dem Limit dieser Runde und bleiben unanalysiert.",
    limit: "Rundenlimit erreicht · {count} Fragen nicht analysiert",
    limitNone: "Rundenlimit erreicht",
  },

  deep: {
    open: "Geschlossene Zweige öffnen",
    openCount: "{count} geschlossene Zweige öffnen",
    closedHint: "Google hat {open} der {total} Hauptfragen geöffnet und {closed} geschlossen gelassen.",
    confirmCount: "{count} Zweige",
    queueDiscount:
      "Halber Preis: Die Zweige öffnen sich in der Warteschlange, statt " +
      "sofort zurückzukommen.",
    alsoScores:
      "Jeder wird dabei auch auf Lücken geprüft, ohne Aufpreis.",
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
    signUpTitle: "GetTopQuestions-Konto erstellen",
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
    deleteSubscription: "Dein bezahlter Plan wird sofort gekündigt und nicht erneut abgerechnet. Der Rest des laufenden Zeitraums wird nicht erstattet.",
    deleteConfirmPassword: "Zum Bestätigen dein Passwort eingeben",
    deleteConfirmEmail: "Zum Bestätigen {email} eingeben",
    deleteSubmit: "Mein Konto löschen",
    deleteCancel: "Konto behalten",
    verifyExpiredTitle: "Dieser Link ist abgelaufen",
    verifyExpiredSub:
      "Ein Bestätigungslink gilt nur einmal und nur kurze Zeit. Gib deine Adresse ein, wir senden einen neuen.",
    verifyExpiredSubmit: "Neuen Link senden",
    close: "Schließen",
    dialogTitle: "Bei GetTopQuestions anmelden",
    benefitCredits: "Guthaben für Suchen und Fragenprüfungen",
    benefitPrivate: "Ihre Suchen bleiben Ihre — niemand sonst sieht sie",
    benefitScore: "Jede Frage gegen die Seiten prüfen, die dafür ranken",
    noCard: "Keine Karte. In der Vorschau wird Guthaben von Hand vergeben.",
    signIn: "Mit Google anmelden",
    signOut: "Abmelden",
    signedInAs: "Angemeldet als {email}",
    account: "Konto",
    alreadySignedIn: "Sie haben bereits ein Konto",
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
    periodHeading: "Dieser Zeitraum",
    periodUsed: "{used} von {granted} Credits in diesem Zeitraum verbraucht",
    periodResets: "wird am {date} zurückgesetzt",
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
      "Kündigen, Karte ändern oder Rechnungen herunterladen. Öffnet Stripe.",

    creditsHeading: "Guthaben",
    balanceLead:
      "Eine Suche kostet ein Guthaben. Eine gespeicherte Suche erneut zu öffnen ist kostenlos.",
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
    myPlansHeading: "Deine Pläne",
    myPlansLead: "Credits werden zuerst aus dem Plan verbraucht, dessen Zeitraum am frühesten endet; sind sie aufgebraucht, kommt der nächste Plan an die Reihe. Credits, die ein Plan in seinem Zeitraum nicht verbraucht, verfallen am Ende des Zeitraums. Credits aus keinem Plan werden zuletzt verbraucht.",
    otherCredits: "Credits ohne Plan (Willkommen, Geschenke): {count}, zuletzt verbraucht",
    spendingFrom: "Wird gerade verbraucht",
    creditsLeftOf: "Noch {left} von {total} Credits in diesem Zeitraum",
    burnsOn: "Nicht verbrauchte Credits verfallen am {date}",
    defaultBadge: "Standard",
    makeDefault: "Als Standard festlegen",
    ofTotalLeft: "von {total} Credits übrig",
    usedCount: "{count} verbraucht",
    confirmDefault: "{plan} als Standard festlegen? Deine anderen Pläne ({others}) verlängern sich nicht; ihre Credits kannst du bis zum Ende ihres Zeitraums nutzen.",
    confirmDefaultAlone: "{plan} als Standard festlegen?",
    confirmDefaultYes: "Ja, als Standard festlegen",
    defaultRenewsNote: "{plan} verlängert sich automatisch jeden Monat. Du kannst das jederzeit unter „{manage}“ beenden.",
    autoRenewHint: "Verlängert sich automatisch jeden Monat · jederzeit unter „{manage}“ beendbar",
    cancelStep: "Abbrechen",
    endingMakeDefault: "Dieser Plan endet am {date}. Um ihn zu behalten, wähle oben „Als Standard festlegen“; du musst ihn nicht erneut kaufen.",
    endingRenewInPortal: "Dieser Plan endet am {date}. Um ihn zu behalten, verlängere ihn unter „{manage}“; du musst ihn nicht erneut kaufen.",
    chooseAdditional: "{plan} als zweiten Plan hinzufügen",
    additionalWarn: "Dein aktueller Plan läuft weiter und dieser Plan wird zusätzlich berechnet. Nur dein Standardplan verlängert sich jeden Monat: dieser endet nach seinem ersten Zeitraum. Soll er sich verlängern, lege ihn als Standard fest; deine anderen Pläne enden dann am Ende ihres Zeitraums.",
    additionalYes: "Verstanden, weiter zur Zahlung",
    contactUs: "Kontakt aufnehmen",
    seeAllPlans: "Alle Tarife ansehen",

    billingDone:
      "Vielen Dank. Ihr Tarif wird eingerichtet — es kann einen Moment dauern, bis er hier erscheint.",
    billingCancelled: "Es wurde nichts berechnet.",

    settingsHeading: "Einstellungen",
    theme: "Darstellung",
    language: "Sprache",
    dangerHeading: "Konto löschen",

    navOverview: "Übersicht",
    navProfile: "Profil",
    navSubscription: "Abonnement",
    navSettings: "Einstellungen",
    navSearches: "Meine Suchen",
    hello: "Hallo, {name}",
    overviewLead: "Ihre Credits, Ihr Tarif und Ihr Konto auf einen Blick.",
    newSearch: "Neue Suche starten",
    newSearchLead: "Jede neue Suche kostet einen Credit. Eine bereits durchgeführte Suche erneut zu öffnen ist kostenlos.",
    noAllowance: "Kein monatliches Kontingent. Ein Tarif fügt jeden Monat Credits hinzu.",
    overdrawn: "Ihr Guthaben ist {count}: Die nächsten Credits gleichen das zuerst aus.",
    changePlan: "Tarif wechseln",
    profileLead: "Wer Sie sind und wie Sie sich anmelden.",
    subscriptionLead: "Ihr Tarif, Ihre Credits und die Tarife, zu denen Sie wechseln können.",
    settingsLead: "Wie GetTopQuestions aussieht und mit Ihnen spricht.",
    themeLead: "Hell, dunkel oder wie Ihr System.",
    languageLead: "Die Sprache der Oberfläche.",
  },

  home: {
    statAnalyses: "Analysen",
    statGaps: "unbeantwortete Fragen gefunden",
    filter: "Analysen filtern…",
    sortLabel: "Sortieren",
    sortNewest: "Neueste zuerst",
    sortQuestions: "Meiste Fragen",
    sortGaps: "Meiste unbeantwortete",
    noMatch: "Keine Analyse passt zu „{query}“.",
    unanswered: "unbeantwortet",
    notChecked: "Noch nicht geprüft",
    jobReady: "ist fertig.",
    jobOpen: "Baum öffnen",
    jobLost:
      "— die Seite wurde während der Suche neu geladen, und ihr Ergebnis ist noch nicht aufgetaucht. Wenn es unten nicht bei Ihren Analysen steht, suchen Sie erneut: Eine abgeschlossene Suche kostet beim zweiten Mal nichts.",
  },

  strip: {
    left: "Credits übrig",
    upgrade: "Upgrade",
    choosePlan: "Tarif wählen",
    jobRunning: "„{seed}“ wird gesucht…",
    jobReady: "„{seed}“ ist fertig",
  },

  refresh: {
    live: "Live",
    title: "Erneut suchen für die neuesten Daten (1 Credit)",
    busy: "Eine andere Suche läuft noch",
    confirm: "Neueste Daten abrufen? Kostet 1 Credit.",
    yes: "Aktualisieren",
    no: "Abbrechen",
    running: "Wird aktualisiert…",
    processing: "Wird verarbeitet…",
    processingNote: "Die Fragen werden gesammelt und die Ergebnisse geprüft. Das dauert einen Moment.",
    saved: "Gespeichert",
  },

  repeat: {
    title: "Sie haben „{seed}“ bereits gesucht",
    lead: "Öffnen Sie Ihr gespeichertes Ergebnis oder rufen Sie die neuesten Daten ab.",
    leadDated: "Ihr gespeichertes Ergebnis ist vom {date}. Öffnen Sie es oder rufen Sie die neuesten Daten ab.",
    open: "Gespeichertes Ergebnis öffnen",
    openNote: "Kostenlos · öffnet sofort",
    update: "Mit neuesten Daten aktualisieren",
    updateNote: "1 Credit · wird erneut gesucht",
    cancel: "Abbrechen",
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
    searchUnavailable:
      "Die Suche ist vorübergehend nicht verfügbar. Wir wurden benachrichtigt und kümmern uns darum. Es wurde kein Credit verbraucht.",
    searchFailed:
      "Die Suche konnte nicht abgeschlossen werden. Es wurde kein Credit verbraucht - bitte versuchen Sie es in einer Minute erneut.",
    alreadySearched: "Diese Suche haben Sie bereits durchgeführt. Öffnen Sie sie in Ihrer Liste oder aktualisieren Sie sie.",
    anonLimit: "Sie haben die kostenlose Suche für heute genutzt. Legen Sie ein kostenloses Konto an, um weiterzusuchen.",
    anonDailyFull: "Die kostenlosen Suchen für heute sind aufgebraucht. Legen Sie ein kostenloses Konto an, um sofort zu suchen.",
    captchaFailed: "Wir konnten nicht bestätigen, dass diese Suche von einem Menschen kommt. Bitte versuchen Sie es erneut.",
    badRequest: "Diese Anfrage kann so nicht ausgeführt werden.",
    planNotPurchasable:
      "Dieser Tarif kann noch nicht gekauft werden — wir richten die Zahlung " +
      "dafür noch ein. Melden Sie sich bei uns, wir kümmern uns darum.",
    noSuchPlan: "Diesen Tarif gibt es nicht mehr.",
    roundLimit: "Dieser Baum hat beide Analyserunden bereits genutzt.",
    roundInFlight: "Die Ergebnisse der vorigen Runde treffen noch ein. Versuchen Sie es danach erneut.",
    noCustomer:
      "Es gibt noch nichts zu verwalten — für dieses Konto wurde nie abgerechnet.",
    paymentsOff: "Zahlungen sind noch nicht freigeschaltet.",
    subscriptionCancelFailed: "Wir konnten dein Abonnement nicht kündigen, daher wurde dein Konto nicht gelöscht. Versuche es in ein paar Minuten erneut oder schreib dem Support.",
    alreadyOnPlan: "Diesen Plan hast du bereits. Endet er, lege ihn unter „Deine Pläne“ als Standard fest, um ihn zu behalten; oder wähle einen anderen Plan.",
    planPaymentFailed: "Die Zahlung für diesen Plan ist nicht durchgegangen, daher kann er nicht Ihr Standard werden. Aktualisieren Sie zuerst Ihre Karte unter „Abrechnung verwalten“ oder wählen Sie einen bezahlten Plan.",
    stripeFailed: "Der Zahlungsanbieter hat die Änderung nicht angenommen. Es wurde nichts geändert; versuchen Sie es in ein paar Minuten erneut.",
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

  anon: {
    freeTitle: "Ohne Konto haben Sie {count} kostenlose Suche pro Tag",
    freeNote: "Sie sehen den Fragenbaum und die Tabelle. Fragen analysieren, den Baum erweitern und exportieren ist Mitgliedern vorbehalten.",
    usedTitle: "Sie haben die kostenlose Suche für heute genutzt",
    resetsIn: "Ihre nächste kostenlose Suche kommt in {hours} Std. {minutes} Min., um {clock}. Legen Sie ein kostenloses Konto an, um sofort zu suchen.",
    dailyFull: "Die kostenlosen Suchen für heute sind aufgebraucht.",
    usedUpReason: "Mit einem kostenlosen Konto sehen Sie den ganzen Fragenbaum und Ihre Suchen bleiben gespeichert.",
    signUpFree: "Kostenloses Konto anlegen",
    verifying: "Wird geprüft…",
    previewTitle: "Ihre kostenlose Suche ohne Konto",
    previewBody: "Sie sehen Baum und Tabelle so, wie die Suche sie geliefert hat. Legen Sie ein kostenloses Konto an, um Fragen zu analysieren, den Baum zu erweitern und PNG/CSV herunterzuladen.",
    previewEmpty: "Google hat zu dieser Suche keine Fragen gezeigt, deshalb wurde Ihre kostenlose Suche nicht verbraucht. Versuchen Sie eine Frage oder ein paar Wörter, etwa „Filterkaffee richtig aufbrühen“.",
    hint: "Tipp: Fragen oder ein paar Wörter funktionieren am besten („Filterkaffee richtig aufbrühen“). Zu Markennamen und einzelnen Wörtern zeigt Google oft keine Fragen.",
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
      menu: "Menü",
    },
    hero: {
      eyebrow: "Fragenrecherche für Creator, Gründer und Marketer",
      headlinePre: "Finde die Fragen,",
      headlineHighlight: "die eine Antwort wert sind",
      sub:
        "Gib einen Begriff ein, entdecke die meistgestellten verwandten Fragen " +
        "und nutze sie für hilfreiche Inhalte für die klassische Suche, Google " +
        "AI Overviews und die dialogische KI-Suche.",
      signedInTitle: "Was sollen wir untersuchen?",
      searchPlaceholder: "Gib einen Begriff ein, z. B. Stehschreibtisch",
      searchCta: "Suchen",
      searching: "Suche…",
      elapsed: "seit {seconds} s",
      tryLabel: "Beispielsuchen:",
      try1: "bestes CRM für Startups",
      try2: "AI-SEO-Tools",
    },
    picker: {
      open: "Suchmarkt wählen",
      country: "Land",
      language: "Sprache",
      search: "Länder suchen",
      none: "Kein Land gefunden",
    },

    howItWorks: {
      eyebrow: "So funktioniert es",
      title: "Beginne mit dem, was Menschen wirklich fragen.",
      sub:
        "GetTopQuestions zeigt die Fragen rund um deinen Begriff, damit du " +
        "nützliche, gut strukturierte Inhalte planen kannst, die auf echter " +
        "Neugier beruhen.",
      card1: {
        label: "Fragenrecherche",
        title: "Verwandte Fragen entdecken",
        body:
          "Mach aus einem einzelnen Begriff die meistgestellten verwandten " +
          "Fragen, von der ersten Neugier über den Vergleich bis zur Entscheidung.",
      },
      card2: {
        label: "Redaktionsplanung",
        title: "Content-Chancen erkennen",
        body:
          "Lies die Fragen mit dem Blick einer Redaktion und erkenne, welche " +
          "deine Inhalte unbeantwortet lassen oder nur am Rande streifen.",
      },
      card3: {
        label: "Autorität",
        title: "Themenautorität aufbauen",
        body:
          "Gruppiere zusammenhängende Fragen und plane Inhalte, die ein Thema " +
          "gründlich abdecken, klar geschrieben für Lesende, Suchmaschinen und " +
          "KI-Assistenten.",
      },
    },

    workflow: {
      eyebrow: "Der Ablauf",
      titleLead: "Begriff rein. Fragen raus.",
      titleMuted: "Inhalte von dir.",
      body:
        "GetTopQuestions ist ein Startpunkt für die Recherche. Es schreibt und " +
        "veröffentlicht nicht für dich und verfolgt keine Rankings. Es zeigt dir, " +
        "was Menschen fragen, damit deine Inhalte auf ihren Fragen beruhen statt " +
        "auf deinen Annahmen.",
      step1: {
        label: "01 / Begriff",
        title: "Beginne mit den Worten deiner Zielgruppe",
        body:
          "Gib eine Produktkategorie, ein Problem, eine Funktion oder einen " +
          "einfachen Ausdruck wie „Stehschreibtisch“ ein. Breit ist in Ordnung. " +
          "Es geht darum, die Tür zu öffnen, nicht um das perfekte Keyword.",
        sample: "Stehschreibtisch",
      },
      step2: {
        label: "02 / Fragen",
        title: "Sieh, was Menschen dazu fragen",
        body:
          "GetTopQuestions zeigt die meistgestellten verwandten Fragen, damit du " +
          "das Thema so liest, wie es neugierige Käufer, Einsteiger oder " +
          "Skeptiker formulieren würden.",
        sample: "Lohnt sich ein Stehschreibtisch bei Rückenschmerzen?",
      },
      step3: {
        label: "03 / Inhalt",
        title: "Entscheide, was du als Nächstes schreibst",
        body:
          "Gruppiere Fragen nach Absicht, wähle die aus, die du mit echter " +
          "Expertise beantworten kannst, und mach daraus Seiten, Abschnitte, " +
          "FAQs, Videos oder Beiträge. Das Schreiben bleibt deins.",
        sample: "Leitfaden: Wem Stehen wirklich hilft und wem nicht",
      },
    },

    examples: {
      eyebrow: "Von der Frage zum Inhalt",
      title: "So sieht eine Lücke aus.",
      sub:
        "Wähle ein Thema. Diese Beispiele hat unser Team verfasst, um zu zeigen, " +
        "wie man ein Ergebnis liest. Sie sind keine echte Ausgabe der App.",
      columnQuestion: "Frage der Menschen",
      columnPages: "Seiten, die darauf abzielen",
      columnVerdict: "Ergebnis",
      columnIdea: "Was tun",
      skipIdea: "Überspringen, außer du hast etwas Neues beizutragen",
      tab1: {
        term: "Sauerteig ansetzen",
        q1: "Warum geht mein Sauerteig nach einer Woche nicht mehr auf?",
        idea1: "Eine Diagnose-Checkliste: Temperatur, Mehl, Fütterung, Timing",
        q2: "Kann ich für Sauerteig normales Weizenmehl nehmen?",
        idea2: "Eine direkte Antwort, dann die Abwägungen, als FAQ-Block",
        q3: "Wie setzt man Sauerteig an?",
      },
      tab2: {
        term: "Rechnungssoftware",
        q1: "Darf ich ohne Gewerbe Rechnungen schreiben?",
        idea1: "Ein verständlicher Leitfaden, nach Situation gegliedert",
        q2: "Ist Rechnungssoftware steuerlich absetzbar?",
        idea2: "Eine kurze Antwort mit durchgerechneten Beispielen",
        q3: "Was ist die beste Rechnungssoftware?",
      },
      tab3: {
        term: "Trailrunning-Schuhe",
        q1: "Kann man mit Trailrunning-Schuhen auf nassem Fels laufen?",
        idea1: "Ein getesteter Vergleich mit eigenen Fotos",
        q2: "Wie lange halten Trailrunning-Schuhe?",
        idea2: "Ein Kilometer-Ratgeber mit den Anzeichen von Verschleiß",
        q3: "Was sind die besten Trailrunning-Schuhe?",
      },
    },

    builtFor: {
      eyebrow: "Für die KI-Suche gemacht",
      title: "Beantworte echte Fragen. Werde von KI gefunden.",
      body:
        "Suche wird zum Gespräch. GetTopQuestions zeigt dir, was deine " +
        "Zielgruppe fragt und wo die vorhandenen Antworten zu kurz greifen, " +
        "damit du klare Antworten für AI Overviews, Assistenten und die " +
        "klassische Suche schreiben kannst. Sichtbarkeit ist nie garantiert, " +
        "aber eine Frage, die niemand beantwortet hat, ist der richtige Anfang.",
      point1: "Sieh bei jeder geprüften Frage, welche Websites Googles AI Overview zitiert",
      point2: "Gib deine Website ein und sieh die Fragen, bei denen du zitiert wirst",
      point3: "Strukturiere Inhalte entlang echter, dialogischer Suchanfragen",
      demoLabel: "Beispiel: CRM",
      demo1Q: "Was ist das beste CRM für kleine Unternehmen?",
      demo1Meta: "6 von 8 Seiten zielen darauf ab",
      demo2Q: "Brauche ich ein CRM, wenn ich Google Workspace nutze?",
      demo2Meta: "0 von 8 Seiten zielen darauf ab",
      demo3Q: "Wie wechselt man von der Tabelle zum CRM?",
      demo3Meta: "2 von 8 Seiten zielen darauf ab",
      demoNote: "Von unserem Team verfasstes Beispiel. Keine echten Messwerte.",
    },

    formats: {
      eyebrow: "Content-Formate",
      title: "Lass die Frage das Format wählen.",
      body:
        "Wie eine Frage formuliert ist, verrät, wie sie beantwortet werden will. " +
        "Klare, gut gegliederte Antworten helfen Lesenden auf klassischen " +
        "Ergebnisseiten, in Google AI Overviews und in dialogischen Assistenten " +
        "gleichermaßen. Garantien gibt es nirgends, aber eine hilfreiche " +
        "Struktur ist eine gute Wahl.",
      card1: {
        title: "FAQ-Bereiche",
        when: "Wenn eine Frage eine kurze, sachliche Antwort hat.",
        how: "Beginne mit der Antwort in ein bis zwei Sätzen, dann die Details.",
      },
      card2: {
        title: "Ausführliche Leitfäden",
        when: "Wenn mehrere Fragen dasselbe Grundproblem haben.",
        how: "Mach jede Frage zur Zwischenüberschrift, damit man direkt hinspringen kann.",
      },
      card3: {
        title: "Vergleichsseiten",
        when: "Wenn Fragen „vs“, „oder“ oder „besser“ enthalten.",
        how: "Sag genau, für wen welche Option passt. Tabellen helfen.",
      },
      card4: {
        title: "Schritt-für-Schritt-Anleitungen",
        when: "Wenn Fragen mit „wie mache ich“ beginnen.",
        how: "Nummeriere die Schritte und sag, woran man erkennt, dass es fertig ist.",
      },
      card5: {
        title: "Kurzvideo und Social Media",
        when: "Wenn sich die Antwort schnell zeigen lässt.",
        how: "Bring die Frage in den ersten Sekunden auf den Bildschirm.",
      },
      card6: {
        title: "Newsletter und Vertriebsnotizen",
        when: "Wenn Fragen Einwände oder Zögern verraten.",
        how: "Beantworte den Zweifel ehrlich, bevor daraus eine verlorene Antwort wird.",
      },
    },

    faq: {
      eyebrow: "Praktische Antworten",
      title: "Fragen zu GetTopQuestions",
      q1: "Was macht GetTopQuestions genau?",
      a1:
        "Du gibst einen Begriff ein und GetTopQuestions zeigt die dazu " +
        "meistgestellten Fragen. Mit diesen Fragen planst und schreibst du " +
        "hilfreiche Inhalte. Das ist die ganze Idee: ein praktischer Startpunkt " +
        "für die Fragenrecherche.",
      q2: "Schreibt oder veröffentlicht es Inhalte für mich?",
      a2:
        "Nein. GetTopQuestions hilft dir zu entscheiden, worüber du schreibst. " +
        "Schreiben, Bearbeiten und Veröffentlichen bleiben bei dir, und genau " +
        "dort kommen deine Expertise und deine Stimme ins Spiel.",
      q3: "Verfolgt es meine Rankings oder KI-Erwähnungen?",
      a3:
        "Nein. GetTopQuestions ist kein Rank-Tracker, kein Marken-Monitoring und " +
        "keine Zitationsanalyse und meldet keine Suchvolumen. Der Fokus liegt " +
        "darauf, Fragen zu entdecken.",
      q4: "Bringt mich die Beantwortung dieser Fragen in AI Overviews?",
      a4:
        "Das kann niemand versprechen. Echte Fragen klar und korrekt zu " +
        "beantworten ist eine vernünftige Grundlage für die klassische Suche, " +
        "Google AI Overviews und die dialogische KI-Suche, aber über die " +
        "Platzierung entscheiden diese Plattformen.",
      q5: "Mit welchem Begriff sollte ich anfangen?",
      a5:
        "Mit etwas, das deine Zielgruppe wirklich tippen oder sagen würde: eine " +
        "Produktkategorie, ein Problem, eine Aufgabe oder ein Vergleich. Wirken " +
        "die Ergebnisse zu breit, versuch einen engeren Ausdruck aus den eben " +
        "gefundenen Fragen.",
      q6: "Wie viele Fragen sollte eine Seite beantworten?",
      a6:
        "Meist eine Hauptfrage plus die eng verwandten Folgefragen, die Lesende " +
        "als Nächstes stellen würden. Brauchen zwei Fragen für verschiedene " +
        "Menschen verschiedene Antworten, verdienen sie vermutlich eigene Beiträge.",
    },

    pricing: {
      billed: "Monatliche Abrechnung",
      signUpNow: "Jetzt registrieren",
      tax: "+ Steuern",
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
      title: "Bereit für deine nächste Frage?",
      sub:
        "Gib einen Begriff ein, sieh, was Menschen fragen, und plane Inhalte, die " +
        "ihnen wirklich helfen, wo immer sie suchen.",
      primary: "Kostenlos starten",
      secondary: "Preise ansehen",
    },

    footer: {
      tagline:
        "Entdecke die Fragen, die Menschen zu deinem Thema stellen, und erstelle " +
        "hilfreiche Inhalte, die sie beantworten.",
      product: {
        heading: "Produkt",
        features: "Funktionen",
        pricing: "Preise",
        api: "API",
        changelog: "Änderungsprotokoll",
      },
      resources: {
        heading: "Ressourcen",
        blog: "Blog",
        seoGuides: "SEO-Leitfäden",
        helpCenter: "Hilfe-Center",
        community: "Community",
      },
      company: {
        heading: "Unternehmen",
        about: "Über uns",
        contact: "Kontakt",
        privacy: "Datenschutz",
        terms: "Nutzungsbedingungen",
      },
      copyright: "© {year} GetTopQuestions. Alle Rechte vorbehalten.",
    },

    saved: {
      heading: "Deine letzten Analysen",
      demoHeading: "An echten Daten ansehen",
      count: "{count} gespeichert",
    },
  },
};
