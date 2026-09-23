import type { PricingContent } from "./index";

/**
 * Fiyatlandırma sayfası - İngilizce sürümün çevirisi.
 *
 * `en.ts` ile kart karta, madde madde ve satır satır örtüşmek zorundadır;
 * tip bunu derleme hatasına çevirir. Fiyatlar, plan sırası ve karşılaştırma
 * tablosundaki doğru/yanlış değerleri metin değil veridir: aynen korunur.
 *
 * `en.ts` içindeki uyarı burada da geçerlidir: bu sayfadaki özelliklerin bir
 * bölümü henüz yazılmadı, dolayısıyla sayfa yayına alınmadan önce ya
 * özelliklerin var olması ya da bu satırların değişmesi gerekir.
 */
export const tr: PricingContent = {
  title: "Fiyatlandırma",
  description:
    "Yapay zeka aramasının hangi soruları yanıtladığını, hangilerini " +
    "yanıtlamadığını ve kimi kaynak gösterdiğini bilmesi gereken ekipler " +
    "için planlar.",

  hero: {
    eyebrow: null,
    head: "",
    headTinted: "Yapay zeka araması",
    headTail: "çağı için fiyatlandırma.",
    lead:
      "Yapay zeka motorlarının neyi yanıtladığını tahmin etmeyi bırakın. " +
      "Görünürlüğü ele geçirmek ve kaynak gösterilmek için gereken tam " +
      "soruları ortaya çıkarın.",
  },

  billing: {
    monthly: "Aylık",
    annually: "Yıllık",
    save: "%20 tasarruf",
    billedMonthly: "Aylık faturalandırılır",
    billedAnnually: "Yıllık faturalandırılır",
    plusTax: "+ Vergi",
  },

  plans: [
    {
      name: "Starter",
      desc:
        "Yapay zeka aramasında görünürlük kurmaya başlayan içerik " +
        "üreticileri ve küçük ekipler için.",
      priceMonthly: "$9.99",
      priceAnnual: "$7.99",
      per: "/ay",
      cta: "7 Günlük Denemeyi Başlat",
      badge: null,
      featuresHeading: "En iyi başlangıç planı",
      features: [
        "Ayda 100 kredi",
        "Sınırsız kullanıcı",
        "Tüm bölgeler",
        "Tüm diller",
        "PNG görsel dışa aktarma",
        "24 saatlik arama geçmişi",
      ],
    },
    {
      name: "Lite",
      desc:
        "Yapay zeka aramasındaki otoritesini büyüten SEO uzmanları için.",
      priceMonthly: "$19.99",
      priceAnnual: "$15.99",
      per: "/ay",
      cta: "Lite'a Geç",
      badge: "En Popüler",
      featuresHeading: "En çok tercih edilen",
      features: [
        "Ayda 300 kredi",
        "Sınırsız kullanıcı",
        "Tüm bölgeler",
        "Tüm diller",
        "PNG görsel dışa aktarma",
        "1 aylık arama geçmişi",
        "Derin arama",
        "CSV veri dışa aktarma",
      ],
    },
    {
      name: "Pro",
      desc:
        "Yüksek hacimli ekipler ve beyaz etiket isteyen ajanslar için.",
      priceMonthly: "$39.99",
      priceAnnual: "$31.99",
      per: "/ay",
      cta: "Pro'ya Geç",
      badge: null,
      featuresHeading: "Fiyat performans şampiyonu",
      features: [
        "Ayda 1.000 kredi",
        "Sınırsız kullanıcı",
        "Tüm bölgeler",
        "Tüm diller",
        "PNG görsel dışa aktarma",
        "1 yıllık arama geçmişi",
        "Derin arama",
        "CSV veri dışa aktarma",
        "Toplu aramalar",
        "API erişimi",
        "Kullandıkça öde kredileri",
        "MCP sunucusu",
      ],
    },
  ],

  compare: {
    heading: "Plan özelliklerini karşılaştırın",
    featureColumn: "Özellikler",
    groupHeading: "Plan özellikleri",
    rows: [
      { label: "Aylık kredi", values: ["100", "300", "1.000"] },
      { label: "Sınırsız kullanıcı", values: [true, true, true] },
      { label: "Tüm bölgeler", values: [true, true, true] },
      { label: "Tüm diller", values: [true, true, true] },
      { label: "PNG görsel dışa aktarma", values: [true, true, true] },
      { label: "Arama geçmişi", values: ["24 saat", "1 ay", "1 yıl"] },
      { label: "Derin arama", values: [false, true, true] },
      { label: "CSV veri dışa aktarma", values: [false, true, true] },
      { label: "Toplu aramalar", values: [false, false, true] },
      { label: "API erişimi", values: [false, false, true] },
      { label: "Kullandıkça öde kredileri", values: [false, false, true] },
      { label: "MCP sunucusu", values: [false, false, true] },
    ],
  },

  faq: {
    heading: "Sık sorulan sorular",
    items: [
      {
        title: "Bir sorgu neyi kapsıyor?",
        desc:
          "Bir kredi bir aramadır. Bir anahtar kelimeyi soru ağacına " +
          "açmak, kaç soru dönerse dönsün tek kredi tutar. Bir soruyu " +
          "gerçekte kimin yanıtladığını denetlemek ayrı fiyatlandırılır, " +
          "çünkü her denetim kendi isteğidir.",
      },
      {
        title: "Planımı sonradan değiştirebilir miyim?",
        desc:
          "Evet, istediğiniz zaman. Üst plana geçiş hemen yürürlüğe girer; " +
          "alt plana geçiş, bedelini zaten ödediğiniz dönemin sonunda " +
          "yürürlüğe girer. Satın aldığınız krediler sizde kalır.",
      },
      {
        title: "API erişimi nasıl çalışıyor?",
        desc:
          "Pro planı API erişimi ve bir MCP sunucusu içerir; böylece kendi " +
          "araçlarınız ve asistanlarınız aramaları bu arayüz üzerinden " +
          "değil, doğrudan çalıştırıp sonuçları okuyabilir.",
      },
      {
        title: "Kurumsal özel fiyatlandırma sunuyor musunuz?",
        desc:
          "Evet. Daha yüksek hacim, beyaz etiketli raporlar ya da birden " +
          "çok çalışma alanı gerekiyorsa bize yazın; gerçekte kullandığınız " +
          "hacme göre bir plan hazırlayalım.",
      },
    ],
  },

  cta: {
    heading: "Yanıtları ortaya çıkarmaya hazır mısınız?",
    lead:
      "Stratejisini yapay zeka arama niyetiyle hizalamak için AnswerGap " +
      "kullanan önde gelen içerik ekiplerine katılın.",
    primary: "7 günlük ücretsiz denemenizi başlatın",
    secondary: "Satışla İletişime Geçin",
  },
};
