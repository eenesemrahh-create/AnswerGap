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
      "İnsanların konunuz hakkında sorduğu soruları keşfedin, sonra onları cevaplayan faydalı içerikler üretin.",
    product: "Ürün",
    resources: "Kaynaklar",
    company: "Şirket",
    rights: "Tüm hakları saklıdır.",
    links: {
      features: "Özellikler",
      solutions: "Çözümler",
      pricing: "Fiyatlandırma",
      api: "API",
      changelog: "Değişiklik günlüğü",
      blog: "Blog",
      seoGuides: "SEO Rehberleri",
      helpCenter: "Yardım Merkezi",
      community: "Topluluk",
      about: "Hakkımızda",
      contact: "İletişim",
      privacy: "Gizlilik Politikası",
      terms: "Kullanım Koşulları",
    },
  },
};
