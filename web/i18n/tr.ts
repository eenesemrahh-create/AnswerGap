import type { Messages } from "./types";

export const tr: Messages = {
  brand: {
    name: "AnswerGap",
    tagline: "Rakiplerinin hiç cevaplamadığı soruları bul.",
    prototype: "prototip",
  },

  landing: {
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
  },

  seeds: {
    note:
      "Google bu ifadeleri sonuçların yanında gösterir. Bunlar soru değil sorgudur, bu yüzden ağaçta düğüm olmazlar — aranacak bir sonraki tohumlardır.",
    empty: "Bu ağaç için henüz ilgili arama kaydedilmedi.",
  },

  detail: {
    empty:
      "Hangi sayfaların bu soruyu hedeflediğini, hangilerinin " +
      "hedeflemediğini ve kaçının onu gerçekten cevapladığını görmek " +
      "için bir soru seçin.",
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
    skipped: "{count} tanesi atlandı — zaten kontrol edilmiş ya da zaten kuyrukta.",
    noCallback: "Callback kurulu değil: sonuçlar yoklamayla toplanacak, bu da saniyeler yerine dakikalar sürer.",
    confirm: "Kuyruğa al",
    cancel: "Vazgeç",
    posting: "Kuyruğa alınıyor…",
    running: "{total} sorudan {done} tanesi geldi",
    failed: "{count} tanesi başarısız",
    allChecked: "Bütün sorular kontrol edilmiş.",
  },

  dev: {
    role: "geliştirici",
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

  error: {
    unreachable: "API'ye ulaşılamadı ({url}). Backend çalışıyor mu?",
    http: "{status} {statusText} — {path}",
    noCredentials: "DataForSEO kimlik bilgileri eksik. .env.example dosyasını .env olarak kopyalayıp doldurun, sonra arka ucu yeniden başlatın.",
    budget: "İstek tavanına ulaşıldı; tarama daha fazla harcamak yerine durdu.",
    upstream: "DataForSEO’ya ulaşılamadı ya da hata döndü. Başarısız istek ücretlendirilmez.",
    badRequest: "Bu istek, istendiği şekliyle çalıştırılamaz.",
    backToAnalyses: "Analizlere dön",
    startBackend: "Backend'i başlatmak için proje kökünde:",
    loading: "Yükleniyor…",
  },

  language: {
    label: "Arayüz dili",
  },
};
