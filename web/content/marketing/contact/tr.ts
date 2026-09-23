import type { ContactContent } from "./index";

/**
 * İletişim sayfası - İngilizce sürümün çevirisi.
 *
 * `en.ts` ile alan alana örtüşmek zorundadır; tip bunu derleme hatasına
 * çevirir. `form.privacy` bir vaattir: form adı, adresi ve mesajı API'ye
 * gönderir, API bunları destek kutusuna e-postalar ve hiçbir şey saklamaz.
 * Bu doğru olmaktan çıkarsa değişmesi gereken ilk satır odur.
 */
export const tr: ContactContent = {
  title: "İletişim",
  description:
    "Kurumsal hacim, API erişimi ya da yapay zeka arama görünürlüğüyle " +
    "ilgili her konu için AnswerGap ekibiyle konuşun.",

  hero: {
    eyebrow: "Bize Ulaşın",
    head: "",
    headTinted: "Yapay zeka görünürlüğünüzü",
    headTail: "birlikte şekillendirelim.",
    lead:
      "Kurumsal ölçeği araştırıyor, API'miz için teknik yol gösterme " +
      "arıyor ya da üretken arama hakkında stratejik bir soru soruyor " +
      "olun, ekibimiz yardıma hazır.",
  },

  reasons: [
    {
      title: "Kurumsal Çözümler",
      desc:
        "Büyük markalar için özel veri hacmi, öncelikli destek ve size " +
        "göre kurgulanmış strateji.",
    },
    {
      title: "Teknik Destek",
      desc:
        "Bulgularımızı mevcut SEO panolarınıza ve iş akışlarınıza " +
        "bağlarken yardım alın.",
    },
    {
      title: "Stratejik Ortaklıklar",
      desc:
        "Üretken motorlarda marka keşfinin geleceğini birlikte " +
        "haritalandıralım.",
    },
  ],

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
    privacy:
      "Buraya yazdıklarınızı yalnızca size yanıt vermek için kullanırız, " +
      "başka hiçbir şey için değil. Destek kutumuza e-postalanır ve bu " +
      "sitede saklanmaz.",
  },
};
