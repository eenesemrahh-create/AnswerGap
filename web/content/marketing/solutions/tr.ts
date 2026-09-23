import type { SolutionsContent } from "./index";

/**
 * Çözümler sayfası - İngilizce sürümün çevirisi.
 *
 * `en.ts` ile kart karta örtüşmek zorundadır; dokuz ekip kartı dokuz, üç
 * avantaj kartı üç kalır ve tip bunu derleme hatasına çevirir. Avantaj
 * kartları bilerek ölçülen şeyin diliyle yazılmıştır: "hiçbir sayfanın
 * eşiği geçemediği yer" ürünün gerçekten hesapladığı metriktir.
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
          "Her soru Google'ın kendi \"Kullanıcılar bunları da sordu\" " +
          "bloğundan gelir ve liste değil ağaç olarak açılır; böylece bir " +
          "konunun bir sonrakine nasıl dallandığını görürsünüz.",
      },
      {
        title: "Görünürlük boşluklarını bulun",
        desc:
          "Herhangi bir soru için o soruda sıralanan sayfaları çekip kaçının " +
          "soruyu gerçekten yanıtladığını sayarız. Eşiği geçen sayfanın az " +
          "olması fırsattır - ve bu ürün o sayının etrafında kurulmuştur.",
      },
      {
        title: "Güvenle üretin",
        desc:
          "Ne yazacağınıza karar vermeden önce, Google AI Overview'ın her " +
          "soru için hangi kaynakları gösterdiğini ve kendi alan adınızın " +
          "aralarında olup olmadığını görün.",
      },
    ],
  },
};
