import type { Messages } from "./types";

export const tr: Messages = {
  brand: {
    name: "GetTopQuestions",
    tagline: "Rakiplerinin hiç cevaplamadığı soruları bul.",
  },

  landing: {
    treeCount: "{count} kayıtlı",
    emptyTitle: "Henüz arama yok.",
    emptyBody:
      "Yukarıdaki arama kutusuyla başlayın ya da örneklerden birini deneyin. Bir arama bir kredi harcar. Aramalarınız yalnızca sizin hesabınıza aittir.",
    headline: "Rakiplerinin hiç cevaplamadığı soruları bul.",
    intro:
      "GetTopQuestions, Google'ın “Bunlar da sorulmuş” verisini bir soru ağacına " +
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
    filters: "Filtreler",
    seedLabel: "Aramanız",
    pngUncheckedNote: "Henüz hiçbir soru kontrol edilmedi: arama sonuçları kontrol edilene kadar her kutu gri kalır",
    pngRepeatNote: "×N = Google bu soruyu N farklı dalda gösterdi",
    seeds: "İlgili aramalar",
    tree: "Ağaç",
    showDetails: "Ayrıntıları göster",
    table: "Tablo",
    searchPlaceholder: "Sorularda filtrele…",
    showing: "{total} sorudan {shown} tanesi",
    exportCsv: "CSV indir",
    exportCsvHint: "Ekranda görünen satırları, filtreleriniz uygulanmış hâlde indirir.",
    exportPng: "Görseli indir",
    exportPngHint: "Ağacın tamamını PNG olarak kaydeder, yalnızca görünen kısmı değil.",
    zoomIn: "Yakınlaş",
    zoomOut: "Uzaklaş",
    zoomLevel: "Yakınlaştırma düzeyi",
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
    sortBy: "Sırala",
    volumeNote: "Arama hacmi: henüz veri yok, çünkü Google Ads bağlı değil. Bağlanana kadar ilgi sinyali dal sayısı (bir sorunun kaç farklı sorunun altında çıktığı).",
  },

  writeFirst: {
    title: "Önce bunları yaz",
    lead: "Bu ağaçtaki cevapsız sorular. Boşluk skoru bir tahmindir, yazmadan önce sayfalara bak.",
    none: "Kontrol edilen sorular arasında henüz cevapsız çıkan yok.",
    pages: "{checked} sayfanın {matching} tanesi hedefliyor",
    order: "Sıralama: en az sayfanın hedeflediği, sonra en çok dalda çıkan, sonra konuna en yakın soru. Bu bir popülerlik sıralaması değildir.",
  },

  ai: {
    heading: "Bu ağaçta Google AI Overview",
    noneChecked: "Henüz hiçbir soru kontrol edilmedi. Bir soruyu kontrol etmek, Google AI Overview'un onu cevaplayıp cevaplamadığını ve hangi siteleri kaynak gösterdiğini de ek ücret olmadan gösterir.",
    coverage: "Google AI Overview, AI cevabı okunabilen {checked} sorunun {withAi} tanesinde kaynak gösteriyor.",
    citedIn: "{checked} sorunun {count} tanesinde kaynak",
    pngTop: "AI Overview'da en çok kaynak gösterilenler: {domains}",
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
    notScoredYet: "Bu soru <b>henüz kontrol edilmedi</b>. Kontrol etmek bir krediye mal oluyor, bu yüzden asla kendiliğinden olmuyor — ve o zamana kadar kimsenin cevaplayıp cevaplamadığı bilinmiyor.",
    scoreButton: "Bu soruyu kontrol et · 1 kredi",
    scoring: "Bu soru aranıyor… (30–60 saniye)",
    scoreCost: "Soru kendi başına aranır: sonucu burada görünür ve kendi soru ağacı açılır. Daha önce aranmış bir soru ücretsizdir.",
    openTree: "Bu sorunun ağacını aç",
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
    mobileNode: "Google'ın mobil sayfasında gösterildi",
    autocompleteNode: "Google arama önerisi",
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
    credits: "{count} kredi",
    queueDiscount:
      "Yarı fiyat: toplu kontrol anında dönmek yerine kuyruğa giriyor.",
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

  rounds: {
    first: "Ağacı analiz et ve büyüt · 2 kredi",
    second: "Bir kez daha büyüt · 3 kredi",
    confirmCount: "{count} soru analiz edilecek",
    grows: "Analiz edilen her soru kendi sorularını da getirir, bu yüzden ağaç büyür.",
    leftOut: "{count} soru bu turun sınırını aşıyor ve analiz edilmeden kalacak.",
    limit: "Tur sınırına ulaşıldı · {count} soru analiz edilmedi",
    limitNone: "Tur sınırına ulaşıldı",
  },

  deep: {
    open: "Kapalı dalları aç",
    openCount: "{count} kapalı dalı aç",
    closedHint: "Google {total} ana sorudan {open} tanesini açtı, {closed} tanesini kapalı bıraktı.",
    confirmCount: "{count} dal",
    queueDiscount:
      "Yarı fiyat: dallar anında dönmek yerine kuyrukta açılır.",
    alsoScores:
      "Her biri yol üstünde boşluk için de kontrol edilir, ek ücret yok.",
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
    fallbackMobile: "Google bu arama için masaüstünde soru göstermedi. Bunlar mobilde gösterdiği sorular.",
    fallbackAutocomplete: "Google bu arama için soru göstermiyor. Bunun yerine arama önerileri burada; sonuç sayfasındaki sorular değil.",
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
    signUpTitle: "GetTopQuestions hesabını oluştur",
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
    deleteSubscription: "Ücretli planın hemen iptal edilir ve kartından bir daha ücret alınmaz. İçinde bulunduğun dönemin kalanı iade edilmez.",
    deleteConfirmPassword: "Onaylamak için parolanı gir",
    deleteConfirmEmail: "Onaylamak için {email} yaz",
    deleteSubmit: "Hesabımı sil",
    deleteCancel: "Hesabım kalsın",
    verifyExpiredTitle: "Bu bağlantının süresi dolmuş",
    verifyExpiredSub:
      "Doğrulama bağlantısı tek kullanımlıktır ve kısa süre geçerlidir. Adresini yaz, yenisini gönderelim.",
    verifyExpiredSubmit: "Yeni bağlantı gönder",
    close: "Kapat",
    dialogTitle: "GetTopQuestions'a giriş yap",
    benefitCredits: "Arama yapmak ve soru kontrol etmek için kredi",
    benefitPrivate: "Aramalarınız size ait kalır — kimse göremez",
    benefitScore: "Her soruyu, o soruda çıkan sayfalara karşı kontrol edin",
    noCard: "Kart yok. Önizleme sürecinde krediler elle ekleniyor.",
    signIn: "Google ile giriş yap",
    signOut: "Çıkış yap",
    signedInAs: "{email} olarak girildi",
    account: "Hesap",
    alreadySignedIn: "Zaten bir hesabınız var",
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
    periodHeading: "Bu dönem",
    periodUsed: "Bu dönemde {granted} kredinin {used} tanesi kullanıldı",
    periodResets: "{date} tarihinde yenilenir",
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
      "İptal edin, kartınızı güncelleyin ya da faturalarınızı indirin. Stripe açılır.",

    creditsHeading: "Krediler",
    balanceLead: "Bir arama bir kredi. Kayıtlı bir aramanı yeniden açmak ücretsiz.",
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
    myPlansHeading: "Planların",
    myPlansLead: "Krediler önce dönemi en erken biten plandan harcanır; o planın kredileri bitince sıradaki plana geçilir. Bir planın o dönemde kullanılmayan kredileri dönem bitince silinir. Hiçbir plandan gelmeyen krediler en son harcanır.",
    otherCredits: "Plan dışı krediler (hoş geldin, hediye): {count}, en son harcanır",
    spendingFrom: "Şu an buradan harcanıyor",
    creditsLeftOf: "Bu dönem {total} krediden {left} kredi kaldı",
    burnsOn: "Kullanılmayan krediler {date} tarihinde silinir",
    defaultBadge: "Varsayılan",
    makeDefault: "Varsayılan yap",
    ofTotalLeft: "/ {total} kredi kaldı",
    usedCount: "{count} kullanıldı",
    confirmDefault: "{plan} varsayılan planın olsun mu? Diğer planların ({others}) yenilenmeyecek; kredilerini dönemleri bitene kadar kullanabilirsin.",
    confirmDefaultAlone: "{plan} varsayılan planın olsun mu?",
    confirmDefaultYes: "Evet, varsayılan yap",
    defaultRenewsNote: "{plan} her ay otomatik olarak yenilenir. Yenilemeyi istediğin zaman “{manage}” bölümünden durdurabilirsin.",
    autoRenewHint: "Her ay otomatik yenilenir · istediğin zaman “{manage}” bölümünden durdurabilirsin",
    cancelStep: "Vazgeç",
    endingMakeDefault: "Bu plan {date} tarihinde bitiyor. Devam ettirmek için yukarıda “Varsayılan yap”ı seç; yeniden satın alman gerekmez.",
    endingRenewInPortal: "Bu plan {date} tarihinde bitiyor. Devam ettirmek için “{manage}” bölümünden yenileyebilirsin; yeniden satın alman gerekmez.",
    chooseAdditional: "{plan} planını ek plan olarak al",
    additionalWarn: "Mevcut planın devam eder ve bu plan ayrıca ücretlendirilir. Yalnızca varsayılan planın her ay yenilenir: bu plan ilk döneminin sonunda biter. Yenilenmesini istersen onu varsayılan yap; o zaman diğer planların dönem sonunda durur.",
    additionalYes: "Anladım, ödemeye geç",
    contactUs: "Bize ulaşın",
    seeAllPlans: "Tüm planları gör",

    billingDone:
      "Teşekkürler. Planınız hazırlanıyor — burada görünmesi biraz sürebilir.",
    billingCancelled: "Hiçbir ödeme alınmadı.",

    settingsHeading: "Ayarlar",
    theme: "Görünüm",
    language: "Dil",
    dangerHeading: "Hesabı sil",

    navOverview: "Genel bakış",
    navProfile: "Profil",
    navSubscription: "Abonelik",
    navSettings: "Ayarlar",
    navSearches: "Aramalarım",
    hello: "Merhaba, {name}",
    overviewLead: "Kredilerin, planın ve hesabın tek bakışta.",
    newSearch: "Yeni bir arama başlat",
    newSearchLead: "Her yeni arama bir kredi. Daha önce yaptığın bir aramayı açmak ücretsiz.",
    noAllowance: "Aylık kredi hakkın yok. Bir plan her ay kredi ekler.",
    overdrawn: "Bakiyen {count}: bir sonraki gelen krediler önce bunu kapatır.",
    changePlan: "Planı değiştir",
    profileLead: "Kim olduğun ve nasıl giriş yaptığın.",
    subscriptionLead: "Planın, kredilerin ve geçebileceğin planlar.",
    settingsLead: "GetTopQuestions'ın görünümü ve dili.",
    themeLead: "Açık, koyu ya da sistemine göre.",
    languageLead: "Arayüzün dili.",
  },

  home: {
    statAnalyses: "analiz",
    statGaps: "cevapsız soru bulundu",
    filter: "Analizlerinde ara…",
    sortLabel: "Sırala",
    sortNewest: "En yeni",
    sortQuestions: "En çok soru",
    sortGaps: "En çok cevapsız",
    noMatch: "“{query}” ile eşleşen analiz yok.",
    unanswered: "cevapsız",
    notChecked: "Henüz kontrol edilmedi",
    jobReady: "hazır.",
    jobOpen: "Ağacı aç",
    jobLost:
      "— arama sürerken sayfa yenilendi ve sonucu henüz görünmedi. Aşağıdaki analizlerinde yoksa tekrar ara: tamamlanmış bir aramayı yeniden çalıştırmak ücretsizdir.",
  },

  strip: {
    left: "kredi kaldı",
    upgrade: "Yükselt",
    choosePlan: "Plan seç",
    jobRunning: "“{seed}” aranıyor…",
    jobReady: "“{seed}” hazır",
  },

  refresh: {
    live: "Live",
    title: "En güncel veriler için tekrar ara (1 kredi)",
    busy: "Başka bir arama hâlâ sürüyor",
    confirm: "En güncel veriler getirilsin mi? 1 kredi kullanılır.",
    yes: "Güncelle",
    no: "Vazgeç",
    running: "Güncelleniyor…",
    processing: "İşleniyor…",
    processingNote: "Sorular toplanıyor ve sonuçlar kontrol ediliyor. Bu biraz sürer.",
    saved: "Kayıtlı",
  },

  repeat: {
    title: "“{seed}” aramasını zaten yaptın",
    lead: "Kayıtlı sonucunu aç ya da en güncel verileri getir.",
    leadDated: "Kayıtlı sonucun {date} tarihli. Açabilir ya da en güncel verileri getirebilirsin.",
    open: "Kayıtlı sonucu aç",
    openNote: "Ücretsiz · hemen açılır",
    update: "En güncel verilerle güncelle",
    updateNote: "1 kredi · yeniden aranır",
    cancel: "Vazgeç",
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
    searchUnavailable:
      "Arama geçici olarak kullanılamıyor. Haberdar edildik, ilgileniyoruz. Krediniz düşülmedi.",
    searchFailed:
      "Arama tamamlanamadı. Krediniz düşülmedi - lütfen bir dakika sonra tekrar deneyin.",
    alreadySearched: "Bu aramayı zaten yaptın. Listenden açabilir ya da güncelleyebilirsin.",
    anonLimit: "Bugünkü ücretsiz aramanı kullandın. Aramaya devam etmek için ücretsiz hesap aç.",
    anonDailyFull: "Bugünkü ücretsiz aramaların hepsi kullanıldı. Hemen aramak için ücretsiz hesap aç.",
    captchaFailed: "Bu aramanın bir kişiden geldiğini doğrulayamadık. Lütfen tekrar dene.",
    badRequest: "Bu istek, istendiği şekliyle çalıştırılamaz.",
    planNotPurchasable:
      "Bu plan henüz satın alınamıyor — ödeme kurulumunu tamamlamadık. " +
      "Bize yazın, sizin için halledelim.",
    noSuchPlan: "Bu plan artık sunulmuyor.",
    roundLimit: "Bu ağaç iki analiz turunun ikisini de kullandı.",
    roundInFlight: "Önceki turun sonuçları hâlâ geliyor. Tamamlanınca tekrar deneyin.",
    noCustomer: "Yönetilecek bir şey yok — bu hesaba hiç fatura kesilmemiş.",
    paymentsOff: "Ödemeler henüz açık değil.",
    subscriptionCancelFailed: "Aboneliğini iptal edemedik, bu yüzden hesabın silinmedi. Birkaç dakika sonra tekrar dene ya da destek ekibine yaz.",
    alreadyOnPlan: "Bu plana zaten sahipsin. Bitecekse, “Planların” bölümünden varsayılan yaparak devam ettirebilirsin; ya da başka bir plan seç.",
    planPaymentFailed: "Bu planın ödemesi alınamadı, bu yüzden varsayılan yapılamaz. Önce “Ödemeleri yönet” bölümünden kartını güncelle ya da ödemesi yapılmış bir plan seç.",
    stripeFailed: "Ödeme sağlayıcısı bu isteği reddetti ve hiçbir ödeme alınmadı. Birkaç dakika sonra tekrar dene. Sorun sürerse support@gettopquestions.com adresine yaz.",
    signedOut: "Çıkış yapılmış durumdasınız. Devam etmek için giriş yapın.",
    noCredits: "Krediniz kalmadı. Her arama bir kredi harcar. Devam etmek için bir plan seçin.",
    seePlans: "Planları gör",
    suspended: "Bu hesap askıya alınmış. Bizimle iletişime geçin, çözelim.",
    serverError:
      "Bizim tarafımızda bir şeyler ters gitti. Tamamlanmayan bir arama için " +
      "ücret alınmadı. Birazdan tekrar deneyin.",
    backToAnalyses: "Analizlere dön",
    startBackend: "Backend'i başlatmak için proje kökünde:",
    loading: "Yükleniyor…",
  },

  anon: {
    freeTitle: "Üye olmadan günde {count} ücretsiz arama hakkın var",
    freeNote: "Soru ağacını ve tabloyu görebilirsin. Soruları analiz etmek, ağacı genişletmek ve dışa aktarmak üyelere açık.",
    usedTitle: "Bugünkü ücretsiz aramanı kullandın",
    resetsIn: "Yeni hakkın {hours} sa {minutes} dk sonra gelir (saat {clock}). Beklemeden aramak için ücretsiz hesap aç.",
    dailyFull: "Bugünkü ücretsiz aramaların hepsi kullanıldı.",
    usedUpReason: "Ücretsiz hesapla soru ağacının tamamını görürsün ve aramaların saklanır.",
    signUpFree: "Ücretsiz hesap aç",
    verifying: "Doğrulanıyor…",
    previewTitle: "Üye olmadan yaptığın ücretsiz arama",
    previewBody: "Ağacın ve tablonun ilk halini görüyorsun. Soruları analiz etmek, ağacı genişletmek ve PNG/CSV olarak indirmek için ücretsiz hesap aç.",
    previewEmpty: "Google bu arama için hiç soru göstermedi, bu yüzden ücretsiz arama hakkın kullanılmadı. Bir soru ya da birkaç kelime dene, örneğin “filtre kahve nasıl demlenir”.",
    hint: "İpucu: Soru biçiminde ya da birkaç kelimelik aramalar en iyi sonucu verir (“filtre kahve nasıl demlenir”). Marka adları ve tek kelimeler için Google çoğu zaman soru göstermez.",
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
      menu: "Menü",
    },

    hero: {
      eyebrow: "İçerik üreticileri, kurucular ve pazarlamacılar için soru araştırması",
      headlinePre: "Cevaplamaya değer",
      headlineHighlight: "soruları bul",
      sub:
        "Bir terim yaz, en çok sorulan ilgili soruları keşfet ve bunları klasik " +
        "arama, Google AI Overview ve sohbet tabanlı yapay zekâ araması için " +
        "faydalı içerikler üretmekte kullan.",
      signedInTitle: "Neye bakalım?",
      searchPlaceholder: "Bir terim yaz, örneğin ayakta çalışma masası",
      searchCta: "Ara",
      searching: "Aranıyor…",
      elapsed: "{seconds} saniyedir sürüyor",
      tryLabel: "Örnek aramalar:",
      try1: "yeni başlayanlar için en iyi CRM",
      try2: "AI SEO araçları",
    },

    picker: {
      open: "Arama pazarını seç",
      country: "Ülke",
      language: "Dil",
      search: "Ülke ara",
      none: "Ülke bulunamadı",
    },

    howItWorks: {
      eyebrow: "Nasıl çalışır",
      title: "İnsanların gerçekten sorduğundan başla.",
      sub:
        "GetTopQuestions teriminin etrafındaki soruları ortaya çıkarır, böylece " +
        "gerçek merakı temel alan, faydalı ve iyi kurgulanmış içerikler " +
        "planlayabilirsin.",
      card1: {
        label: "Soru Araştırması",
        title: "İlgili Soruları Keşfet",
        body:
          "Tek bir terimi, ilk meraktan karşılaştırmaya ve karara kadar en çok " +
          "sorulan ilgili sorulara dönüştür.",
      },
      card2: {
        label: "Editoryal Planlama",
        title: "İçerik Fırsatlarını Yakala",
        body:
          "Soruları bir editör gözüyle oku; mevcut içeriğinin cevapsız bıraktığı " +
          "ya da yalnızca geçerken değindiği soruları fark et.",
      },
      card3: {
        label: "Otorite",
        title: "Konu Otoritesi Oluştur",
        body:
          "Bağlantılı soruları grupla ve bir konuyu baştan sona ele alan, " +
          "okurlar, arama motorları ve yapay zekâ asistanları için net yazılmış " +
          "içerikler planla.",
      },
    },

    workflow: {
      eyebrow: "İş akışı",
      titleLead: "Terim girer. Sorular çıkar.",
      titleMuted: "İçerik senden.",
      body:
        "GetTopQuestions bir araştırma başlangıç noktasıdır. Senin yerine yazmaz " +
        "veya yayınlamaz, sıralama takibi de yapmaz. İnsanların ne sorduğunu " +
        "gösterir; böylece planladığın içerik varsayımlarına değil, onların " +
        "sorularına dayanır.",
      step1: {
        label: "01 / Terim",
        title: "Kitlenin kullandığı kelimelerle başla",
        body:
          "Bir ürün kategorisi, sorun, özellik ya da \"ayakta çalışma masası\" " +
          "gibi sade bir ifade yaz. Geniş olması sorun değil. Amaç kapıyı " +
          "açmak, kusursuz anahtar kelimeyi tahmin etmek değil.",
        sample: "ayakta çalışma masası",
      },
      step2: {
        label: "02 / Sorular",
        title: "Etrafında sorulan soruları gör",
        body:
          "GetTopQuestions en çok sorulan ilgili soruları ortaya çıkarır; böylece " +
          "konuyu meraklı bir alıcının, yeni başlayanın ya da şüphecinin " +
          "soracağı şekilde okursun.",
        sample: "Ayakta çalışma masası bel ağrısına iyi gelir mi?",
      },
      step3: {
        label: "03 / İçerik",
        title: "Sırada ne yazacağına karar ver",
        body:
          "Soruları niyete göre grupla, gerçek uzmanlığınla cevaplayabileceklerini " +
          "seç ve sayfalara, bölümlere, SSS'lere, videolara ya da yazılara " +
          "dönüştür. Yazmak sana ait.",
        sample: "Rehber: ayakta çalışmak kimin işine yarar, kimin yaramaz",
      },
    },

    examples: {
      eyebrow: "Sorudan içeriğe",
      title: "Boşluk neye benzer?",
      sub:
        "Bir konu seç. Bunlar sonucun nasıl okunacağını göstermek için " +
        "ekibimizin yazdığı örneklerdir, uygulamanın gerçek çıktısı değildir.",
      columnQuestion: "İnsanların sorduğu soru",
      columnPages: "Onu hedefleyen sayfalar",
      columnVerdict: "Sonuç",
      columnIdea: "Ne yapmalı",
      skipIdea: "Söyleyecek yeni bir şeyin yoksa geç",
      tab1: {
        term: "ekşi maya",
        q1: "Ekşi mayam bir hafta sonra neden kabarmayı bıraktı?",
        idea1: "Teşhis listesi: sıcaklık, un, besleme oranı, zamanlama",
        q2: "Ekşi maya için çok amaçlı un kullanılır mı?",
        idea2: "SSS bölümünde doğrudan cevap, ardından artıları ve eksileri",
        q3: "Ekşi maya nasıl yapılır?",
      },
      tab2: {
        term: "fatura programı",
        q1: "Şirket kurmadan fatura kesebilir miyim?",
        idea1: "Duruma göre ayrılmış, sade dilde bir rehber",
        q2: "Fatura programı gider olarak yazılır mı?",
        idea2: "Kısa cevap ve çözümlü örnekler",
        q3: "En iyi fatura programı hangisi?",
      },
      tab3: {
        term: "patika koşu ayakkabısı",
        q1: "Patika koşu ayakkabısı ıslak kayada kullanılır mı?",
        idea1: "Kendi fotoğraflarınla denenmiş bir karşılaştırma",
        q2: "Patika koşu ayakkabısı ne kadar dayanır?",
        idea2: "Yıpranma işaretleriyle bir kilometre rehberi",
        q3: "En iyi patika koşu ayakkabısı hangisi?",
      },
    },

    builtFor: {
      eyebrow: "Yapay zekâ araması için",
      title: "Gerçek soruları cevapla. Yapay zekâda keşfedil.",
      body:
        "Arama bir sohbete dönüşüyor. GetTopQuestions kitlenin ne sorduğunu ve " +
        "mevcut cevapların nerede yetersiz kaldığını gösterir; sen de AI " +
        "Overview, asistanlar ve klasik arama için net cevaplar yazarsın. " +
        "Görünürlük hiçbir zaman garanti değildir, ama kimsenin cevaplamadığı " +
        "bir soru başlamak için doğru yerdir.",
      point1: "Kontrol ettiğin her soruda Google'ın AI Overview'unun hangi sitelere kaynak verdiğini gör",
      point2: "Siteni gir, kaynak gösterildiğin soruları gör",
      point3: "İçeriği gerçek, sohbet biçimindeki aramalara göre kurgula",
      demoLabel: "Örnek: crm",
      demo1Q: "Küçük işletmeler için en iyi CRM hangisi?",
      demo1Meta: "8 sayfadan 6'sı hedefliyor",
      demo2Q: "Google Workspace kullanıyorsam CRM'e ihtiyacım var mı?",
      demo2Meta: "8 sayfadan 0'ı hedefliyor",
      demo3Q: "Excel'den CRM'e nasıl geçilir?",
      demo3Meta: "8 sayfadan 2'si hedefliyor",
      demoNote: "Örnek ekibimiz tarafından yazıldı. Gerçek ölçüm değildir.",
    },

    formats: {
      eyebrow: "İçerik formatları",
      title: "Formatı soru seçsin.",
      body:
        "Bir sorunun soruluş biçimi, nasıl cevaplanmak istediğini ele verir. " +
        "Net ve düzenli cevaplar okura klasik arama sonuçlarında, Google AI " +
        "Overview'da ve sohbet asistanlarında aynı şekilde yarar. Hiçbirinde " +
        "garanti yok, ama işe yarar bir yapı sağlam bir tercihtir.",
      card1: {
        title: "SSS bölümleri",
        when: "Sorunun kısa ve net bir cevabı olduğunda.",
        how: "Cevabı bir iki cümleyle ver, ayrıntıyı sonra ekle.",
      },
      card2: {
        title: "Kapsamlı rehberler",
        when: "Birkaç soru aynı temel soruna çıktığında.",
        how: "Her soruyu alt başlık yap ki okur kendininkine atlayabilsin.",
      },
      card3: {
        title: "Karşılaştırma sayfaları",
        when: "Sorularda \"mı yoksa\", \"hangisi\" ya da \"daha iyi\" geçtiğinde.",
        how: "Her seçeneğin kime uygun olduğunu açık yaz. Tablolar işe yarar.",
      },
      card4: {
        title: "Adım adım anlatımlar",
        when: "Sorular \"nasıl yapılır\" diye başladığında.",
        how: "Adımları numaralandır, bittiğinde sonucun nasıl görüneceğini yaz.",
      },
      card5: {
        title: "Kısa video ve sosyal medya",
        when: "Cevap görsel ya da hızlıca gösterilebilir olduğunda.",
        how: "Soruyu ilk saniyelerde ekrana koy.",
      },
      card6: {
        title: "Bülten ve satış notları",
        when: "Sorular itiraz ya da tereddüt ortaya koyduğunda.",
        how: "Şüpheyi, kayıp bir cevaba dönüşmeden dürüstçe yanıtla.",
      },
    },

    faq: {
      eyebrow: "Pratik cevaplar",
      title: "GetTopQuestions hakkında sorular",
      q1: "GetTopQuestions tam olarak ne yapıyor?",
      a1:
        "Bir terim yazarsın, GetTopQuestions onunla ilgili en çok sorulan " +
        "soruları gösterir. Sonra bu soruları faydalı içerikler planlamak ve " +
        "yazmak için kullanırsın. Bütün fikir bu: soru araştırması için pratik " +
        "bir başlangıç noktası.",
      q2: "Benim yerime içerik yazıp yayınlıyor mu?",
      a2:
        "Hayır. GetTopQuestions ne yazacağına karar vermene yardım eder. Yazmak, " +
        "düzenlemek ve yayınlamak sana aittir; uzmanlığın ve sesin de burada " +
        "devreye girer.",
      q3: "Sıralamalarımı veya yapay zekâdaki bahsedilmelerimi takip ediyor mu?",
      a3:
        "Hayır. GetTopQuestions bir sıralama takipçisi, marka izleme ya da kaynak " +
        "analiz aracı değildir ve arama hacmi raporlamaz. Odağı soruları " +
        "keşfetmektir.",
      q4: "Bu soruları cevaplarsam AI Overview'a girer miyim?",
      a4:
        "Bunu kimse vaat edemez. Gerçek soruları net ve doğru cevaplamak klasik " +
        "arama, Google AI Overview ve sohbet tabanlı yapay zekâ araması için " +
        "mantıklı bir temeldir, ama yerleşime o platformlar karar verir.",
      q5: "Nasıl bir terimle başlamalıyım?",
      a5:
        "Kitlenin gerçekten yazacağı ya da söyleyeceği bir şeyle: bir ürün " +
        "kategorisi, sorun, görev ya da karşılaştırma. Sonuçlar fazla geniş " +
        "gelirse, az önce bulduğun sorulardan daha dar bir ifade dene.",
      q6: "Bir sayfa kaç soruyu cevaplamalı?",
      a6:
        "Genellikle bir ana soruyu ve okurun sıradaki aklına gelecek yakın " +
        "takip sorularını. İki soru farklı insanlar için farklı cevaplar " +
        "gerektiriyorsa, büyük ihtimalle ayrı içerikleri hak ediyordur.",
    },

    pricing: {
      billed: "Aylık faturalandırılır",
      signUpNow: "Hemen kaydol",
      tax: "+ Vergi",
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
      title: "Sıradaki sorunu bulmaya hazır mısın?",
      sub:
        "Bir terim yaz, insanların ne sorduğunu gör ve nerede ararlarsa arasınlar " +
        "onlara gerçekten yardımcı olacak içerikler planla.",
      primary: "Ücretsiz başla",
      secondary: "Fiyatları gör",
    },

    footer: {
      tagline:
        "İnsanların konun hakkında sorduğu soruları keşfet, sonra onları " +
        "cevaplayan faydalı içerikler üret.",
      product: {
        heading: "Ürün",
        features: "Özellikler",
        pricing: "Fiyatlar",
        api: "API",
        changelog: "Değişiklik günlüğü",
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
      copyright: "© {year} GetTopQuestions. Tüm hakları saklıdır.",
    },

    saved: {
      heading: "Son analizlerin",
      demoHeading: "Gerçek veri üzerinde görün",
      count: "{count} kayıtlı",
    },
  },
};
