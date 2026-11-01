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
  description: "Kurucuların, ajansların, SEO ve içerik ekiplerinin GetTopQuestions ile insanların sorduğu soruları keşfedip faydalı içerik planlama yolları.",
  hero: {
    eyebrow: "Sırada ne yazılacağına karar veren herkes için",
    head: "Tek terim. Birçok ekip.",
    headTinted: "Daha iyi sorular.",
    headTail: "",
    lead: "GetTopQuestions, ekiplerin bir terim etrafında insanların sorduğu soruları keşfetmesine ve bunları klasik arama, Google AI Overview ve sohbet tabanlı yapay zekâ araması için faydalı içeriklere dönüştürmesine yardımcı olur."
  },
  heroPrimary: "Ücretsiz başlayın",
  heroSecondary: "Fiyatları görün",
  teams: {
    eyebrow: "Ekibe göre çözümler",
    heading: "Çalışma şeklinize göre tasarlandı.",
    lead: "Her kart örnek bir terimi, bu terimin ortaya çıkarabileceği bir soruyu ve bir ekibin bundan üretebileceği içerik türünü gösterir. Örnekleri biz yazdık, uygulama çıktısı değildir.",
    questionLabel: "Örnek soru",
    ideaLabel: "İçerik fikri",
    cards: [
      {
        title: "SaaS kurucuları",
        desc: "Alıcıların kaydolmadan önce sorduğu soruları öğrenin ve sitenizde onların kelimeleriyle cevaplayın.",
        term: "çalışan oryantasyon yazılımı",
        question: "Uzaktan çalışanlar için oryantasyon kontrol listesinde neler olmalı?",
        idea: "Ürününüzden yalnızca gerçekten işe yaradığı yerde bahseden pratik bir kontrol listesi sayfası."
      },
      {
        title: "Girişimler",
        desc: "Kategorinizde erken dönemde faydalı içerik oluşturun, yeni kitleler net cevapları sizden bulsun.",
        term: "karbon muhasebesi",
        question: "Küçük şirketlerin emisyon raporlaması gerekir mi?",
        idea: "Duruma göre net bir \"değişir\" bölümü içeren, sade dilli bir açıklama yazısı."
      },
      {
        title: "Pazarlama ajansları",
        desc: "Soru araştırmasını müşteri başlangıç toplantılarına taşıyın, gerçek merakı temel alan içerik önerilerine dönüştürün.",
        term: "ev tipi güneş paneli",
        question: "Güneş panelleri kendini kaç yılda amorti eder?",
        idea: "Müşteriye hazır bir brief: bir rehber, üç SSS cevabı, kısa bir video senaryosu."
      },
      {
        title: "SEO ekipleri",
        desc: "Anahtar kelime çalışmanıza soru araştırmasını ekleyin, bir konuyu arama ve yapay zekâ cevapları için baştan sona kapsayan sayfalar planlayın.",
        term: "konut kredisi yapılandırma",
        question: "Küçük bir faiz düşüşü için kredi yapılandırmaya değer mi?",
        idea: "Mevcut bir sayfayı soru odaklı alt başlıklar ve doğrudan cevaplarla yeniden düzenleyin."
      },
      {
        title: "İçerik ekipleri",
        desc: "Editoryal planınızı okurlarınızın gerçekten sorduğu sorularla doldurun, hangisinin ayrı bir içeriği hak ettiğine karar verin.",
        term: "ev bitkisi bakımı",
        question: "Monstera yapraklarım neden sararıyor?",
        idea: "Bir sorun giderme rehberi ve sosyal medya için kısa cevap serisi."
      },
      {
        title: "E-ticaret",
        desc: "Müşterilerin karar vermesine yardım etmek için satın alma öncesi soruları ürün, kategori ve rehber sayfalarında cevaplayın.",
        term: "döküm tava",
        question: "Döküm tavada sabun kullanılır mı?",
        idea: "Ürün sayfasında bakım bölümü ve daha uzun bir alıştırma rehberi."
      },
      {
        title: "Kurum içi pazarlama",
        desc: "Marka, içerik ve arama ekiplerinize üzerinde çalışacakları ortak bir müşteri soruları listesi verin.",
        term: "iş seyahati sigortası",
        question: "Seyahat sigortası iptal edilen konferansları karşılar mı?",
        idea: "Blog, yardım merkezi ve satış ekibinin birlikte kullandığı ortak bir SSS kütüphanesi."
      },
      {
        title: "Kurumsal markalar",
        desc: "Soruların pazardan pazara nasıl değiştiğini görmek için konuları bölgeler ve diller arasında araştırın.",
        term: "ısı pompası",
        question: "Isı pompaları çok soğuk kışlarda çalışır mı?",
        idea: "Bölgesel uzmanların gözden geçirdiği, pazara özel yerelleştirilmiş cevaplar."
      },
      {
        title: "Yayıncılar ve medya",
        desc: "Okurların bir haber etrafında sormaya devam ettiği soruları bulun, faydalı ve açıklayıcı içerikler oluşturun.",
        term: "dört günlük çalışma haftası",
        question: "Dört günlük çalışma haftası maaşı düşürür mü?",
        idea: "Bir haberin açıkta bıraktığı takip sorularını cevaplayan bir açıklama yazısı."
      }
    ]
  },
  advantage: {
    eyebrow: "Ortak bir avantaj",
    heading: "Sorulardan faydalı içeriğe geçin.",
    cards: [
      {
        title: "Gerçek soruları keşfedin",
        desc: "Tek bir terimi, insanların öğrenirken, karşılaştırırken ve karar verirken en çok sorduğu ilgili sorulara dönüştürün.",
        bullets: [
          "Soruları niyete göre okuyun",
          "Gözden kaçan alt konuları fark edin",
          "Bölgeler ve diller arasında araştırın"
        ]
      },
      {
        title: "İçerik boşluklarını bulun",
        desc: "Soruları daha önce yayınladıklarınızla karşılaştırın ve uzmanlığınızın nerede işe yarayacağını görün.",
        bullets: [
          "İyi cevaplayabileceğiniz soruları seçin",
          "SSS'si eksik sayfaları fark edin",
          "Neyin ayrı bir içeriği hak ettiğine karar verin"
        ]
      },
      {
        title: "Güvenle üretin",
        desc: "Yazarlara ürettikleri her sayfa, video veya yazı için soru odaklı bir başlangıç noktası verin.",
        bullets: [
          "Bağlantılı içerikleri elle planlayın",
          "Desteklenen planlarda soruları dışa aktarın",
          "Yazıyı kendi sesinizle yazın"
        ]
      }
    ]
  },
  workflow: {
    heading: "Değişen arama dünyası için basit bir iş akışı.",
    lead: "Tek başına çalışan üreticilerden büyük arama ekiplerine kadar herkese aynı basit başlangıç noktasını verin: insanlar ne soruyor?",
    steps: [
      {
        title: "Bir konu girin",
        desc: "Bir ürün, kategori, müşteri sorunu veya stratejik bir anahtar kelimeyle başlayın."
      },
      {
        title: "Soruları haritalayın",
        desc: "GetTopQuestions teriminizin etrafında en çok sorulan ilgili soruları ortaya çıkarır."
      },
      {
        title: "Fırsatı değerlendirin",
        desc: "En iyi cevaplayabileceğiniz soruları seçin ve kendi sesinizle faydalı içerikler üretin."
      }
    ]
  },
  cta: {
    head: "Kitlenizin zaten sorduğu soruları bulun.",
    lead: "Bir terimle başlayın, sırada ne yazacağınızı net olarak bilerek çıkın.",
    primary: "Ücretsiz başlayın",
    secondary: "Bize ulaşın"
  }
};
