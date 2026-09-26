import type { Messages } from "./types";

export const tr: Messages = {
  brand: {
    name: "AnswerGap",
    tagline: "Rakiplerinin hiç cevaplamadığı soruları bul.",
    prototype: "prototip",
  },

  landing: {
    treeCount: "{count} kayıtlı",
    emptyTitle: "Henüz arama yok.",
    emptyBody:
      "Yukarıdan bir anahtar kelime arayın, burada görünsün. Aramalarınız " +
      "yalnızca sizin hesabınıza aittir.",
    headline: "Rakiplerinin hiç cevaplamadığı soruları bul.",
    intro:
      "AnswerGap, Google'ın “Bunlar da sorulmuş” verisini bir soru ağacına " +
      "açar, her sorunun arkasındaki arama sonuçlarına bakar ve hangi soruları " +
      "hiçbir sayfanın gerçekten hedeflemediğini gösterir.",
    searchPlaceholder: "Bir kelime girin — örn. diş beyazlatma",
    searchButton: "Analiz et",
    searchDisabledHint: "DataForSEO kimlik bilgisi bulunamadı - .env.example dosyasını .env olarak kopyalayıp doldurun.",
    searching: "Aranıyor…",
    searchingHint: "Google’a bir kez soruluyor, “Bunlar da sorulmuş” bloğu açılmış hâlde. Bu 30-60 saniye sürer.",
    liveNotice: "Bir arama <b>tek canlı istek</b> çalıştırır ve soru ağacını getirir. Boşluk skoru <b>soru başına</b> hesaplanır ve sorunun kendi ekranından başlatılır.",
    savedAnalyses: "Kayıtlı analizler",
    questionCount: "{count} soru",
    country: "Ülke",
    language: "Dil",
    languageHint:
      "Boşluk skoru yalnızca eşleştirme paketimiz olan dillerde hesaplanır.",
  },

  status: {
    gap: "Cevapsız",
    weak: "Az cevaplanmış",
    covered: "İyi cevaplanmış",
    no_data: "Bakılmadı",
    evidence: "{checked} sayfadan {matching} tanesi",
    gapExplained:
      "Hiçbir arama sonucu bu soruyu doğrudan hedeflemiyor. Cevap, başka bir " +
      "konu için yazılmış sayfaların içinden çıkarılmak zorunda.",
    weakExplained:
      "Bir ya da iki sayfa bu soruyu hedefliyor. Rekabet başlamış ama hâlâ " +
      "yer var.",
    coveredExplained:
      "Üç veya daha fazla sayfa bu soruyu hedefliyor. Bu soruda öne çıkmak zor.",
    no_dataExplained:
      "Bu soru için arama sonuçları çekilmedi, dolayısıyla kimsenin " +
      "cevaplayıp cevaplamadığı bilinmiyor. Bilinmiyor ile cevapsız " +
      "aynı şey değil.",
  },

  toolbar: {
    seedLabel: "Aramanız",
    seeds: "İlgili aramalar",
    tree: "Ağaç",
    table: "Tablo",
    searchPlaceholder: "Sorularda filtrele…",
    showing: "{total} sorudan {shown} tanesi",
    zoomIn: "Yakınlaş",
    zoomOut: "Uzaklaş",
    fit: "Ekrana sığdır",
  },

  table: {
    question: "Soru",
    status: "Durum",
    matchingPages: "Hedefleyen sayfa",
    matchingPagesHint: "Bu soruyu gerçekten hedefleyen arama sonuçları",
    checked: "Bakılan",
    checkedHint: "Bakılan arama sonuçları",
    branches: "Dal",
    branchesHint: "Bu soru kaç farklı ebeveynin altında çıktı",
    depth: "Derinlik",
    volume: "Hacim",
    volumeHint: "Google Ads bağlı değil",
    noVolume: "veri yok",
    empty: "Filtreye uyan soru yok.",
    aiSources: "AI Overview",
    aiSourcesHint: "Google AI Overview'un bu soru için kaynak gösterdiği siteler. Yalnızca kontrol edilmiş sorularda bilinir.",
    aiCount: "{count} site",
    aiNone: "yok",
    aiYou: "sen",
    aiYouHint: "{site} kaynak gösterilen siteler arasında",
    aiUnknown: "bilinmiyor",
    aiUnknownHint: "Google'ın AI cevabı sayfadan sonra yükleniyor ve kaynakları okunamadı. Kaynaksız değil, bilinmiyor.",
  },

  ai: {
    heading: "Bu ağaçta Google AI Overview",
    noneChecked: "Henüz hiçbir soru kontrol edilmedi. Bir soruyu kontrol etmek, Google AI Overview'un onu cevaplayıp cevaplamadığını ve hangi siteleri kaynak gösterdiğini de ek ücret olmadan gösterir.",
    coverage: "Google AI Overview, AI cevabı okunabilen {checked} sorunun {withAi} tanesinde kaynak gösteriyor.",
    citedIn: "{checked} sorunun {count} tanesinde kaynak",
    note: "Yalnızca AI cevabı okunabilen sorular sayılır. Geri kalanı bilinmiyor, kaynaksız değil.",
    unreadable: "{count} soruda okunamadı.",
    siteLabel: "Siten",
    sitePlaceholder: "ornek.com",
    siteInvalid: "ornek.com gibi bir alan adı gir.",
    siteCited: "{site}, kontrol edilen {checked} sorunun {count} tanesinde kaynak gösteriliyor.",
    siteHint: "Alt alan adları da sayılır: ornek.com, blog.ornek.com ile de eşleşir. Yalnızca bu tarayıcıda hatırlanır.",
    treeMarker: "AI {count}",
    treeHint: "Google AI Overview bu soru için {count} siteyi kaynak gösteriyor.",
    treeYouHint: "{site} de aralarında.",
  },

  seeds: {
    note:
      "Google bu ifadeleri sonuçların yanında gösterir. Bunlar soru değil sorgudur, bu yüzden ağaçta düğüm olmazlar — aranacak bir sonraki tohumlardır.",
    empty: "Bu ağaç için henüz ilgili arama kaydedilmedi.",
    noQuestionsTitle: "Google bu arama için soru göstermiyor",
    noQuestionsBody:
      "Bu sonuç sayfasında \"People Also Ask\" kutusu yok, bu yüzden kurulacak bir soru ağacı da yok. Marka adlarında ve tek kelimelik aramalarda bu normaldir; insanlar bir cevap değil bir site arar. En iyi sonucu soru niteliğindeki aramalar verir.",
    noQuestionsTry: "Bunun yerine Google şu ilgili aramaları öneriyor:",
  },

  detail: {
    close: "Kapat",
    depth: "Seviye {depth}",
    branches: "{count} dalda",
    matchingPages: "Hedefleyen sayfa",
    checked: "Bakılan sonuç",
    volume: "Arama hacmi",
    resultsHeading:
      "Arama sonuçları · bir sayfa {threshold} ve üzerinde cevap sayılıyor",
    noResults: "Bu soru için arama sonuçları <b>hiç çekilmedi</b>, dolayısıyla kimsenin cevaplayıp cevaplamadığı bilinmiyor - kesik çizgiyle çizilmesinin sebebi bu. Bu arşivlenmiş bir analiz; puanlamak için aynı kelimeyle canlı arama çalıştır.",
    notScoredYet: "Bu soru <b>henüz kontrol edilmedi</b>. Kontrol etmek bir arama isteğine mal oluyor, bu yüzden asla kendiliğinden olmuyor — ve o zamana kadar kimsenin cevaplayıp cevaplamadığı bilinmiyor.",
    scoreButton: "Bu soruyu kontrol et",
    scoring: "Kontrol ediliyor…",
    scoreCost: "Bir SERP isteği. Daha önce çekilmiş bir soru hiçbir şeye mal olmaz.",
    untitled: "(başlıksız)",
    aiHeading: "Google AI Overview kaynakları",
    aiNote:
      "Google bu soruya AI Overview ile cevap veriyor ve bu siteleri kaynak " +
      "gösteriyor. Sıfır tıklamayla cevaplanan bir soru olabilir.",
    aiYou: "{site} kaynak gösterilen siteler arasında.",
    aiNotYou: "{site} bu soru için kaynak gösterilmiyor.",
    aiUnreadable: "Google bu soruya AI Overview ile cevap veriyor ama cevap sayfadan sonra yükleniyor ve kaynakları okunamadı. Burada kimin kaynak gösterildiği bilinmiyor.",
    sourceHeading: "Kaynak",
    updated: "Son güncelleme: {date}",
    matching: "Eşleştirme: {strategy} · eşik {threshold}",
    unvalidated: "(doğrulanmadı)",
    harvestFound: "Bu istek ek maliyet olmadan {count} yeni soru daha ortaya çıkardı.",
    harvestDropped: "{count} soru tohumdan uzaklaştığı için dışarıda bırakıldı.",
    harvestedNode: "Başka bir sorunun sonuçları içinde bulundu",
    relevance: "Tohum yakınlığı {value}",
  },

  verdict: {
    heading: "Bu sayfalar soruyu cevaplıyor mu?",
    ask: "Eşik henüz oturmadı. Onu oturtacak olan senin cevabın — bedava, hiçbir arama yapılmıyor.",
    gap: "Hayır, hiçbiri",
    notGap: "Evet, en az biri",
    gapHint: "Buradaki hiçbir sayfa bu soruyu cevaplamak için yazılmamış.",
    notGapHint: "Buradaki en az bir sayfa bunu doğrudan cevaplıyor.",
    recorded: "Kaydedildi. Geri almak için aynı düğmeye tekrar bas.",
    retracted: "Karar geri alındı.",
    saving: "Kaydediliyor…",
    tally: "Şu ana kadar {questions} soru değerlendirildi ({gap} cevapsız, {notGap} cevaplanmış).",
    disagrees: "Bu, metriğin dediğiyle çelişiyor — asıl işe yarayan durum bu.",
  },

  batch: {
    size: "Toplu iş boyutu",
    check: "En üstteki {count} soruyu kontrol et",
    pricing: "Fiyat hesaplanıyor…",
    confirmCount: "{count} soru",
    vsLive: "{queue} kuyruğunda · Live'da {live}",
    skipped:
      "{count} tanesi atlandı — zaten kontrol edilmiş, zaten kuyrukta ya da " +
      "kalan kredinizin ötesinde.",
    noCallback: "Callback kurulu değil: sonuçlar yoklamayla toplanacak, bu da saniyeler yerine dakikalar sürer.",
    confirm: "Kuyruğa al",
    cancel: "Vazgeç",
    posting: "Kuyruğa alınıyor…",
    running: "{total} sorudan {done} tanesi geldi",
    failed: "{count} tanesi başarısız",
    allChecked: "Bütün sorular kontrol edilmiş.",
  },

  dev: {
    role: "yönetici",
    scopeTree: "Yalnızca bu analiz.",
    scopeAll: "Her şey, bütün ağaçlar.",
    grandTotal: "Bütün ağaçlar: {total}",
    rowsTree: "{questions} soru · {tasks} kuyruğa alınmış kontrol",
    loading: "Okunuyor…",
    liveQueue: "Live",
    standardQueue: "Standard",
    requests: "{count} istek · {crawls} arama",
    tasks: "{count} soru",
    saved: "Tasarruf",
    savedNote: "aynı iş Live'da {ifLive} tutardı",
    total: "Toplam",
    perRequest: "İstek başına: {live} Live · {standard} Standard",
    rows: "{questions} soru · {scores} skor · {snapshots} saklanan yanıt",
    storage: "Depolama {state} · {tables} tablo",
    ok: "çalışıyor",
    broken: "ARIZALI",
    callback: "Callback {state}",
    on: "açık",
    offSweep: "kapalı — yoklamaya düşülüyor",
    pending: "{count} tanesi hâlâ kuyrukta",
    failedTasks: "{count} iş başarısız",
  },

  diff: {
    first: "İlk tarama · {at}",
    firstNote: "Henüz karşılaştırılacak bir şey yok. Bu aramayı sonra tekrar çalıştır, değişiklikler burada görünecek.",
    stable: "{since} tarihinden beri değişiklik yok · {count} soru aynı",
    changed: "{added} yeni · {removed} kayboldu · {since} tarihinden beri",
    scope: "Google'ın döndürdüğünü karşılaştırır, skorlamanın sonradan bulduğunu değil. Sıra değişmesi bir değişiklik değildir.",
    addedHeading: "Yeni sorular",
    removedHeading: "Artık sorulmuyor",
    removedNote: "Bunlar için yazılmış bir sayfa artık hiçbir şeyi hedeflemiyor.",
    historyHeading: "Tarama geçmişi",
    questionCount: "{count} soru",
  },

  notice: {
    archiveData: "Arşiv veri",
    archiveDataDetail: "canlı değil",
    liveData: "Canlı tarama",
    liveDataDetail: "anlık görüntü, canlı değil",
    liveDataNote: "Gösterilen saatte bir kez çekildi. Google’ın sonuçları değişir; yenilemek için aramayı tekrarlayın.",
    provisionalThreshold: "Geçici eşik",
    thresholdNote:
      "Boşluk eşiği etiketli veriyle doğrulanmadı. Sonuçlar yön gösterir, " +
      "kesin değildir.",
    volumeNote: "Google Ads bağlı değil — arama hacmi gösterilmiyor.",
    dataNote: "Faz 0 doğrulama arşivinden okunuyor, canlı Google verisi değil.",
  },

  auth: {
    // --- e-posta + parola ile giriş -------------------------------
    signUpTitle: "AnswerGap hesabını oluştur",
    tabSignIn: "Giriş yap",
    tabSignUp: "Hesap oluştur",
    emailLabel: "E-posta",
    passwordLabel: "Parola",
    nameLabel: "Ad (isteğe bağlı)",
    newPassword: "Yeni parola",
    passwordHint:
      "En az 10 karakter. Önemli olan uzunluk — kısa bir parola yerine kısa bir cümle daha iyidir.",
    or: "veya",
    forgot: "Parolanı mı unuttun?",
    forgotTitle: "Parolanı sıfırla",
    forgotSub:
      "Adresini gir, yeni parola belirlemen için bir bağlantı gönderelim.",
    forgotSubmit: "Bağlantıyı gönder",
    sentTitle: "Gelen kutunu kontrol et",
    sentBody:
      "{email} adresine bir bağlantı gönderdik. Adresini doğrulamak ve ücretsiz kredilerini almak için aç.",
    sentSpam: "Bir dakika sürebilir. Gelmezse spam klasörüne bak.",
    sentResend: "Tekrar gönder",
    sentAgain: "Gönderildi. Birazdan gelen kutunu yeniden kontrol et.",
    backToSignIn: "Girişe dön",
    resetTitle: "Yeni parola belirle",
    resetSub:
      "Bu işlem seni diğer tüm cihazlardan da çıkarır — sıfırlamanın amacı zaten bu.",
    resetSubmit: "Kaydet ve giriş yap",
    working: "Çalışıyor…",
    yourAddress: "adresine",
    verifyBanner:
      "Kredilerini kullanmaya başlamak için e-posta adresini doğrula.",
    verifyBannerAction: "Bağlantıyı yeniden gönder",
    verifiedToast: "E-posta adresin doğrulandı. Kredilerin hazır.",
    alreadyVerified:
      "Bu adres zaten doğrulanmış. Giriş yapıp devam edebilirsin.",
    accountEmail: "Giriş yapılan hesap",
    deleteTitle: "Hesabımı sil",
    deleteLead: "Bu geri alınamaz. Aramalarının seninle bağı koparılır; e-posta adresin ve ödeme kayıtların saklanır.",
    deleteAction: "Hesabımı sil…",
    deleteConfirmTitle: "Bu hesap silinsin mi?",
    deleteRemoves: "Silinenler: adın, fotoğrafın, parolan, kayıtlı tercihlerin ve seninle yaptığın her arama arasındaki bağ. Kayıtlı analizlerin artık senin olmaktan çıkar.",
    deleteKeeps: "Saklananlar: geri dönersen seni tanıyabilmemiz için e-posta adresin, ve vergi kurallarının saklamamızı gerektirdiği ödeme kayıtların.",
    deleteRevives: "Bu adresle tekrar kaydolursan hesap geri gelir ve ödemesini yaptığın krediler yerinde durur. Aramalar geri gelmez.",
    deleteConfirmPassword: "Onaylamak için parolanı gir",
    deleteConfirmEmail: "Onaylamak için {email} yaz",
    deleteSubmit: "Hesabımı sil",
    deleteCancel: "Hesabım kalsın",
    verifyExpiredTitle: "Bu bağlantının süresi dolmuş",
    verifyExpiredSub:
      "Doğrulama bağlantısı tek kullanımlıktır ve kısa süre geçerlidir. Adresini yaz, yenisini gönderelim.",
    verifyExpiredSubmit: "Yeni bağlantı gönder",
    close: "Kapat",
    dialogTitle: "AnswerGap'e giriş yap",
    benefitCredits: "Arama yapmak ve soru kontrol etmek için kredi",
    benefitPrivate: "Aramalarınız size ait kalır — kimse göremez",
    benefitScore: "Her soruyu, o soruda çıkan sayfalara karşı kontrol edin",
    noCard: "Kart yok. Önizleme sürecinde krediler elle ekleniyor.",
    signIn: "Google ile giriş yap",
    signOut: "Çıkış yap",
    signedInAs: "{email} olarak girildi",
    account: "Hesap",
    failed: "Giriş tamamlanmadı. Tekrar deneyin.",
    why: "Aramalarınız ve krediniz sizde kalsın diye giriş yapın.",
    whySearch: "Arama yapmak için hesap gerekiyor. Açmak ücretsiz ve yeni hesaplar kredi ile başlıyor.",
  },

  credits: {
    label: "Kredi",
    balance: "{count} kredi",
    empty: "Kredi kalmadı",
    free: "Önbellekten gelen sonuçlar ücretsizdir — kredi harcamaz.",
    manualNote: "Krediler şimdilik elle ekleniyor; henüz ödeme adımı yok.",
  },

  account: {
    title: "Hesabınız",
    signedOutTitle: "Hesabınızı görmek için giriş yapın",
    signedOutLead:
      "Planınız, krediniz ve kredilerinizi harcadığınız her şey giriş yaptıktan sonra görünür.",
    signedOutAction: "Giriş yap",
    back: "Aramaya dön",
    loading: "Yükleniyor…",

    profileHeading: "Bilgiler",
    email: "E-posta",
    name: "Ad",
    joined: "Üyelik başlangıcı",
    unnamed: "Belirtilmemiş",
    verified: "Doğrulandı",
    unverified: "Doğrulanmadı",
    verifyAction: "Bağlantıyı yeniden gönder",
    verifySent: "Gönderildi. Gelen kutunuza bakın.",
    doors: "Giriş yöntemi",
    doorPassword: "Parola",
    doorGoogle: "Google",

    planHeading: "Planınız",
    noPlan: "Plan yok",
    noPlanLead:
      "Bu hesap yalnızca kredi ile çalışıyor. Plan her ay kredi ekler.",
    planCredits: "Her dönem {count} kredi",
    given: "Tarafımızdan tanımlandı",
    bought: "Stripe üzerinden faturalanıyor",
    renews: "{date} tarihinde yenilenir",
    endsOn: "{date} tarihinde biter",
    lapsed: "Bu planın süresi doldu.",
    pastDue: "Son ödeme alınamadı. Planın sürmesi için kartınızı güncelleyin.",
    manage: "Ödemeleri yönet",
    manageLead:
      "İptal edin, plan değiştirin, kartınızı güncelleyin ya da faturalarınızı indirin. Stripe açılır.",

    creditsHeading: "Krediler",
    balanceLead: "Bir arama bir kredi. Önbellekten gelen sonuçlar ücretsiz.",
    historyHeading: "Geçmiş",
    historyWhen: "Tarih",
    historyChange: "Değişim",
    historyWhy: "Gerekçe",
    noHistory: "Henüz bir şey yok.",
    reasonSignup: "Hoş geldin kredisi",
    reasonSearch: "Arama",
    reasonSubscription: "Plan yenileme",
    reasonAdminGrant: "Tarafımızdan eklendi",
    reasonAdminRevoke: "Tarafımızdan alındı",

    plansHeading: "Planlar",
    plansLead: "Planınızı istediğiniz zaman değiştirebilirsiniz.",
    current: "Mevcut planınız",
    choose: "{plan} planını seç",
    monthly: "Aylık",
    annual: "Yıllık",
    notPurchasable: "Henüz satışta değil",
    contactUs: "Bize ulaşın",
    seeAllPlans: "Tüm planları gör",

    billingDone:
      "Teşekkürler. Planınız hazırlanıyor — burada görünmesi biraz sürebilir.",
    billingCancelled: "Hiçbir ödeme alınmadı.",

    dangerHeading: "Hesabı sil",
  },

  error: {
    invalidEmail: "Bu bir e-posta adresine benzemiyor.",
    badCredentials: "Bu e-posta ve parola bir hesapla eşleşmiyor.",
    emailUnverified:
      "Önce e-posta adresini doğrula — bağlantı gelen kutunda.",
    tooManyAttempts: "Çok fazla deneme. Birkaç dakika bekleyip tekrar dene.",
    passwordTooShort: "Parola en az {minLength} karakter olmalı.",
    passwordTooCommon:
      "Bu parola sızıntı listelerinde geçiyor. Başka bir tane seç.",
    resetExpired:
      "Bu bağlantının süresi dolmuş ya da zaten kullanılmış. Yenisini iste.",
    googleOff:
      "Bu kurulumda Google ile giriş yapılandırılmamış. E-posta ile devam et.",
    unreachable: "API'ye ulaşılamadı ({url}). Backend çalışıyor mu?",
    unreachableRetry:
      "Arama tamamlanmışsa kaydedilmiştir — tekrar çalıştırmak kredi " +
      "harcamaz.",
    notFound:
      "Bu analiz burada değil. Silinmiş ya da adres yanlış yazılmış olabilir.",
    http: "{status} {statusText} — {path}",
    noCredentials: "DataForSEO kimlik bilgileri eksik. .env.example dosyasını .env olarak kopyalayıp doldurun, sonra arka ucu yeniden başlatın.",
    budget: "İstek tavanına ulaşıldı; tarama daha fazla harcamak yerine durdu.",
    upstream: "DataForSEO’ya ulaşılamadı ya da hata döndü. Başarısız istek ücretlendirilmez.",
    badRequest: "Bu istek, istendiği şekliyle çalıştırılamaz.",
    signedOut: "Çıkış yapılmış durumdasınız. Devam etmek için giriş yapın.",
    noCredits:
      "Krediniz kalmadı. Bir arama bir kredi harcar; önbellekten gelen " +
      "sonuçlar ücretsizdir.",
    suspended: "Bu hesap askıya alınmış. Bizimle iletişime geçin, çözelim.",
    serverError:
      "Bizim tarafımızda bir şeyler ters gitti. Tamamlanmayan bir arama için " +
      "ücret alınmadı. Birazdan tekrar deneyin.",
    backToAnalyses: "Analizlere dön",
    startBackend: "Backend'i başlatmak için proje kökünde:",
    loading: "Yükleniyor…",
  },

  theme: {
    light: "Koyu temaya geç",
    dark: "Sistemi izle",
    system: "Açık temaya geç",
  },

  language: {
    label: "Arayüz dili",
  },

  market: {
    nav: {
      pricing: "Fiyatlandırma",
      solutions: "Çözümler",
      aiSeo: "AI SEO",
      blog: "Blog",
      contact: "İletişim",
      signIn: "Giriş yap",
      signUp: "Kaydol",
    },

    hero: {
      eyebrow: "AI arama görünürlüğü buradan başlar",
      headlinePre: "AI destekli aramada",
      headlineHighlight: "sıralan ve görün",
      sub:
        "İnsanların ne sorduğunu keşfet, AI motorlarının ihtiyaç duyduğu " +
        "cevapları belirle ve bulunup, kaynak gösterilip, önerilen içerik üret.",
      signedInTitle: "Neye bakalım?",
      searchPlaceholder: "Bir konu girin — örn. diş beyazlatma",
      searchCta: "Analiz et",
      searching: "Aranıyor…",
      elapsed: "{seconds} saniyedir sürüyor",
      tryLabel: "Örnek aramalar:",
      try1: "yeni başlayanlar için en iyi CRM",
      try2: "AI SEO araçları",
    },

    howItWorks: {
      eyebrow: "Nasıl çalışır",
      title: "AI aramanın önerdiği cevap ol.",
      sub:
        "AnswerGap, AI destekli keşfin arkasındaki soruları ortaya çıkarır — " +
        "böylece yararlı, iyi yapılandırılmış içeriği rakiplerinden önce " +
        "oluşturursun.",
      card1: {
        label: "Talep Zekası",
        title: "AI Arama Talebini Haritala",
        body:
          "Tek bir konuyu; keşif ve karar sürecinin her aşamasında insanların " +
          "sorduğu soruların tamamıyla dolu bir haritaya çevir.",
      },
      card2: {
        label: "AI Görünürlüğü",
        title: "Alıntılanma Fırsatlarını Bul",
        body:
          "Zayıf, eksik ya da hiç cevaplanmamış soruları belirle — daha net " +
          "bir içeriğin AI tarafından öne çıkarılma şansının en yüksek olduğu " +
          "yerler tam olarak buralar.",
      },
      card3: {
        label: "Otorite",
        title: "Konu Otoritesi İnşa Et",
        body:
          "Birbirine bağlı soruları önceliklendir ve arama motorlarının ve " +
          "AI asistanlarının anlayıp güvenebileceği kapsamlı cevaplar yayınla.",
      },
    },

    builtFor: {
      eyebrow: "AI Arama için tasarlandı",
      title: "Gerçek sorulara cevap ver. AI seni bulsun.",
      body:
        "Arama artık bir sohbete dönüşüyor. AnswerGap; kitlenin ne " +
        "sorduğunu ve mevcut cevapların nerede yetersiz kaldığını gösterir. " +
        "Böylece markan AI Overview'larda, asistanlarda ve klasik aramada " +
        "görünürlük kazanır.",
      point1: "AI sistemlerinin çıkarıp alıntılayabileceği net cevaplar üret",
      point2: "İçeriği gerçek konuşma diline uygun sorular etrafında yapılandır",
      point3: "Bağlantılı soruları kapsayarak konu otoritesini güçlendir",
      demoUrl: "answergap.com/arama",
      demo1Q: "Küçük işletme için en iyi CRM hangisi?",
      demo1Meta: "Tam cevap · Yüksek görünürlük fırsatı",
      demo2Q: "Google Workspace kullanıyorsam CRM'e ihtiyacım var mı?",
      demo2Meta: "Tam cevap yok · Yüksek görünürlük fırsatı",
      demo3Q: "Excel'den CRM'e nasıl geçilir?",
      demo3Meta: "Kısmi cevaplar · Orta görünürlük fırsatı",
    },

    pricing: {
      title: "Basit, şeffaf fiyatlandırma",
      sub:
        "AI ve arama tarafında görünürlüğünü büyütecek soruları bul. " +
        "İstediğin zaman iptal et.",
      seeAll: "Tüm özellikleri karşılaştır →",
      note:
        "Statik fiyatlandırma — ödeme henüz bağlanmadı. Ürün önizleme " +
        "aşamasındayken krediler elle veriliyor.",
    },

    cta: {
      title: "Cevap olmaya hazır mısın?",
      sub:
        "Önemli soruları bul, AI'ın anlayabileceği cevaplar yayınla ve " +
        "kitlenin aradığı her yerde görünürlük kur.",
      primary: "Ücretsiz başla",
      secondary: "Fiyatları gör",
    },

    footer: {
      tagline:
        "AI aramanın cevap beklediği soruları bul — ve markanın onun önerdiği " +
        "güvenilir kaynak olmasını sağla.",
      product: {
        heading: "Ürün",
        features: "Özellikler",
        pricing: "Fiyatlandırma",
        api: "API",
        changelog: "Değişiklikler",
      },
      resources: {
        heading: "Kaynaklar",
        blog: "Blog",
        seoGuides: "SEO Rehberleri",
        helpCenter: "Yardım Merkezi",
        community: "Topluluk",
      },
      company: {
        heading: "Şirket",
        about: "Hakkımızda",
        contact: "İletişim",
        privacy: "Gizlilik Politikası",
        terms: "Kullanım Koşulları",
      },
      copyright: "© {year} AnswerGap. Tüm hakları saklıdır.",
    },

    saved: {
      heading: "Son analizlerin",
      demoHeading: "Gerçek veri üzerinde görün",
      count: "{count} kayıtlı",
    },
  },
};
