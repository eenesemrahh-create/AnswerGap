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
      "Kitlenizin ne bilmek istediğini tahmin etmeyi bırakın. İnsanların sorduğu soruları keşfedin; arama, AI Overview ve sohbet tabanlı yapay zekâ için içerik planlayın.",
  },

  billing: {
    monthly: "Aylık",
    annually: "Yıllık",
    save: "%20 tasarruf",
    billedMonthly: "Aylık faturalandırılır",
    billedAnnually: "Yıllık faturalandırılır",
    plusTax: "+ Vergi",
    signUpNow: "Hemen kaydolun",
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
        "Sınırsız arama geçmişi",
        "Derin arama",
        "CSV veri dışa aktarma",
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
        "Sınırsız arama geçmişi",
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
        "Sınırsız arama geçmişi",
        "Derin arama",
        "CSV veri dışa aktarma",
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
      { label: "Sınırsız arama geçmişi", values: [true, true, true] },
      { label: "Derin arama", values: [true, true, true] },
      { label: "CSV veri dışa aktarma", values: [true, true, true] },
    ],
  },

  guide: {
    eyebrow: "Plan seçimi",
    title: "Hangi plan çalışma şeklinize uyuyor?",
    lead: "Her plan sınırsız kullanıcı, tüm bölgeler ve tüm dilleri içerir. Farklar kredilerde, geçmişin ne kadar saklandığında ve soruları GetTopQuestions'tan nasıl dışarı aldığınızdadır.",
    cards: [
      {
        name: "Starter",
        choose: "Şu durumda Starter'ı seçin:",
        points: [
          "her hafta birkaç terim araştırıyorsanız, ayda en fazla 100 kredi",
          "geçmiş 24 saat saklandığı için sonuçlara aynı gün uyguluyorsanız",
          "bulguları tablo yerine PNG görsel olarak paylaşıyorsanız"
        ],
        next: "Geçen haftanın aramalarına dönmek veya sonuçları tabloda açmak istediğinizde Lite'ı düşünün."
      },
      {
        name: "Lite",
        choose: "Şu durumda Lite'ı seçin:",
        points: [
          "düzenli içerik planlıyor ve ayda 300 krediye kadar ihtiyaç duyuyorsanız",
          "1 aylık geçmişle araştırmanıza birkaç hafta boyunca dönüyorsanız",
          "soruları bir plana ayırmak için derin arama ve CSV dışa aktarma istiyorsanız"
        ],
        next: "Aynı anda çok sayıda terim araştırdığınızda veya sonuçları kendi araçlarınızda görmek istediğinizde Pro'yu düşünün."
      },
      {
        name: "Pro",
        choose: "Şu durumda Pro'yu seçin:",
        points: [
          "birkaç müşteri veya site için araştırma yapıyorsanız, ayda 1.000 krediye kadar",
          "toplu arama, API erişimi veya MCP sunucusuna ihtiyaç duyuyorsanız",
          "bir yıllık arama geçmişi veya kullandıkça öde kredileri istiyorsanız"
        ],
        next: "API erişimi, toplu aramalar ve MCP sunucusu yalnızca Pro'da vardır."
      }
    ],
    estimateLabel: "Kredi tahmini:",
    estimate: "krediler arama yaptığınızda kullanılır. Seçim yapmanın basit bir yolu, tipik bir ayda tüm site veya müşterileriniz için araştırmayı beklediğiniz terimleri listelemek ve bunu her planın aylık kredisiyle karşılaştırmaktır. Emin değilseniz küçük başlayıp sonra yükseltmek makul bir yaklaşımdır."
  },

  faq: {
    heading: "Sık sorulan sorular",
    items: [
      {
        title: "Krediler ne için kullanılır?",
        desc: "Krediler arama yapmak için kullanılır. Her plan aylık bir kota içerir: Starter'da 100, Lite'ta 300, Pro'da 1.000. Belirli bir aramanın kredileri nasıl kullandığıyla ilgili ayrıntılar için bize ulaşın."
      },
      {
        title: "Planımı sonradan değiştirebilir miyim?",
        desc: "Evet, aboneliğinizi değiştirebilir veya iptal edebilirsiniz. Bir değişikliğin faturanıza nasıl yansıyacağıyla ilgili sorularınız varsa geçiş yapmadan önce bize ulaşın."
      },
      {
        title: "Hangi planda API erişimi var?",
        desc: "API erişimi yalnızca Pro planında; toplu aramalar, kullandıkça öde kredileri ve MCP sunucusuyla birlikte sunulur. Soru araştırmasını kendi araçlarınıza ve iş akışlarınıza taşımanızı sağlar."
      },
      {
        title: "İhtiyaçlarım Pro planını aşarsa ne olur?",
        desc: "İletişim sayfasından bize ulaşın ve neye ihtiyacınız olduğunu anlatın. Neyin mümkün olduğunu size dürüstçe söyleriz."
      },
      {
        title: "Herhangi bir plan sıralamaları veya yapay zekâ atıflarını takip ediyor mu?",
        desc: "Hayır. GetTopQuestions bir soru araştırma aracıdır. Faydalı içerikler üretebilmeniz için insanların sorduğu soruları keşfetmenize yardım eder. Sıralama takibi, marka izleme veya arama hacmi raporlaması yapmaz."
      }
    ],
  },

  cta: {
    heading: "Yanıtları ortaya çıkarmaya hazır mısınız?",
    lead:
      "Bir terimle başlayın, insanların sorduğu soruları bulun ve sırada ne yazacağınıza karar verin.",
    primary: "7 günlük ücretsiz denemenizi başlatın",
    secondary: "Satışla İletişime Geçin",
  },
};
