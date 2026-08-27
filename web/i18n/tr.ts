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
    gap: "Boşluk",
    weak: "Zayıf",
    covered: "Cevaplanmış",
    no_data: "Veri yok",
    gapExplained:
      "Hiçbir arama sonucu bu soruyu doğrudan hedeflemiyor. Cevap, başka bir " +
      "konu için yazılmış sayfaların içinden çıkarılmak zorunda.",
    weakExplained:
      "Bir ya da iki sayfa bu soruyu hedefliyor. Rekabet başlamış ama hâlâ " +
      "yer var.",
    coveredExplained:
      "Üç veya daha fazla sayfa bu soruyu hedefliyor. Bu soruda öne çıkmak zor.",
    no_dataExplained:
      "Bu soru için arama sonuçları çekilmedi, dolayısıyla boşluk olup olmadığı " +
      "BİLİNMİYOR. Boşluk olarak sayılmaz.",
  },

  toolbar: {
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
    matchingPagesHint: "Örtüşme eşiğini geçen organik sonuçlar",
    checked: "Bakılan",
    checkedHint: "İncelenen organik sonuç sayısı",
    branches: "Dal",
    branchesHint: "Bu soru kaç farklı ebeveynin altında çıktı",
    depth: "Derinlik",
    volume: "Hacim",
    volumeHint: "Google Ads bağlı değil",
    noVolume: "veri yok",
    empty: "Filtreye uyan soru yok.",
  },

  detail: {
    empty:
      "Bir soru seç — hangi sayfaların onu hedeflediğini, hedeflemediğini ve " +
      "neden boşluk sayıldığını gör.",
    depth: "Seviye {depth}",
    branches: "{count} dalda",
    matchingPages: "Hedefleyen sayfa",
    checked: "Bakılan sonuç",
    volume: "Arama hacmi",
    resultsHeading: "Arama sonuçları · örtüşme ≥ {threshold} geçer sayılır",
    noResults: "Bu soru için arama sonuçları <b>hiç çekilmedi</b>, dolayısıyla boşluk olup olmadığı bilinmiyor - kesikli çerçeveyle çizilmesinin sebebi bu. Bu arşivlenmiş bir analiz; skorlamak için aynı kelimeyle canlı bir arama çalıştırın.",
    notScoredYet: "Bu soru <b>henüz skorlanmadı</b>. Kontrol etmek bir arama isteğine mal olduğu için hiçbir zaman kendiliğinden yapılmaz — yapılana kadar boşluk olup olmadığı bilinmiyor.",
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
