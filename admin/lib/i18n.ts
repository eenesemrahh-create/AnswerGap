/**
 * The operator console in two languages.
 *
 * THE FILE HEADER ON `layout.tsx` USED TO SAY ENGLISH ONLY, and its reasoning
 * was sound for what it was answering: the customer app carries FIVE locales
 * and a build gate, and putting this console through the same machinery would
 * mean four more files and four broken builds every time a label changes. At
 * five that cost buys nothing. At TWO it is one file and one broken build, and
 * what it buys is the person who actually runs the product reading their own
 * panel in their own language. The principle did not change; its input did.
 *
 * PURE DATA AND ONE PURE FUNCTION, with no `server-only` import, because the
 * four client components (`editor`, `board`, `panel`, `EraseAccount`) need the
 * same strings and a function cannot cross that boundary as a prop. They take
 * `locale` and build their own `t`. Reading the cookie is the part that is
 * server-only, and that lives in `lib/locale.ts`.
 *
 * NOT TRANSLATED: the Guide page. It is an operator manual, a third of all the
 * prose in here on its own, and the part most likely to drift out of step with
 * the code it describes. It says so at the top of itself.
 */

export const LOCALES = ["tr", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Turkish first: the person running this product reads Turkish. */
export const DEFAULT_LOCALE: Locale = "tr";
export const LOCALE_COOKIE = "ag_admin_lang";

export const LOCALE_NAMES: Record<Locale, string> = {
  tr: "Türkçe",
  en: "English",
};

export function isLocale(value: string | undefined): value is Locale {
  return value === "tr" || value === "en";
}

const en = {
  nav: {
    overview: "Overview",
    users: "Users",
    reports: "Reports",
    settings: "Settings",
    payments: "Payments",
    ci: "CI",
    guide: "Guide",
    audit: "Audit",
    signOut: "Sign out",
    language: "Language",
  },

  common: {
    save: "Save",
    apply: "Apply",
    filter: "Filter",
    cancel: "Cancel",
    none: "—",
    nothingYet: "Nothing yet.",
    noMatch: "No users match.",
    anyStatus: "Any status",
    active: "Active",
    suspended: "Suspended",
    erased: "Erased",
    unverified: "unverified",
    password: "password",
    google: "google",
    when: "When",
    who: "Who",
    did: "Did",
    to: "To",
    detail: "Detail",
    email: "Email",
    status: "Status",
    credits: "Credits",
    spend: "Spend",
    joined: "Joined",
    lastSeen: "Last seen",
    searches: "Searches",
    signIn: "Sign-in",
  },

  overview: {
    title: "Overview",
    lead:
      "Searching requires an account · new accounts start with {signup} " +
      "credits.",
    users: "Users",
    total: "Total",
    newThisWeek: "New this week",
    creditsHeading: "Credits",
    granted: "Granted",
    spent: "Spent",
    outstanding: "Outstanding",
    outstandingNote: "what people still hold",
    today: "Today",
    allowed: "Allowed",
    anonymous: "Anonymous",
    anonymousNote: "signed-out visitors",
    refused: "Refused",
    refusedNote: "limit, credits or suspension",
    spendHeading: "Spend",
    liveQueue: "Live queue",
    liveQueueNote: "a person was waiting",
    standardQueue: "Standard queue",
    standardQueueNote: "batch scoring, ~3.3x cheaper",
    attributed: "Attributed",
    attributedNote: "traced to a person; excludes anything before accounts existed",
    footer:
      "Every figure is reported by DataForSEO, never estimated. A panel filled " +
      "with plausible guesses would be worse than no panel — it looks like evidence.",
  },

  users: {
    title: "Users",
    lead:
      "Balance and spend come back with the list in one query — never one " +
      "query per row.",
    searchPlaceholder: "Search by email",
  },

  userDetail: {
    joinedAt: "joined",
    lastSeenAt: "last seen",
    creditsCard: "Credits",
    creditsNote: "the sum of the ledger, never a stored total",
    searchesNote: "most recent 50",
    spendNote: "over those 50",
    lifetimeLink: "lifetime total",
    spendReported: "reported by DataForSEO",
    adminNotice:
      "This address is in ADMIN_EMAILS. Credits and suspension do not apply to " +
      "admins — they spend without being billed, and their spend is still " +
      "recorded. To remove the role, edit the variable in Railway and redeploy.",
    creditsHeading: "Credits",
    deltaPlaceholder: "+25 or -10",
    notePlaceholder: "Reason (optional)",
    noLedger: "No credit history.",
    delta: "Delta",
    reason: "Reason",
    ref: "Ref",
    note: "Note",
    account: "Account",
    suspend: "Suspend",
    reactivate: "Reactivate",
    statusNote:
      "Takes effect on the next request — status is re-read every time, so no " +
      "sign-out is needed. A suspended user stays signed in and simply cannot spend.",
    revoke: "Sign out everywhere",
    revokeNote:
      "Bumps the token epoch (now {epoch}), which invalidates every token " +
      "already issued. The only revocation there is — there is no session table.",
    activity: "Activity",
    action: "Action",
    outcome: "Outcome",
    cost: "Cost",
    tree: "Tree",
    noActivity: "No activity.",
    searchesHeading: "Searches",
    seed: "Seed",
    market: "Market",
    noSearches: "No searches owned by this account.",
  },

  erase: {
    heading: "Erase",
    already:
      "This account is already erased. Nothing further to do here — it comes " +
      "back only when the person proves the mailbox again, by signing up or " +
      "signing in with the same address.",
    button: "Erase this account",
    buttonNote:
      "Blanks the profile, deletes every live credential and unlinks every " +
      "search. Keeps the address and the payment amounts — the Privacy Policy " +
      "says so in section 7.",
    warnTitle: "This cannot be undone from here.",
    warnBody:
      "It erases {email}: name, picture, password and Google link blanked, " +
      "every session killed, every reset link deleted, and every search " +
      "unlinked from the person.",
    warnKeeps:
      "The address and the payment amounts are kept deliberately. If this " +
      "person signs up again with the same address, the account revives and " +
      "any credit balance they paid for comes back.",
    warnPayments:
      "Payments are matched by email address only — there is no other link — " +
      "so a checkout completed under a different address will not be redacted. " +
      "The count below will say so.",
    reasonPlaceholder: "Reason for the audit log (optional)",
    reasonWarning:
      "Do not type anything about the person here. Nothing redacts the audit " +
      "log, so a name written in this box outlives the erasure.",
    confirm: "Yes, erase {email}",
    done:
      "Erased. {crawls} searches unlinked, {events} usage rows unattributed, " +
      "{payments} payment payloads redacted, {creds} live credentials deleted.",
    alreadyDone: "Already erased — nothing was written.",
    failed: "The API refused. Check the api service log.",
  },

  reports: {
    title: "Reports",
    lead:
      "Spend and usage since {since}. Costs are what we paid the search " +
      "provider, read from its own response rather than estimated. Revenue " +
      "counts live payments only — a test payment in a revenue figure is how " +
      "the figure becomes a lie.",
    totalCost: "Total cost",
    totalCostNote: "{count} billable requests",
    revenue: "Revenue",
    revenueNote: "{live} live",
    revenueTest: ", {count} test (excluded)",
    margin: "Margin",
    marginNote: "revenue less what the searches cost",
    cached: "Served from cache",
    cachedNote: "{count} requests that cost nothing",
    outstanding: "Credits outstanding",
    outstandingNote: "{granted} granted · {spent} spent",
    adminSpend: "Of that, admin spend",
    adminSpendNote: "real money, billed to nobody",
    reconcile:
      "The provider's own receipts total {provider}, which is {gap} more than " +
      "the {attributed} traced to a person above. That gap is work done before " +
      "accounts existed, plus any receipt whose write failed — attribution is " +
      "best-effort on purpose, because losing a receipt is bad but losing the " +
      "customer's result on top of it is worse. Treat the larger figure as the " +
      "bill and the tables below as where the traceable part of it went.",
    byMonth: "By month",
    byMonthLead:
      "The four cost columns are the same dollars split by who spent them, so " +
      "they add up to Cost.",
    month: "Month",
    billable: "Billable",
    attempts: "Attempts",
    refused: "Refused",
    cost: "Cost",
    customers: "Customers",
    admin: "Admin",
    anonymous: "Anonymous",
    erased: "Erased",
    revenueCol: "Revenue",
    accounts: "Accounts",
    allMonths: "All {count} months",
    noUsage: "No usage recorded yet.",
    byAccount: "By account",
    byAccountLead:
      "Every account, ordered by what it cost us. Counts are over that " +
      "account's whole history — nothing here is truncated to a recent window, " +
      "only the list length is.",
    account: "Account",
    creditsLeft: "Credits left",
    paid: "Paid",
    lastActivity: "Last activity",
    noAccounts: "No accounts yet.",
    caveats:
      "Two things this screen cannot tell you, so that nobody reads more into " +
      "it than is there. Payments are matched to an account by email address " +
      "only — payment_event has no account id — so a checkout completed under " +
      "a different address shows as unpaid. And an admin is an entry in " +
      "ADMIN_EMAILS rather than a row, so the admin split is computed from that " +
      "list at query time, not stored on the event.",
  },

  settings: {
    title: "Settings",
    lead:
      "Changed here, not in a deploy. Every change appends a row rather than " +
      "overwriting one, so “what was the limit last Tuesday” stays " +
      "answerable once somebody disputes a bill.",
    signupLabel: "Credits for a new account",
    explainHeading: "What this actually does",
    explainSignedOut:
      "Signing in is required before any search. There used to be one free " +
      "search a day for signed-out visitors, counted against a browser id and " +
      "a hashed IP; it was retired on 23 September 2026 because both are " +
      "resettable — clearing site data defeats one, a new network defeats the " +
      "other — so it was a speed bump rather than a limit, and it was the only " +
      "place the product spent real money on somebody it could not name.",
    explainSignup:
      "is granted once, by the same statement that creates the account. " +
      "Existing accounts are unaffected. A search costs one credit; a cached " +
      "result costs nothing, so re-running the same search is free.",
    noCheckout:
      "There is no checkout yet — credits are added by hand from a user's page.",
    landingHeading: "Marketing landing",
    landingLead:
      "The pricing section on the marketing landing reads from a separate " +
      "setting — plan cards with name, price and features.",
    editPricing: "Edit pricing plans →",
  },

  audit: {
    title: "Audit",
    lead:
      "Every privileged action, append-only. An admin's compromised Google " +
      "account is a compromised panel — there is no second factor here. This " +
      "log is what makes that damage visible rather than impossible, which is " +
      "the only guarantee actually available.",
  },

  ci: {
    title: "CI",
    lead:
      "Tests run on GitHub Actions against a throwaway Postgres, never on this " +
      "server, and they run on every push to {branch}. This page reads their " +
      "results{trigger}. Railway deploys that branch whether or not they pass, " +
      "unless “Wait for CI” is switched on for each service.",
    canTrigger: " and can ask GitHub to run them again",
  },

  stripe: {
    title: "Payments",
    lead:
      "The smallest slice that proves the pipe: the secret key can read the " +
      "account, Checkout opens a session, and the signed webhook comes back " +
      "with the money. Plans and credit grants are not wired to any of this " +
      "yet — a successful payment is recorded, and nothing else happens.",
  },

  signin: {
    title: "AnswerGap admin",
    failed: "Sign-in did not finish. Try again.",
    expired: "That session has ended. Sign in again.",
    lead:
      "Only addresses listed in ADMIN_EMAILS on the api service can open this " +
      "panel. That list lives in Railway, not in the database — nothing in the " +
      "product can grant it.",
    button: "Sign in with Google",
  },

  noAccess: {
    title: "Not an admin",
    signedInAs: "Signed in as {email}, which is not in ADMIN_EMAILS.",
    unknown: "This account is not in ADMIN_EMAILS.",
  },

  editor: {
    planName: "Plan name",
    oneLine: "One-line description",
    cta: "CTA button label",
    addBadge: "+ Add badge (optional)",
    cardColour: "Card colour",
    feature: "Feature description",
    removeFeature: "Remove feature",
    reset: "Reset",
    resetTitle: "Reset this slot to its template",
    draft: "Draft",
    published: "Published",
    nothingPublished: "Nothing published",
    saveAll: "Save all cards",
    saving: "Saving…",
    saved: "Saved. The landing picks this up on next load.",
    saveFailed: "Save failed.",
    perMonth: "/month",
  },

  board: {
    run: "Run",
    result: "Result",
    commit: "Commit",
    took: "Took",
    jobs: "Jobs",
    noJobs: "No jobs reported yet.",
    earlier: "Earlier runs",
    openOnGitHub: "Open on GitHub",
    refresh: "Refresh",
    runNow: "Run now",
    runNowOn: "Run now on {branch}",
    trigger: "Trigger",
    rerun: "Re-run",
    rerunAll: "Re-run all jobs",
    rerunFailed: "Re-run failed",
    cancel: "Cancel",
    passed: "Passed",
    failed: "Failed",
    running: "Running",
    queued: "Queued",
    cancelled: "Cancelled",
    skipped: "Skipped",
    timedOut: "Timed out",
    unknown: "Unknown",
    needsToken: "Triggering needs CI_GITHUB_TOKEN on the api service — see below.",
    errNoAnswer: "GitHub did not answer. Showing the last good data.",
    errServer: "GitHub answered with an error. Showing the last good data.",
    errToken:
      "GitHub refused the token. It may have expired, or lack " +
      "“Actions: read and write” on this repository.",
    errRate:
      "GitHub's rate limit is spent for now. Showing the last good " +
      "data; it recovers within the hour.",
    errNotFound:
      "GitHub does not know this workflow yet — it appears after " +
      ".github/workflows/ci.yml is pushed.",
    errRefused: "GitHub refused ({code}).",
    errInvalid: "GitHub refused the request as invalid.",
    errState: "GitHub refused: that run is not in a state that allows this.",
  },

  panel: {
    keyMode: "Key mode",
    keyWorks: "Key works",
    chargesEnabled: "Charges enabled",
    webhookSecret: "Webhook secret",
    whatToSet: "What has to be set",
    openDashboard: "Open Stripe dashboard",
    refresh: "Refresh",
    startTest: "Start a test payment",
    startLive: "Start a LIVE payment",
    realCard: "This charges a real card.",
    cancel: "Cancel",
    received: "Payments received",
    when: "When",
    event: "Event",
    amount: "Amount",
    mode: "Mode",
    status: "Status",
    email: "Email",
    object: "Object",
    writtenBy: "Written by the signed webhook at",
    noBaseUrl: "PUBLIC_BASE_URL is unset",
    onRailway: "On the Railway api service:",
    and: "and",
    errNoAnswer: "Stripe did not answer.",
    errServer: "Stripe answered with a server error.",
    errOther: "Stripe answered with an error.",
    errRate: "Stripe is rate limiting us right now.",
    errKey: "Stripe refused the key. It may be revoked, or from a different account.",
    errNoKey: "STRIPE_SECRET_KEY is not set on the api service.",
    errNeedsConfirm: "A live charge has to be confirmed before it is started.",
    errNoReturnUrl:
      "WEB_BASE_URL is not set on the api service, so Checkout has nowhere " +
      "to return to.",
    errInvalid:
      "Stripe rejected the request as invalid — see the api log for its own " +
      "message.",
    errRefused: "Stripe refused ({code}).",
  },

  noAccessDetail: {
    listIsTheOnlyWay:
      "ADMIN_EMAILS is a comma-separated list on the api service in Railway. " +
      "It is matched on the address exactly, ignoring case and surrounding " +
      "spaces. There is no role column in the database and no endpoint that " +
      "writes one, so this list is the only way to grant access — add the " +
      "address there and redeploy the api service.",
    twoChecks:
      "Two things worth checking first: the variable is ADMIN_EMAILS, plural, " +
      "and a change only takes effect once the api service has restarted.",
  },

  apiError: {
    title: "The api returned {status}",
    hint503:
      "The api service says accounts are switched off. That means one of " +
      "SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, " +
      "PUBLIC_BASE_URL or DATABASE_URL is missing there.",
    hint500:
      "The api service failed while handling this. Its own log has the " +
      "traceback — the admin service only sees the status.",
    hintOther: "Check the api service's log for the matching request.",
    bodyInLog: "The full response body is in this service's log, prefixed",
  },

  pricing: {
    back: "← Settings",
    title: "Pricing plans",
    lead:
      "What the marketing landing shows in the pricing section. Between 0 and " +
      "4 plans; empty means the landing renders its hardcoded fallback in " +
      "every supported language. Once anything is saved here, the landing " +
      "shows THIS text in every locale — the multi-language fallback stops " +
      "applying, deliberately (see CLAUDE.md).",
    appendNote:
      "Saved changes append a row to app_setting: the previous value stays on " +
      "record and shows up in the audit log. Nothing here is overwritten in place.",
  },

  guide: {
    englishOnly:
      "This page is the operator manual and is kept in English only. It " +
      "describes the code closely enough that a translation would drift out of " +
      "step with it, and the drift would be invisible.",
  },
} as const;

/** Strip `as const` so the Turkish file is writable, exactly as the customer
 *  app's `i18n/types.ts` does. Adding a key to `en` breaks `tr` until it is
 *  translated: one broken build, which at two locales is the whole cost. */
type Widen<T> = T extends string ? string : { -readonly [K in keyof T]: Widen<T[K]> };
export type Messages = Widen<typeof en>;

const tr: Messages = {
  nav: {
    overview: "Genel bakış",
    users: "Kullanıcılar",
    reports: "Raporlar",
    settings: "Ayarlar",
    payments: "Ödemeler",
    ci: "CI",
    guide: "Kılavuz",
    audit: "Denetim",
    signOut: "Çıkış yap",
    language: "Dil",
  },

  common: {
    save: "Kaydet",
    apply: "Uygula",
    filter: "Filtrele",
    cancel: "Vazgeç",
    none: "—",
    nothingYet: "Henüz bir şey yok.",
    noMatch: "Eşleşen kullanıcı yok.",
    anyStatus: "Tüm durumlar",
    active: "Etkin",
    suspended: "Askıda",
    erased: "Silinmiş",
    unverified: "doğrulanmamış",
    password: "parola",
    google: "google",
    when: "Ne zaman",
    who: "Kim",
    did: "Ne yaptı",
    to: "Kime",
    detail: "Ayrıntı",
    email: "E-posta",
    status: "Durum",
    credits: "Kredi",
    spend: "Harcama",
    joined: "Katıldı",
    lastSeen: "Son görülme",
    searches: "Arama",
    signIn: "Giriş yolu",
  },

  overview: {
    title: "Genel bakış",
    lead:
      "Arama yapmak için hesap gerekiyor · yeni hesaplar {signup} kredi ile " +
      "başlıyor.",
    users: "Kullanıcılar",
    total: "Toplam",
    newThisWeek: "Bu hafta yeni",
    creditsHeading: "Krediler",
    granted: "Verilen",
    spent: "Harcanan",
    outstanding: "Açık",
    outstandingNote: "insanların elinde duran",
    today: "Bugün",
    allowed: "İzin verilen",
    anonymous: "Anonim",
    anonymousNote: "çıkış yapmış ziyaretçiler",
    refused: "Reddedilen",
    refusedNote: "limit, kredi ya da askıya alma",
    spendHeading: "Harcama",
    liveQueue: "Canlı kuyruk",
    liveQueueNote: "biri bekliyordu",
    standardQueue: "Standart kuyruk",
    standardQueueNote: "toplu puanlama, ~3,3 kat ucuz",
    attributed: "İzlenebilen",
    attributedNote: "bir kişiye bağlanan; hesap sisteminden öncesini kapsamaz",
    footer:
      "Her rakam DataForSEO'nun bildirdiği rakamdır, tahmin değildir. Makul " +
      "tahminlerle dolu bir panel, panelsizlikten kötüdür — kanıt gibi görünür.",
  },

  users: {
    title: "Kullanıcılar",
    lead:
      "Bakiye ve harcama listeyle birlikte tek sorguda gelir — satır başına " +
      "bir sorgu asla.",
    searchPlaceholder: "E-posta ile ara",
  },

  userDetail: {
    joinedAt: "katıldı",
    lastSeenAt: "son görülme",
    creditsCard: "Kredi",
    creditsNote: "defterin toplamı, saklanan bir bakiye değil",
    searchesNote: "en son 50 kayıt",
    spendNote: "o 50 kayıt üzerinden",
    lifetimeLink: "toplam harcama",
    spendReported: "DataForSEO'nun bildirdiği",
    adminNotice:
      "Bu adres ADMIN_EMAILS içinde. Kredi ve askıya alma adminlere işlemez — " +
      "faturalanmadan harcarlar ve harcamaları yine de kaydedilir. Rolü " +
      "kaldırmak için Railway'deki değişkeni düzenleyip yeniden dağıtın.",
    creditsHeading: "Krediler",
    deltaPlaceholder: "+25 ya da -10",
    notePlaceholder: "Gerekçe (isteğe bağlı)",
    noLedger: "Kredi geçmişi yok.",
    delta: "Değişim",
    reason: "Gerekçe",
    ref: "Referans",
    note: "Not",
    account: "Hesap",
    suspend: "Askıya al",
    reactivate: "Yeniden etkinleştir",
    statusNote:
      "Bir sonraki istekte geçerli olur — durum her seferinde yeniden okunur, " +
      "yani çıkış yaptırmaya gerek yok. Askıdaki kullanıcı giriş yapmış kalır, " +
      "sadece harcayamaz.",
    revoke: "Her yerden çıkış yaptır",
    revokeNote:
      "Token dönemini artırır (şu an {epoch}), böylece verilmiş her token " +
      "geçersizleşir. Var olan tek iptal yolu — oturum tablosu yok.",
    activity: "Etkinlik",
    action: "Eylem",
    outcome: "Sonuç",
    cost: "Maliyet",
    tree: "Ağaç",
    noActivity: "Etkinlik yok.",
    searchesHeading: "Aramalar",
    seed: "Tohum",
    market: "Pazar",
    noSearches: "Bu hesaba ait arama yok.",
  },

  erase: {
    heading: "Sil",
    already:
      "Bu hesap zaten silinmiş. Burada yapılacak başka bir şey yok — ancak " +
      "kişi posta kutusunu yeniden kanıtladığında, yani aynı adresle kaydolup " +
      "ya da giriş yaptığında geri gelir.",
    button: "Bu hesabı sil",
    buttonNote:
      "Profili boşaltır, her canlı kimlik bilgisini siler ve her aramanın " +
      "bağını koparır. Adresi ve ödeme tutarlarını saklar — Gizlilik " +
      "Politikası'nın 7. maddesi bunu söylüyor.",
    warnTitle: "Bu işlem buradan geri alınamaz.",
    warnBody:
      "{email} siliniyor: ad, fotoğraf, parola ve Google bağlantısı " +
      "boşaltılır, her oturum sonlandırılır, her sıfırlama bağlantısı silinir " +
      "ve her arama kişiden koparılır.",
    warnKeeps:
      "Adres ve ödeme tutarları bilinçli olarak saklanır. Bu kişi aynı adresle " +
      "tekrar kaydolursa hesap canlanır ve ödemesini yaptığı kredi bakiyesi " +
      "geri gelir.",
    warnPayments:
      "Ödemeler yalnızca e-posta adresiyle eşleştirilir — başka bir bağ yok — " +
      "yani farklı bir adresle tamamlanmış bir ödeme redakte edilmez. " +
      "Aşağıdaki sayı bunu söyleyecek.",
    reasonPlaceholder: "Denetim kaydı için gerekçe (isteğe bağlı)",
    reasonWarning:
      "Buraya kişi hakkında bir şey yazmayın. Denetim kaydını hiçbir şey " +
      "redakte etmiyor, yani bu kutuya yazılan bir ad silme işleminden sonra " +
      "da yaşamaya devam eder.",
    confirm: "Evet, {email} adresini sil",
    done:
      "Silindi. {crawls} aramanın bağı koparıldı, {events} kullanım satırı " +
      "sahipsizleştirildi, {payments} ödeme içeriği redakte edildi, {creds} " +
      "canlı kimlik bilgisi silindi.",
    alreadyDone: "Zaten silinmiş — hiçbir şey yazılmadı.",
    failed: "API reddetti. api servisinin günlüğüne bakın.",
  },

  reports: {
    title: "Raporlar",
    lead:
      "{since} tarihinden bu yana harcama ve kullanım. Maliyetler, arama " +
      "sağlayıcısına ödediğimiz tutarlardır ve tahmin değil, sağlayıcının " +
      "kendi yanıtından okunur. Gelir yalnızca canlı ödemeleri sayar — gelir " +
      "rakamına karışan bir test ödemesi, o rakamı yalana çevirir.",
    totalCost: "Toplam maliyet",
    totalCostNote: "{count} ücretli istek",
    revenue: "Gelir",
    revenueNote: "{live} canlı",
    revenueTest: ", {count} test (hariç)",
    margin: "Marj",
    marginNote: "gelir eksi aramaların maliyeti",
    cached: "Önbellekten karşılanan",
    cachedNote: "hiçbir şeye mal olmayan {count} istek",
    outstanding: "Açık kredi",
    outstandingNote: "{granted} verildi · {spent} harcandı",
    adminSpend: "Bunun admin harcaması",
    adminSpendNote: "gerçek para, kimseye faturalanmadı",
    reconcile:
      "Sağlayıcının kendi fişleri toplamı {provider}; bu, yukarıda bir kişiye " +
      "bağlanan {attributed} tutarından {gap} fazla. Aradaki fark, hesap " +
      "sistemi var olmadan önce yapılan işler ve yazımı başarısız olan " +
      "fişlerdir — bağlama bilinçli olarak en iyi çabadır, çünkü fişi " +
      "kaybetmek kötü, ama üstüne müşterinin sonucunu da kaybetmek daha " +
      "kötüdür. Büyük rakamı fatura, aşağıdaki tabloları da onun izlenebilir " +
      "kısmının nereye gittiği olarak okuyun.",
    byMonth: "Aya göre",
    byMonthLead:
      "Dört maliyet sütunu, aynı paranın kimin harcadığına göre bölünmüş " +
      "hâlidir; yani toplamları Maliyet'i verir.",
    month: "Ay",
    billable: "Ücretli",
    attempts: "Deneme",
    refused: "Reddedilen",
    cost: "Maliyet",
    customers: "Müşteriler",
    admin: "Admin",
    anonymous: "Anonim",
    erased: "Silinmiş",
    revenueCol: "Gelir",
    accounts: "Hesap",
    allMonths: "{count} ayın tamamı",
    noUsage: "Henüz kullanım kaydı yok.",
    byAccount: "Hesaba göre",
    byAccountLead:
      "Bize maliyetine göre sıralı her hesap. Sayılar o hesabın tüm geçmişini " +
      "kapsar — burada hiçbir şey son bir döneme kırpılmaz, yalnızca listenin " +
      "uzunluğu sınırlıdır.",
    account: "Hesap",
    creditsLeft: "Kalan kredi",
    paid: "Ödediği",
    lastActivity: "Son etkinlik",
    noAccounts: "Henüz hesap yok.",
    caveats:
      "Bu ekranın söyleyemediği iki şey — kimse burada olmayanı okumasın " +
      "diye. Ödemeler hesaba yalnızca e-posta adresiyle eşleştirilir " +
      "(payment_event'te hesap kimliği yok), yani farklı bir adresle " +
      "tamamlanmış bir ödeme ödenmemiş görünür. Ve admin, bir satır değil " +
      "ADMIN_EMAILS içindeki bir kayıttır; admin kırılımı olayın üzerinde " +
      "saklanmaz, sorgu anında o listeden hesaplanır.",
  },

  settings: {
    title: "Ayarlar",
    lead:
      "Dağıtımla değil, buradan değişir. Her değişiklik üzerine yazmak yerine " +
      "yeni bir satır ekler, böylece biri faturaya itiraz ettiğinde “geçen " +
      "salı limit neydi” sorusu cevaplanabilir kalır.",
    signupLabel: "Yeni hesaba verilen kredi",
    explainHeading: "Bu aslında ne yapıyor",
    explainSignedOut:
      "Herhangi bir aramadan önce giriş yapmak zorunludur. Eskiden çıkış " +
      "yapmış ziyaretçiler için günde bir ücretsiz arama vardı; bir tarayıcı " +
      "kimliğine ve özetlenmiş bir IP'ye karşı sayılıyordu. 23 Eylül 2026'da " +
      "kaldırıldı, çünkü ikisi de sıfırlanabilir — site verisini temizlemek " +
      "birini, yeni bir ağ diğerini aşar — yani bir limitten çok bir hız " +
      "kesiciydi ve ürünün adını bilmediği birine gerçek para harcadığı tek " +
      "yerdi.",
    explainSignup:
      "hesabı oluşturan aynı ifadeyle bir kez verilir. Mevcut hesaplar " +
      "etkilenmez. Bir arama bir krediye mal olur; önbellekten gelen sonuç " +
      "hiçbir şeye mal olmaz, yani aynı aramayı tekrarlamak ücretsizdir.",
    noCheckout:
      "Henüz ödeme sayfası yok — krediler kullanıcının sayfasından elle ekleniyor.",
    landingHeading: "Pazarlama sayfası",
    landingLead:
      "Pazarlama sayfasındaki fiyatlandırma bölümü ayrı bir ayardan okunur — " +
      "ad, fiyat ve özellikleriyle plan kartları.",
    editPricing: "Fiyat planlarını düzenle →",
  },

  audit: {
    title: "Denetim",
    lead:
      "Her ayrıcalıklı eylem, yalnızca eklenerek. Ele geçirilmiş bir admin " +
      "Google hesabı, ele geçirilmiş bir panel demektir — burada ikinci bir " +
      "faktör yok. Bu kayıt, o hasarı imkânsız değil görünür kılan şeydir; " +
      "gerçekten elde edilebilir tek güvence de budur.",
  },

  ci: {
    title: "CI",
    lead:
      "Testler bu sunucuda değil, GitHub Actions üzerinde tek kullanımlık bir " +
      "Postgres'e karşı çalışır ve {branch} dalına her push'ta koşar. Bu sayfa " +
      "onların sonuçlarını okur{trigger}. Railway, her servis için “Wait " +
      "for CI” açılmadıkça o dalı testler geçsin geçmesin dağıtır.",
    canTrigger: " ve GitHub'dan yeniden çalıştırmasını isteyebilir",
  },

  stripe: {
    title: "Ödemeler",
    lead:
      "Boruyu kanıtlayan en küçük dilim: gizli anahtar hesabı okuyabiliyor, " +
      "Checkout bir oturum açıyor ve imzalı webhook parayla geri dönüyor. " +
      "Planlar ve kredi tanımlama henüz bunların hiçbirine bağlı değil — " +
      "başarılı bir ödeme kaydediliyor ve başka hiçbir şey olmuyor.",
  },

  signin: {
    title: "AnswerGap admin",
    failed: "Giriş tamamlanmadı. Tekrar deneyin.",
    expired: "Bu oturum sona erdi. Yeniden giriş yapın.",
    lead:
      "Bu paneli yalnızca api servisindeki ADMIN_EMAILS listesinde yer alan " +
      "adresler açabilir. O liste veritabanında değil Railway'de durur — " +
      "üründeki hiçbir şey bu yetkiyi veremez.",
    button: "Google ile giriş yap",
  },

  noAccess: {
    title: "Admin değil",
    signedInAs: "{email} ile giriş yapıldı; bu adres ADMIN_EMAILS içinde değil.",
    unknown: "Bu hesap ADMIN_EMAILS içinde değil.",
  },

  editor: {
    planName: "Plan adı",
    oneLine: "Tek satırlık açıklama",
    cta: "Buton metni",
    addBadge: "+ Rozet ekle (isteğe bağlı)",
    cardColour: "Kart rengi",
    feature: "Özellik açıklaması",
    removeFeature: "Özelliği kaldır",
    reset: "Sıfırla",
    resetTitle: "Bu kartı şablonuna döndür",
    draft: "Taslak",
    published: "Yayında",
    nothingPublished: "Yayında bir şey yok",
    saveAll: "Tüm kartları kaydet",
    saving: "Kaydediliyor…",
    saved: "Kaydedildi. Sayfa bunu bir sonraki yüklemede alır.",
    saveFailed: "Kaydedilemedi.",
    perMonth: "/ay",
  },

  board: {
    run: "Koşu",
    result: "Sonuç",
    commit: "Commit",
    took: "Süre",
    jobs: "İşler",
    noJobs: "Henüz iş bildirilmedi.",
    earlier: "Önceki koşular",
    openOnGitHub: "GitHub'da aç",
    refresh: "Yenile",
    runNow: "Şimdi çalıştır",
    runNowOn: "{branch} dalında şimdi çalıştır",
    trigger: "Tetikleyen",
    rerun: "Tekrar çalıştır",
    rerunAll: "Tüm işleri tekrar çalıştır",
    rerunFailed: "Başarısızları tekrar çalıştır",
    cancel: "İptal et",
    passed: "Geçti",
    failed: "Başarısız",
    running: "Çalışıyor",
    queued: "Kuyrukta",
    cancelled: "İptal edildi",
    skipped: "Atlandı",
    timedOut: "Zaman aşımı",
    unknown: "Bilinmiyor",
    needsToken: "Tetikleme için api servisinde CI_GITHUB_TOKEN gerekir — aşağıya bakın.",
    errNoAnswer: "GitHub yanıt vermedi. Son geçerli veri gösteriliyor.",
    errServer: "GitHub hata döndürdü. Son geçerli veri gösteriliyor.",
    errToken:
      "GitHub token'ı reddetti. Süresi dolmuş olabilir ya da bu depoda " +
      "“Actions: read and write” yetkisi olmayabilir.",
    errRate:
      "GitHub'ın hız limiti şimdilik tükendi. Son geçerli veri " +
      "gösteriliyor; bir saat içinde toparlanır.",
    errNotFound:
      "GitHub bu iş akışını henüz tanımıyor — .github/workflows/ci.yml " +
      "push edildikten sonra görünür.",
    errRefused: "GitHub reddetti ({code}).",
    errInvalid: "GitHub isteği geçersiz bularak reddetti.",
    errState: "GitHub reddetti: o koşu buna izin veren bir durumda değil.",
  },

  panel: {
    keyMode: "Anahtar modu",
    keyWorks: "Anahtar çalışıyor",
    chargesEnabled: "Tahsilat açık",
    webhookSecret: "Webhook gizli anahtarı",
    whatToSet: "Neyin ayarlanması gerekiyor",
    openDashboard: "Stripe panelini aç",
    refresh: "Yenile",
    startTest: "Test ödemesi başlat",
    startLive: "CANLI ödeme başlat",
    realCard: "Bu, gerçek bir kartı çeker.",
    cancel: "Vazgeç",
    received: "Alınan ödemeler",
    when: "Ne zaman",
    event: "Olay",
    amount: "Tutar",
    mode: "Mod",
    status: "Durum",
    email: "E-posta",
    object: "Nesne",
    writtenBy: "İmzalı webhook tarafından yazıldı:",
    noBaseUrl: "PUBLIC_BASE_URL ayarlı değil",
    onRailway: "Railway api servisinde:",
    and: "ve",
    errNoAnswer: "Stripe yanıt vermedi.",
    errServer: "Stripe sunucu hatası döndürdü.",
    errOther: "Stripe hata döndürdü.",
    errRate: "Stripe şu an bizi hız sınırına takıyor.",
    errKey: "Stripe anahtarı reddetti. İptal edilmiş ya da başka bir hesaba ait olabilir.",
    errNoKey: "api servisinde STRIPE_SECRET_KEY ayarlı değil.",
    errNeedsConfirm: "Canlı bir tahsilat başlatılmadan önce onaylanmalıdır.",
    errNoReturnUrl:
      "api servisinde WEB_BASE_URL ayarlı değil, yani Checkout'un dönecek " +
      "bir yeri yok.",
    errInvalid:
      "Stripe isteği geçersiz bularak reddetti — kendi mesajı için api " +
      "günlüğüne bakın.",
    errRefused: "Stripe reddetti ({code}).",
  },

  noAccessDetail: {
    listIsTheOnlyWay:
      "ADMIN_EMAILS, Railway'deki api servisinde virgülle ayrılmış bir " +
      "listedir. Adresle birebir eşleştirilir; büyük-küçük harf ve baştaki " +
      "sondaki boşluklar dikkate alınmaz. Veritabanında rol sütunu ve onu " +
      "yazan bir endpoint yok, yani erişim vermenin tek yolu bu liste — " +
      "adresi oraya ekleyip api servisini yeniden dağıtın.",
    twoChecks:
      "Önce bakılacak iki şey: değişkenin adı ADMIN_EMAILS, çoğul; ve bir " +
      "değişiklik ancak api servisi yeniden başladıktan sonra geçerli olur.",
  },

  apiError: {
    title: "api {status} döndürdü",
    hint503:
      "api servisi hesapların kapalı olduğunu söylüyor. Bu, orada " +
      "SESSION_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, " +
      "PUBLIC_BASE_URL ya da DATABASE_URL değişkenlerinden birinin eksik " +
      "olduğu anlamına gelir.",
    hint500:
      "api servisi bunu işlerken hata verdi. Yığın izi onun kendi " +
      "günlüğünde — admin servisi yalnızca durum kodunu görüyor.",
    hintOther: "İlgili istek için api servisinin günlüğüne bakın.",
    bodyInLog: "Yanıtın tamamı bu servisin günlüğünde, şu önekle:",
  },

  pricing: {
    back: "← Ayarlar",
    title: "Fiyat planları",
    lead:
      "Pazarlama sayfasının fiyatlandırma bölümünde gösterdiği şey. 0 ile 4 " +
      "plan arası; boş bırakılırsa sayfa desteklenen her dilde kendi gömülü " +
      "varsayılanını gösterir. Buradan bir şey kaydedildiği anda sayfa her " +
      "dilde BU metni gösterir — çok dilli varsayılan bilinçli olarak devre " +
      "dışı kalır (bkz. CLAUDE.md).",
    appendNote:
      "Kaydedilen değişiklikler app_setting tablosuna yeni bir satır ekler: " +
      "önceki değer kayıtta kalır ve denetim günlüğünde görünür. Burada " +
      "hiçbir şey yerinde değiştirilmez.",
  },

  guide: {
    englishOnly:
      "Bu sayfa operatör el kitabıdır ve yalnızca İngilizce tutulur. Kodu " +
      "yakından anlattığı için bir çeviri onunla adım adım uyumsuzlaşır ve bu " +
      "uyumsuzluk görünmez olurdu.",
  },
};

const CATALOGUE: Record<Locale, Messages> = { tr, en };

/**
 * `t("reports.title")`, with `{name}` interpolation.
 *
 * Pure and synchronous so a client component can build one from a `locale`
 * prop. A missing key renders as the key itself rather than as a blank - a
 * visible `reports.whatever` in a screenshot is a bug report; an empty cell is
 * not - though the type above means one cannot reach production.
 */
export function makeT(locale: Locale) {
  const messages = CATALOGUE[locale] ?? CATALOGUE[DEFAULT_LOCALE];
  return (key: string, values?: Record<string, string | number>): string => {
    let out: unknown = messages;
    for (const part of key.split(".")) {
      if (out && typeof out === "object" && part in out) {
        out = (out as Record<string, unknown>)[part];
      } else {
        return key;
      }
    }
    if (typeof out !== "string") return key;
    if (!values) return out;
    return out.replace(/\{(\w+)\}/g, (whole, name: string) =>
      name in values ? String(values[name]) : whole
    );
  };
}
