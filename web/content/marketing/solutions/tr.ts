import type { SolutionsContent } from "./index";

/**
 * Çözümler sayfası - İngilizce sürümün çevirisi.
 *
 * `en.ts` ile kart karta örtüşmek zorundadır; dokuz ekip kartı dokuz, üç
 * avantaj kartı üç, her kartın üç maddesi üç ve üç iş akışı adımı üç kalır -
 * tip bunu derleme hatasına çevirir.
 *
 * AVANTAJ MADDELERİNİN HEPSİ HENÜZ DOĞRU DEĞİL; `en.ts` ile aynı durumda
 * oldukları için aynı söz veriliyor: "Soruları amaca göre inceleyin" niyet
 * sınıflandırıcısını, "Verileri kendi iş akışınıza aktarın" CSV dışa
 * aktarmayı, "İlerlemeyi zaman içinde ölçün" ise kimsenin tutmadığı bir
 * geçmişi bekliyor. İş akışı adımları ve kapanış çağrısı ürünün bugün
 * yaptığı şeyi anlatır.
 */
export const tr: SolutionsContent = {
  title: "Çözümler",
  description:
    "SEO ekipleri, ajanslar, yayıncılar ve markalar yapay zeka aramasının " +
    "henüz yanıtlamadığı soruları bulmak için AnswerGap'i nasıl kullanıyor?",

  hero: {
    eyebrow: "Yapay zeka keşfini şekillendiren her ekip için",
    head: "Tek platform.",
    headTinted: "Yapay zeka aramasında",
    headTail: "kazanmak için daha çok yol.",
    lead:
      "AnswerGap, ekiplerin insanların ne sorduğunu, yapay zeka " +
      "yanıtlarının nerede yetersiz kaldığını ve yapay zekanın önerdiği " +
      "kaynak olmak için ne üretmeleri gerektiğini anlamasına yardım eder.",
  },
  heroPrimary: "Ücretsiz başlayın",
  heroSecondary: "Fiyatlandırmayı görün",

  teams: {
    eyebrow: "Ekibe göre çözümler",
    heading: "Çalışma biçiminize göre kurulmuş.",
    lead:
      "İlk kategori aramasından küresel bir içerik programına kadar, " +
      "AnswerGap her ekibe uygulanabilir bir sonraki adım verir.",
    cards: [
      {
        title: "SaaS kurucuları",
        desc:
          "SaaS ürününüzün yapay zeka görünürlüğünü izleyin ve alıcıların " +
          "dönüşmeden önce sorduğu soruları ortaya çıkarın.",
      },
      {
        title: "Girişimler",
        desc:
          "Yapay zeka tarafından erken keşfedilin ve kategoriniz " +
          "kalabalıklaşmadan otorite kurun.",
      },
      {
        title: "Pazarlama ajansları",
        desc:
          "Her müşteri için yapay zeka görünürlüğünü raporlayın ve kaynak " +
          "gösterilme boşluklarını yeni kampanya fırsatlarına çevirin.",
      },
      {
        title: "SEO ekipleri",
        desc:
          "Geleneksel SEO raporlamasını yapay zeka yanıtlarına, kaynak " +
          "gösterimlerine ve sohbet biçimli arama talebine genişletin.",
      },
      {
        title: "İçerik ekipleri",
        desc:
          "Hangi içeriğin yapay zeka görünürlüğü getirdiğini kanıtlayın ve " +
          "yanıtlamaya en değer soruları önceliklendirin.",
      },
      {
        title: "E-ticaret",
        desc:
          "Yapay zekanın hangi markaları önerdiğini görün ve ürün keşfi " +
          "yolculukları için işe yarar içerik üretin.",
      },
      {
        title: "Şirket içi pazarlama",
        desc:
          "Marka, içerik ve arama ekiplerini ölçülebilir tek bir yapay " +
          "zeka görünürlüğü stratejisi etrafında birleştirin.",
      },
      {
        title: "Kurumsal markalar",
        desc:
          "Konuları, bölgeleri ve dilleri ölçekte izlerken portföyünüz " +
          "genelindeki boşlukları belirleyin.",
      },
      {
        title: "Yayıncılar ve medya",
        desc:
          "Yeni beliren soru kümelerini bulun ve yapay zeka sistemlerinin " +
          "kaynak gösterebileceği yetkin içerik üretin.",
      },
    ],
  },

  advantage: {
    eyebrow: "Ortak tek avantaj",
    heading: "Sorulardan ölçülebilir eyleme geçin.",
    cards: [
      {
        title: "Gerçek talebi keşfedin",
        desc:
          "Tek bir konuyu, insanların karar yolculuğu boyunca sorduğu " +
          "birbirine bağlı sorulara dönüştürün.",
        bullets: [
          "Soruları amaca göre inceleyin",
          "Gözden kaçan konu kümelerini bulun",
          "Her pazarı ve dili araştırın",
        ],
      },
      {
        title: "Görünürlük boşluklarını bulun",
        desc:
          "Mevcut yanıtların nerede zayıf, eksik ya da hiç olmadığını ve " +
          "uzmanlığınızın nerede fark yaratabileceğini görün.",
        bullets: [
          "Fırsatı yüksek soruları önceliklendirin",
          "Yanıt kapsamını anlayın",
          "Rakiplerin kör noktalarını yakalayın",
        ],
      },
      {
        title: "Güvenle üretin",
        desc:
          "İçerik ve SEO ekiplerine, ürettikleri her sayfa için net ve " +
          "kanıta dayalı bir brief verin.",
        bullets: [
          "Birbirine bağlı içerik planları kurun",
          "Verileri kendi iş akışınıza aktarın",
          "İlerlemeyi zaman içinde ölçün",
        ],
      },
    ],
  },

  workflow: {
    head: "Değişen arama dünyası için",
    headTinted: "basit bir iş akışı",
    headTail: ".",
    lead:
      "Kurucudan kurumsal arama ekibine kadar herkese, talep ve fırsat " +
      "konusunda aynı net görüntüyü verin.",
    steps: [
      {
        title: "Bir konu girin",
        desc:
          "Bir ürün, kategori, müşteri sorunu ya da stratejik anahtar " +
          "kelimeyle başlayın.",
      },
      {
        title: "Soruların haritasını çıkarın",
        desc:
          "AnswerGap ilgili aramaları ve mevcut yapay zeka yanıtlarının " +
          "içindeki boşlukları ortaya çıkarır.",
      },
      {
        title: "Fırsatı harekete çevirin",
        desc:
          "Önceliklendirin, dışa aktarın ve güvenilir kaynak olmak üzere " +
          "kurgulanmış içerik üretin.",
      },
    ],
  },

  cta: {
    head: "Hedef kitlenizin şimdiden aradığı boşlukları bulun.",
    lead:
      "Bir konuyla başlayın ve gerçek yapay zeka arama talebini odaklı bir " +
      "görünürlük stratejisine çevirin.",
    primary: "Ücretsiz başlayın",
    secondary: "Bize ulaşın",
  },
};
