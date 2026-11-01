import type { ContactContent } from "./index";

/**
 * İletişim sayfası - İngilizce sürümün çevirisi. `en.ts` ile alan alana
 * örtüşmek zorundadır; tip bunu derleme hatasına çevirir.
 */
export const tr: ContactContent = {
  title: "İletişim",
  description:
    "Planlar, kurulum veya soru araştırmasını içeriğe dönüştürmekle ilgili sorularınız mı var? GetTopQuestions ekibine yazın.",

  hero: {
    eyebrow: "Bize Ulaşın",
    head: "",
    headTinted: "GetTopQuestions",
    headTail: "hakkında sorunuz mu var? Bize sorun.",
    lead: "İster plan seçiyor, ister Pro API'yi bağlıyor, ister soru araştırmasını içeriğe nasıl dönüştüreceğinizi düşünüyor olun, bize yazın."
  },

  reasons: [
    {
      title: "Büyük Ekipler",
      desc: "Kaç terim, site veya müşteri için araştırma yaptığınızı anlatın, size neyin uyduğunu birlikte konuşalım."
    },
    {
      title: "Teknik Destek",
      desc: "Hesabınız, dışa aktarmalar ve Pro plandaki API veya MCP kurulumu için yardım."
    },
    {
      title: "İş Birlikleri ve Geri Bildirim",
      desc: "Fikirler, iş birliği önerileri veya soru araştırmasının işinize nasıl uyduğuna dair geri bildirimler."
    }
  ],

  before: {
    heading: "Yazmadan önce",
    intro: "Birkaç ayrıntı eklemeniz, ilk seferde faydalı bir cevap vermemize yardımcı olur:",
    items: [
      "Araştırdığınız terimler veya konular",
      "Kullandığınız ya da düşündüğünüz plan",
      "API, toplu arama veya MCP soruları için: neye bağlamak istediğiniz",
      "Fatura veya hesap soruları için: kaydolduğunuz e-posta adresi"
    ],
    pricingLead: "Planları mı karşılaştırıyorsunuz? ",
    pricingLink: "Fiyatlandırma sayfası",
    pricingTail: " her özelliği plana göre listeler.",
    solutionsLead: " Diğer ekiplerin soru araştırmasını nasıl kullandığını merak mı ediyorsunuz? ",
    solutionsLink: "Çözümler",
    solutionsTail: " sayfasına bakın."
  },

  form: {
    name: "Ad Soyad",
    namePlaceholder: "Ayşe Yılmaz",
    email: "E-posta Adresi",
    emailPlaceholder: "ayse@ornek.com",
    company: "Şirket (İsteğe bağlı)",
    companyPlaceholder: "Örnek A.Ş.",
    subject: "Konu",
    subjectPlaceholder: "Nasıl yardımcı olabiliriz?",
    message: "Mesaj",
    messagePlaceholder: "İhtiyacınızdan kısaca söz edin...",
    submit: "Mesajı Gönder",
    sending: "Gönderiliyor…",
    sent: "Teşekkürler - mesajınız yola çıktı.",
    sentDetail: "Her mesajı okuyoruz ve genellikle iki iş günü içinde yanıtlıyoruz.",
    failed: "Bu gönderilemedi. Lütfen tekrar deneyin ya da doğrudan bize e-posta atın.",
    tooMany: "Tek bir yerden gelen mesaj sayısı fazla. Lütfen daha sonra tekrar deneyin.",
  },
};
