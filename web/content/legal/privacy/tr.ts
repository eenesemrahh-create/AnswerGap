import type { PrivacyContent } from "./index";

/** Gizlilik Politikası - İngilizce sürümün çevirisi. Bağlayıcı metin İngilizcedir. */
export const tr: PrivacyContent = {
  title: "Gizlilik Politikası",
  description:
    "AnswerGap neyi topluyor, başka kimlere gidiyor, diğer müşterilerden ne gizli kalıyor ve hesabınızı sildiğinizde ne kalıyor.",
  lead: "Neyi neden topladığımızı, bir başkasından duymak isteyeceğimiz açıklıkta anlatıyoruz. 5. madde diğer müşterilerin neyi görüp göremediğini, 7. madde hesap silmenin neyi sildiğini ve neyi silmediğini anlatır.",
  effective: "2026-09-20",

  sections: {
    scope: {
      heading: "1. Bu politika kimi kapsıyor",
      body: [
        {
          p: "Bu politika, Amerika Birleşik Devletleri'nde {company} tarafından işletilen {site} adresindeki AnswerGap'i kapsar. Burada anlatılan verinin nasıl ve neden işlendiğine {company} karar verir.",
        },
        {
          p: "Bu politika birkaç dilde yayımlanır. Bağlayıcı sürüm İngilizcedir; bir çeviri İngilizce metinle çelişirse İngilizce metin geçerlidir.",
        },
      ],
    },

    collect: {
      heading: "2. Neyi topluyoruz",
      body: [
        { p: "Hesap oluşturursanız:" },
        {
          ul: [
            "E-posta adresiniz — kayıt sırasında yazdığınız ya da Google ile giriş yaparsanız Google'ın verdiği adres.",
            "Verirseniz adınız, ya da Google profilinizdeki ad. Bu isteğe bağlıdır.",
            "Google ile giriş yaparsanız Google profil fotoğrafınızın bağlantısı. Görüntünün kopyasını değil, bağlantıyı saklarız.",
            "E-postayla kaydolduysanız parolanızın özeti. Parolanın kendisini asla saklamayız.",
            "Hesabınızın durumu ve oluşturulma, son görülme ve doğrulanma tarihleri.",
          ],
        },
        { p: "Hizmeti kullandıkça:" },
        {
          ul: [
            "Aradığınız anahtar kelimeler ve sorular. Bunlar hesabınıza, çıkış yapmışsanız tarayıcınızda tutulan rastgele bir tanımlayıcıya bağlı olarak saklanır.",
            "Hangi soruları kontrol etmemizi istediğiniz ve onlar için çektiğimiz arama sonuçları.",
            "Hesabınıza eklenen ve hesabınızdan harcanan her kredinin ve gerekçesinin kaydı.",
            "Kullanım kayıtları: ne yapıldığı, başarılı olup olmadığı ya da reddedilip reddedilmediği, kaç kredi harcandığı ve bize neye mal olduğu.",
          ],
        },
        {
          p: "IP adresinizi saklamıyoruz. Adresin tuzlanmış ve kısaltılmış bir kriptografik özetini üretip yalnızca onu saklıyoruz; böylece günlük ücretsiz aramayı sayabiliyor ve kötüye kullanımı durdurabiliyoruz. Adresin kendisi yalnızca istek işlendiği an var olur ve hiçbir yere yazılmaz; özet, değiştirebileceğimiz gizli bir tuzla üretildiği için saklanan değerler istendiğinde anlamsızlaştırılabilir. Barındırma sağlayıcımız kendi bağlantı günlüklerini tutar ve bunlar bizim denetimimizde değildir.",
        },
      ],
    },

    storage: {
      heading: "3. Çerezler ve tarayıcınızda kalanlar",
      body: [
        {
          p: "AnswerGap web sitesi hiç çerez kullanmıyor. Hiçbir analiz aracı, etiket yöneticisi ya da üçüncü taraf betiği yok. Yazı tipleri başkasından çekilmek yerine kendi alan adımızdan sunuluyor.",
        },
        {
          p: "Tarayıcınız cihazınızda birkaç değeri yerel olarak tutar; bunları uzaktan okuyamayız:",
        },
        {
          ul: [
            "Oturumunuz, on dört gün boyunca. Çıkış yapmak onu siler.",
            "Çıkış yapmış ziyaretçiler için günlük ücretsiz aramayı sayan rastgele bir tanımlayıcı.",
            "Açık ya da koyu tema tercihiniz.",
            "Arayüz diliniz.",
            "Ülke ve dil arama tercihiniz.",
            "Kaynak gösterilip gösterilmediğinizi kontrol etmek için yazdıysanız kendi web sitenizin adresi. Bu, bize hiç ulaşmaz — karşılaştırma tarayıcınızın içinde yapılır.",
          ],
        },
        {
          p: "Şirket içi yönetim aracımız tek bir oturum çerezi kullanır. Müşteriler onunla hiç karşılaşmaz.",
        },
      ],
    },

    processors: {
      heading: "4. Veri başka kimlere gidiyor",
      body: [
        { p: "Az sayıda sağlayıcı kullanıyoruz ve her birine yalnızca ihtiyaç duyduğu kadarını gönderiyoruz:" },
        {
          ul: [
            "Arama verisi sağlayıcımız, aradığınız anahtar kelime ya da soru metnini alır. E-posta adresinizi, IP adresinizi veya herhangi bir hesap tanımlayıcısını almaz.",
            "Anlamsal eşleştirme sağlayıcımız, bu özellik etkinken soru metnini ve arama sonuçlarının başlık ile adreslerini alır. Hiçbir tanımlayıcı almaz.",
            "E-posta sağlayıcımız, doğrulama ve parola sıfırlama postası iletilebilsin diye adresinizi ve mesajı alır.",
            "Ödeme sağlayıcımız, kendi barındırdığı ödeme sayfasına girdiklerinizi alır.",
            "Google, yalnızca Google ile giriş yapmayı seçerseniz ve yalnızca giriş alışverişi kadarını alır.",
            "Barındırma sağlayıcımız hizmeti çalıştırır; posta kutusu sağlayıcımız destek adresine yazdıklarınızı tutar.",
          ],
        },
        {
          p: "Kart numaraları bize hiç ulaşmaz. Ödeme sayfasını ödeme sağlayıcısı barındırır; biz yalnızca onun geri gönderdiği ödeme kaydını tutarız.",
        },
        {
          p: "Verinizi satmıyoruz ve reklam amacıyla paylaşmıyoruz.",
        },
      ],
    },

    sharing: {
      heading: "5. Diğer müşterilerden ne gizli — ve ne değil",
      body: [
        {
          p: "Bu, içini rahatlatan bir cevabı değil, dürüst bir cevabı hak ediyor; çünkü tasarım bilinçli.",
        },
        {
          ul: [
            "Arama listeniz size özeldir. Başka bir müşteri hangi kelimeleri arattığınızı göremez ve kayıtlı analizlerinizi açamaz. Size ait olmayan bir analiz istendiğinde “izin yok” değil “bulunamadı” döner; çünkü bir aramanın var olması bile başlı başına bilgidir.",
            "Soru verisi ortaktır. Sorular, skorları, önbelleğe alınmış arama sonuçları ve boşluk kararları hesap başına özel bir kopyada değil, herkesin paylaştığı tek bir havuzda durur. Siz ve başka bir müşteri aynı kelimeyi ararsanız aynı ağacı görürsünüz ve ikinci arama hiçbir şeye mal olmaz; çünkü bedelini ilki ödemiştir. Hizmeti uygun fiyatlı tutan şey budur.",
            "“Bu gerçekten bir boşluk mu?” düğmeleriyle verdiğiniz kararlar hesabınıza bağlanmadan saklanır ve skorlamanın nasıl çalıştığını iyileştirmek için kullanılır.",
            "Çıkış yapmışsanız kendi analizlerinize erişiminiz tarayıcınızdaki rastgele tanımlayıcıya dayanır. Bu onları yabancılardan uzak tutar ama kriptografik bir koruma değildir — tarayıcı deponuzu temizlerseniz erişiminizi kaybedersiniz.",
          ],
        },
      ],
    },

    why: {
      heading: "6. Bunu tutmamızın dayanağı",
      body: [
        {
          p: "İstediğiniz hizmeti sunmak, hesapları ve faturalandırmayı işletmek, her isteği bize paraya mal olan bir hizmetin kötüye kullanılmasını önlemek ve skorlamamızın doğruluğunu artırmak için.",
        },
        {
          p: "Rızanıza dayandığımız yerlerde, hesabınızı kapatarak rızanızı geri çekebilirsiniz.",
        },
      ],
    },

    deletion: {
      heading: "7. Hesabınızı silmek — ve neyi saklıyoruz",
      body: [
        {
          p: "Hesabınızı hesap ayarlarınızdan kendiniz silebilir ya da {email} adresinden bizden silmemizi isteyebilirsiniz. Silme işlemi adınızı, profil fotoğrafınızı, parolanızı, kayıtlı tercihlerinizi ve sizinle yaptığınız aramalar arasındaki bağı kaldırır.",
        },
        {
          p: "İki şey bilinçli olarak saklanır; varsaymanıza bırakmaktansa size söylemeyi tercih ederiz:",
        },
        {
          ul: [
            "E-posta adresiniz — geri döndüğünüzde hesabı tanıyıp ödemesini yaptığınız kredi bakiyesini iade edebilelim diye.",
            "Ödeme kayıtlarınız — tutarlar, tarihler ve para birimi — vergi ve muhasebe kuralları bunları saklamamızı gerektirdiği için.",
          ],
        },
        {
          p: "E-posta adresinizin de silinmesini isterseniz {email} adresine yazıp bunu belirtin, silelim. Ondan sonra sizi tanımamızın hiçbir yolu kalmaz, dolayısıyla geçmiş bir kredi bakiyesi iade edilemez.",
        },
        {
          p: "Arattığınız sorular 5. maddede anlatılan ortak havuzda kalır; çünkü silme işleminden sonra artık size bağlı olarak saklanmazlar.",
        },
      ],
    },

    rights: {
      heading: "8. Seçimleriniz",
      body: [
        {
          p: "Hakkınızda tuttuğumuz verinin bir kopyasını almak, düzeltmek ya da kullanımına itiraz etmek için {email} adresine yazın. 30 gün içinde yanıtlıyoruz.",
        },
        {
          p: "Yaşadığınız yere göre bir veri koruma otoritesine şikâyette bulunma hakkınız da olabilir. Önce bize gelmenizi tercih ederiz ama yol sizindir.",
        },
      ],
    },

    children: {
      heading: "9. Çocuklar",
      body: [
        {
          p: "AnswerGap 16 yaşından küçükler için tasarlanmamıştır ve bilerek onların verisini toplamayız. Bir çocuğun hesap açtığını düşünüyorsanız {email} adresine yazın, kaldıralım.",
        },
      ],
    },

    transfers: {
      heading: "10. Veri nerede tutuluyor",
      body: [
        {
          p: "Amerika Birleşik Devletleri'nden çalışıyoruz ve sağlayıcılarımız Amerika Birleşik Devletleri ile Avrupa Birliği'nde faaliyet gösteriyor. Hizmeti kullanmanız, verinizin her ikisinde de işlenebileceği anlamına gelir.",
        },
      ],
    },

    changes: {
      heading: "11. Bu politikadaki değişiklikler",
      body: [
        {
          p: "Değişiklikleri bu sayfada yayımlar ve başındaki tarihi güncelleriz. Bir değişiklik sizi esaslı biçimde etkiliyorsa, fark etmenizi beklemek yerine hesap sahiplerine e-postayla haber veririz.",
        },
        { p: "Bunlarla ilgili sorularınız için:" },
        {
          link: { text: "{email}", href: "mailto:{email}" },
        },
      ],
    },
  },
};
