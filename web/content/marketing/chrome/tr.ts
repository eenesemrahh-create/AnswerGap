import type { ChromeContent } from "./index";

/**
 * Pazarlama sayfalarının üst menüsü ve alt bilgisi - İngilizce sürümün
 * çevirisi.
 *
 * `en.ts` ile anahtar anahtara ve satır satıra örtüşmek zorundadır; tip bunu
 * derleme hatasına çevirir. Burada yalnızca gerçekten var olan sayfalara
 * giden bağlantılar listelenir; `nav.aiSeo` ve `nav.blog` henüz bir sayfaya
 * karşılık gelmediği için bağlantı değil düz metin olarak görünür.
 */
export const tr: ChromeContent = {
  nav: {
    pricing: "Fiyatlandırma",
    solutions: "Çözümler",
    aiSeo: "AI SEO",
    blog: "Blog",
    contact: "İletişim",
    signIn: "Giriş Yap",
    signUp: "Kaydol",
  },
  footer: {
    tagline:
      "Yapay zeka aramasının yanıt bekleyen sorularını bulun; markanızı " +
      "onun önerdiği güvenilir kaynak haline getirin.",
    product: "Ürün",
    resources: "Kaynaklar",
    company: "Şirket",
    links: {
      features: "Özellikler",
      solutions: "Çözümler",
      pricing: "Fiyatlandırma",
      blog: "Blog",
      about: "Hakkımızda",
      contact: "İletişim",
      privacy: "Gizlilik Politikası",
      terms: "Kullanım Koşulları",
    },
  },
};
