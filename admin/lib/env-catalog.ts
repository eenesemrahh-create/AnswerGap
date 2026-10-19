/**
 * Every environment variable this product reads, what it is for, and what
 * happens without it. Rendered by the admin's Variables page (/env).
 *
 * ONE SOURCE, GUARDED BY A TEST. `tests/test_env_catalog.py` reads every
 * `os.environ` name in `api/` and `answergap/`, and every `process.env` name
 * in our own web and admin code, and fails when one is missing here. So a new
 * variable cannot ship without its line on this page.
 *
 * Values are never shown anywhere. The page asks the api only whether each of
 * its own variables is SET (`GET /api/admin/env`).
 */

export type Service = "api" | "web" | "admin";
export type Need = "required" | "recommended" | "optional" | "temporary" | "local";

export interface EnvVar {
  name: string;
  service: Service;
  need: Need;
  /** A secret: never paste it into a chat, a ticket or a screenshot. */
  secret: boolean;
  /** Group heading on the page. */
  group: "core" | "search" | "signin" | "mail" | "payments" | "signedOut" | "ops" | "web" | "admin";
  what: { en: string; tr: string };
  missing: { en: string; tr: string };
  /** A safe example or the default, never a real secret. */
  example?: string;
}

export const ENV_CATALOG: EnvVar[] = [
  // --------------------------------------------------------------- core (api)
  {
    name: "DATABASE_URL", service: "api", need: "required", secret: true, group: "core",
    what: {
      en: "The Postgres connection string. Railway fills it in when the database is linked to the service.",
      tr: "Postgres veritabanının bağlantı adresi. Veritabanı servise bağlanınca Railway kendisi doldurur.",
    },
    missing: {
      en: "No database: accounts, credits, payments and the admin panel are all off; searches fall back to files on disk.",
      tr: "Veritabanı yok: hesaplar, krediler, ödemeler ve admin paneli kapanır; aramalar diskteki dosyalara düşer.",
    },
  },
  {
    name: "DATABASE_PUBLIC_URL", service: "api", need: "local", secret: true, group: "core",
    what: {
      en: "The database's public proxy address. Only used when DATABASE_URL is absent - running the api on a laptop against the Railway database.",
      tr: "Veritabanının dışarıya açık proxy adresi. Yalnızca DATABASE_URL yoksa kullanılır; api'yi bilgisayarda Railway veritabanına bağlayarak çalıştırmak için.",
    },
    missing: { en: "Nothing on Railway.", tr: "Railway'de hiçbir şey olmaz." },
  },
  {
    name: "SESSION_SECRET", service: "api", need: "required", secret: true, group: "core",
    what: {
      en: "Signs every sign-in session. Also the default salt for hashing visitors' IP addresses.",
      tr: "Her oturumu imzalar. Ziyaretçi IP'lerini şifrelemenin varsayılan tuzu da budur.",
    },
    missing: {
      en: "Accounts are switched off entirely. Changing it signs EVERYBODY out and resets every IP code.",
      tr: "Hesap sistemi tamamen kapanır. Değiştirilirse HERKESİN oturumu kapanır ve tüm IP kodları değişir.",
    },
    example: "a long random string (64+ characters)",
  },
  {
    name: "PUBLIC_BASE_URL", service: "api", need: "required", secret: false, group: "core",
    what: {
      en: "The api's own public address. Builds the Google sign-in return address, the links in verification mail and the DataForSEO callback.",
      tr: "API'nin kendi dışarıdan görünen adresi. Google giriş dönüş adresi, doğrulama e-postasındaki bağlantılar ve DataForSEO geri çağrısı bundan kurulur.",
    },
    missing: { en: "Accounts are switched off.", tr: "Hesap sistemi kapanır." },
    example: "https://answergap-production.up.railway.app",
  },
  {
    name: "WEB_BASE_URL", service: "api", need: "required", secret: false, group: "core",
    what: {
      en: "The customer web app's address. Where Stripe sends people back after paying, and where password-reset links point.",
      tr: "Müşteri web uygulamasının adresi. Stripe ödemeden sonra buraya geri gönderir; şifre sıfırlama bağlantıları buraya gider.",
    },
    missing: {
      en: "The first AUTH_RETURN_ORIGINS address is used instead; if that is missing too, Stripe refuses to open a checkout and reset links break.",
      tr: "Yerine AUTH_RETURN_ORIGINS listesinin ilk adresi kullanılır; o da yoksa Stripe ödeme sayfasını açmaz ve sıfırlama bağlantıları bozulur.",
    },
    example: "https://web-production-9aba3.up.railway.app",
  },
  {
    name: "ALLOWED_ORIGINS", service: "api", need: "required", secret: false, group: "core",
    what: {
      en: "Which websites may call the api from a browser (CORS). Comma-separated: the web app's address, and the custom domain once it is used.",
      tr: "Hangi sitelerin tarayıcıdan API'yi çağırabileceği (CORS). Virgülle ayrılır: web uygulamasının adresi ve kullanılmaya başlanınca kendi alan adın.",
    },
    missing: {
      en: "Only localhost is allowed: the live site cannot talk to the api at all.",
      tr: "Yalnızca localhost'a izin verilir: canlı site API ile hiç konuşamaz.",
    },
    example: "https://web-production-9aba3.up.railway.app,https://gettopquestions.com",
  },
  {
    name: "AUTH_RETURN_ORIGINS", service: "api", need: "recommended", secret: false, group: "core",
    what: {
      en: "Where a sign-in may send the browser back to. The first one is also taken as the web app when WEB_BASE_URL is missing.",
      tr: "Girişten sonra tarayıcının geri gönderilebileceği adresler. WEB_BASE_URL yoksa ilki web uygulaması kabul edilir.",
    },
    missing: {
      en: "Only localhost: Google and mail-link sign-ins cannot return to the live site.",
      tr: "Yalnızca localhost: Google ve e-posta bağlantısıyla giriş canlı siteye dönemez.",
    },
  },
  {
    name: "ADMIN_EMAILS", service: "api", need: "required", secret: false, group: "core",
    what: {
      en: "The addresses that are admins, comma-separated. The ONLY way to be an admin; the address must also be verified.",
      tr: "Admin olan e-posta adresleri, virgülle. Admin olmanın TEK yolu; adresin doğrulanmış olması da gerekir.",
    },
    missing: { en: "Nobody is an admin: this panel cannot sign anyone in.", tr: "Kimse admin olmaz: bu panele kimse giremez." },
  },

  // ------------------------------------------------------------------ search
  {
    name: "DATAFORSEO_LOGIN", service: "api", need: "required", secret: true, group: "search",
    what: { en: "The DataForSEO account login - the search data provider.", tr: "DataForSEO hesap kullanıcı adı (arama verisi sağlayıcısı)." },
    missing: { en: "No searches at all.", tr: "Hiç arama yapılamaz." },
  },
  {
    name: "DATAFORSEO_PASSWORD", service: "api", need: "required", secret: true, group: "search",
    what: { en: "The DataForSEO API password (not the website password).", tr: "DataForSEO API şifresi (web sitesi şifresi değil)." },
    missing: { en: "No searches at all.", tr: "Hiç arama yapılamaz." },
  },
  {
    name: "CALLBACK_TOKEN", service: "api", need: "recommended", secret: true, group: "search",
    what: {
      en: "A secret DataForSEO must send back when a queued (Standard) task finishes, so nobody else can post fake results.",
      tr: "Sıradaki (Standard) bir görev bittiğinde DataForSEO'nun geri göndermesi gereken gizli değer; başkası sahte sonuç gönderemesin diye.",
    },
    missing: {
      en: "Every callback is refused; queued analysis rounds are collected by polling instead - slower, still correct.",
      tr: "Tüm geri çağrılar reddedilir; analiz turlarının sonuçları yoklama ile alınır - daha yavaş ama doğru.",
    },
  },
  {
    name: "VOYAGE_API_KEY", service: "api", need: "optional", secret: true, group: "search",
    what: {
      en: "Voyage AI key for semantic matching (embeddings), measured to read paraphrases far better than word matching.",
      tr: "Anlamsal eşleştirme (embedding) için Voyage AI anahtarı; eş anlamlı ifadeleri kelime eşleştirmesinden çok daha iyi okuduğu ölçüldü.",
    },
    missing: { en: "Gap scoring uses word matching only.", tr: "Boşluk puanlaması yalnızca kelime eşleştirmesiyle yapılır." },
  },
  {
    name: "VOYAGE_MODEL", service: "api", need: "optional", secret: false, group: "search",
    what: { en: "Which Voyage model to use.", tr: "Hangi Voyage modelinin kullanılacağı." },
    missing: { en: "voyage-4-lite is used.", tr: "voyage-4-lite kullanılır." },
    example: "voyage-4-lite",
  },

  // ------------------------------------------------------------------ sign-in
  {
    name: "GOOGLE_CLIENT_ID", service: "api", need: "optional", secret: false, group: "signin",
    what: { en: "The Google OAuth client id for “Sign in with Google”.", tr: "“Google ile giriş” için Google OAuth istemci kimliği." },
    missing: { en: "The Google button is hidden; email sign-in still works.", tr: "Google düğmesi gizlenir; e-postayla giriş çalışmaya devam eder." },
  },
  {
    name: "GOOGLE_CLIENT_SECRET", service: "api", need: "optional", secret: true, group: "signin",
    what: { en: "The Google OAuth client secret.", tr: "Google OAuth istemci gizli anahtarı." },
    missing: { en: "The Google button is hidden.", tr: "Google düğmesi gizlenir." },
  },

  // --------------------------------------------------------------------- mail
  {
    name: "RESEND_API_KEY", service: "api", need: "required", secret: true, group: "mail",
    what: {
      en: "Resend key for sending mail: verification, password reset, receipts, admin alerts.",
      tr: "E-posta göndermek için Resend anahtarı: doğrulama, şifre sıfırlama, adminlere uyarılar.",
    },
    missing: {
      en: "Mail is only printed to the server log: nobody can verify an address.",
      tr: "E-postalar yalnızca sunucu günlüğüne yazılır: kimse adresini doğrulayamaz.",
    },
  },
  {
    name: "MAIL_FROM", service: "api", need: "required", secret: false, group: "mail",
    what: {
      en: "The sender. Must be on the domain verified in Resend (send.gettopquestions.com).",
      tr: "Gönderen adres. Resend'de doğrulanmış alan adında olmalı (send.gettopquestions.com).",
    },
    missing: { en: "Mail is refused by Resend.", tr: "Resend e-postayı reddeder." },
    example: "AnswerGap <noreply@send.gettopquestions.com>",
  },
  {
    name: "MAIL_REPLY_TO", service: "api", need: "recommended", secret: false, group: "mail",
    what: { en: "Where replies to our mail go - a mailbox somebody reads.", tr: "Gönderdiğimiz e-postalara verilen yanıtların gideceği, birinin okuduğu kutu." },
    missing: { en: "Replies go to the no-reply sender and are lost.", tr: "Yanıtlar gönderen adrese gider ve kaybolur." },
    example: "support@gettopquestions.com",
  },

  // ----------------------------------------------------------------- payments
  {
    name: "STRIPE_SECRET_KEY", service: "api", need: "required", secret: true, group: "payments",
    what: {
      en: "Stripe's secret key. sk_test_… for test mode, sk_live_… for real money; the prefix decides which mode the panel shows.",
      tr: "Stripe gizli anahtarı. Test için sk_test_…, gerçek para için sk_live_…; panelde hangi modun gösterileceğine önek karar verir.",
    },
    missing: { en: "No checkout, no billing portal, no cancellations.", tr: "Ödeme sayfası, ödeme portalı ve iptal çalışmaz." },
  },
  {
    name: "STRIPE_WEBHOOK_SECRET", service: "api", need: "required", secret: true, group: "payments",
    what: {
      en: "Proves a webhook really came from Stripe (whsec_…). Payments, renewals and cancellations all arrive this way.",
      tr: "Webhook'un gerçekten Stripe'tan geldiğini kanıtlar (whsec_…). Ödemeler, yenilemeler ve iptaller bu yolla gelir.",
    },
    missing: {
      en: "Every webhook is refused: people pay and get no credits.",
      tr: "Tüm webhook'lar reddedilir: kişi öder ama kredi alamaz.",
    },
  },
  {
    name: "PAY_PROBE_TOKEN", service: "api", need: "temporary", secret: true, group: "payments",
    what: {
      en: "Unlocks the temporary /pay test page. To be deleted with that page once real plans sell.",
      tr: "Geçici /pay test sayfasını açar. Gerçek planlar satılmaya başlayınca o sayfayla birlikte silinecek.",
    },
    missing: { en: "/pay answers 404 - the intended end state.", tr: "/pay 404 döner; olması gereken son durum budur." },
  },

  // --------------------------------------------------- signed-out searching
  {
    name: "TURNSTILE_SITE_KEY", service: "api", need: "optional", secret: false, group: "signedOut",
    what: {
      en: "Cloudflare Turnstile's PUBLIC key, handed to the browser for the bot check on signed-out searches.",
      tr: "Cloudflare Turnstile'ın HERKESE AÇIK anahtarı; üyeliksiz aramalardaki bot kontrolü için tarayıcıya verilir.",
    },
    missing: { en: "Signed-out searching stays off.", tr: "Üyeliksiz arama kapalı kalır." },
  },
  {
    name: "TURNSTILE_SECRET_KEY", service: "api", need: "optional", secret: true, group: "signedOut",
    what: { en: "Cloudflare Turnstile's secret, used by the api to verify each check.", tr: "Cloudflare Turnstile gizli anahtarı; API her kontrolü bununla doğrular." },
    missing: { en: "Signed-out searching stays off.", tr: "Üyeliksiz arama kapalı kalır." },
  },
  {
    name: "TRUSTED_PROXY_HOPS", service: "api", need: "required", secret: false, group: "signedOut",
    what: {
      en: "How many proxies stand between a visitor and the api. 2 on Railway (measured 2026-10-19). Check it on Settings → “Is the visitor's address read correctly?” after any infrastructure change.",
      tr: "Ziyaretçi ile API arasında kaç proxy olduğu. Railway'de 2 (2026-10-19'da ölçüldü). Altyapı değişirse Ayarlar → “Ziyaretçinin adresi doğru okunuyor mu?” kartından kontrol et.",
    },
    missing: {
      en: "Defaults to 1, which on Railway reads a proxy's address: every visitor shares one counter.",
      tr: "Varsayılan 1'dir; Railway'de bu bir proxy'nin adresini okur ve tüm ziyaretçiler tek sayaca düşer.",
    },
    example: "2",
  },
  {
    name: "ANON_IP_SALT", service: "api", need: "optional", secret: true, group: "signedOut",
    what: {
      en: "The salt for hashing visitors' IP addresses. Changing it makes every stored IP code meaningless - which is the way to wipe them.",
      tr: "Ziyaretçi IP'lerini şifrelemek için tuz. Değiştirilirse saklanan tüm IP kodları anlamsız olur; onları silmenin yolu budur.",
    },
    missing: { en: "Derived from SESSION_SECRET.", tr: "SESSION_SECRET'tan türetilir." },
  },

  // ---------------------------------------------------------------------- ops
  {
    name: "CI_GITHUB_TOKEN", service: "api", need: "optional", secret: true, group: "ops",
    what: {
      en: "A fine-grained GitHub token for this repository, so the CI page can start a test run.",
      tr: "Bu depo için sınırlı bir GitHub anahtarı; CI sayfasının test çalıştırabilmesi için.",
    },
    missing: { en: "The CI page only reads results; it cannot start a run.", tr: "CI sayfası yalnızca sonuçları okur, çalıştırma başlatamaz." },
  },
  {
    name: "CI_GITHUB_REPO", service: "api", need: "optional", secret: false, group: "ops",
    what: { en: "The GitHub repository the CI page watches.", tr: "CI sayfasının izlediği GitHub deposu." },
    missing: { en: "eenesemrahh-create/AnswerGap.", tr: "eenesemrahh-create/AnswerGap kullanılır." },
  },
  {
    name: "CI_WORKFLOW", service: "api", need: "optional", secret: false, group: "ops",
    what: { en: "The workflow file the CI page runs.", tr: "CI sayfasının çalıştırdığı iş akışı dosyası." },
    missing: { en: "ci.yml.", tr: "ci.yml kullanılır." },
  },
  {
    name: "CI_BRANCH", service: "api", need: "optional", secret: false, group: "ops",
    what: { en: "The branch the CI page runs against.", tr: "CI sayfasının çalıştığı dal." },
    missing: { en: "main.", tr: "main kullanılır." },
  },
  {
    name: "ANSWERGAP_DATA_DIR", service: "api", need: "local", secret: false, group: "ops",
    what: {
      en: "Where file-based data lives when there is no database (local development, or a mounted volume).",
      tr: "Veritabanı olmadığında dosya tabanlı verinin tutulduğu klasör (yerel geliştirme ya da bağlı bir disk).",
    },
    missing: { en: "The repository's data/ folder.", tr: "Deponun data/ klasörü kullanılır." },
  },

  // ---------------------------------------------------------------------- web
  {
    name: "NEXT_PUBLIC_API_URL", service: "web", need: "required", secret: false, group: "web",
    what: {
      en: "The api's address, built INTO the web app at build time. Changing it needs a redeploy of the web service.",
      tr: "API'nin adresi; web uygulamasına derleme sırasında gömülür. Değiştirilirse web servisi yeniden deploy edilmeli.",
    },
    missing: { en: "The site calls localhost:8000 and nothing works.", tr: "Site localhost:8000'i çağırır ve hiçbir şey çalışmaz." },
    example: "https://answergap-production.up.railway.app",
  },
  {
    name: "NEXT_PUBLIC_SITE_URL", service: "web", need: "recommended", secret: false, group: "web",
    what: {
      en: "The site's canonical address for search engines: canonical links, sitemap and the legal pages' addresses.",
      tr: "Arama motorları için sitenin asıl adresi: canonical bağlantılar, site haritası ve hukuki sayfaların adresleri.",
    },
    missing: { en: "https://gettopquestions.com is assumed.", tr: "https://gettopquestions.com varsayılır." },
  },

  // -------------------------------------------------------------------- admin
  {
    name: "API_URL", service: "admin", need: "required", secret: false, group: "admin",
    what: {
      en: "The api's address, used by this panel's server. Not public: the browser never calls the api from here.",
      tr: "API'nin adresi; bu panelin sunucusu kullanır. Herkese açık değil: tarayıcı buradan API'yi hiç çağırmaz.",
    },
    missing: { en: "The panel cannot load anything.", tr: "Panel hiçbir şey yükleyemez." },
  },
  {
    name: "PUBLIC_ADMIN_URL", service: "admin", need: "required", secret: false, group: "admin",
    what: {
      en: "This panel's own public address, for the sign-in round trip.",
      tr: "Bu panelin kendi dışarıdan görünen adresi; giriş yönlendirmesi için.",
    },
    missing: { en: "Nobody can sign in to the panel.", tr: "Panele kimse giriş yapamaz." },
  },
];
