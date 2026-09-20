import type { TermsContent } from "./index";

/**
 * Kullanım Koşulları - İngilizce sürümün çevirisi.
 *
 * Bağlayıcı metin İngilizcedir (1. madde bunu söyler). Bu dosya, `en.ts` ile
 * madde madde ve madde işareti işaretine karşılık gelmek zorundadır; tip
 * bunu derleme hatasına çevirir.
 */
export const tr: TermsContent = {
  title: "Kullanım Koşulları",
  description:
    "AnswerGap ile aranızdaki sözleşme: hesaplar, krediler, iadeler ve boşluk skorlarının doğruluğu.",
  lead: "Bu koşullar AnswerGap kullanımınızı düzenler. Boşluk skorlarının ne olduğunu ve ne olmadığını anlatan 6. maddeyi lütfen okuyun.",
  effective: "2026-09-20",

  sections: {
    parties: {
      heading: "1. Sözleşmenin tarafı kim",
      body: [
        {
          p: "AnswerGap, Amerika Birleşik Devletleri'nde bir {state} {entity} olan {company} tarafından işletilir. Bu koşullarda “biz” ve “bize” {company} anlamına gelir; “siz”, hizmeti kullanan kişi ya da kuruluştur.",
        },
        {
          p: "Hesap oluşturarak veya hizmeti kullanarak bu koşulları kabul etmiş olursunuz. Kabul etmiyorsanız hizmeti kullanmayın.",
        },
        {
          p: "Bu koşullar birkaç dilde yayımlanır. Bağlayıcı sürüm İngilizcedir: bir çeviri İngilizce metinle çelişirse İngilizce metin geçerlidir.",
        },
      ],
    },

    service: {
      heading: "2. Hizmet ne yapar",
      body: [
        {
          p: "AnswerGap, Google'ın “Bunlar da sorulmuş” başlığı altında gösterdiği soruları bir soru ağacına açar, tek tek soruların arkasındaki arama sonuçlarına bakar ve bu soruların hangilerini hiçbir sayfanın iyi cevaplamadığını tahmin eder.",
        },
        {
          p: "Hizmet etkin biçimde geliştirilmektedir. Özellikler değişebilir; bazıları tamamlanmadan önizleme olarak sunulur.",
        },
      ],
    },

    accounts: {
      heading: "3. Hesaplar",
      body: [
        {
          p: "Çalışmanızı kaydetmek ve kredi harcamak için bir hesaba ihtiyacınız var. Kişi başına bir hesap.",
        },
        {
          ul: [
            "Sahibi olduğunuz bir e-posta adresi verin. Kredi harcayabilmeniz için adresi doğrulamanız gerekir.",
            "Giriş bilgilerinizi kendinize saklayın. Hesabınız altında olan her şeyden siz sorumlusunuz.",
            "Hesabınızı bir başkasının kullandığını düşünüyorsanız bize vakit kaybetmeden haber verin.",
          ],
        },
        {
          p: "Bu koşulları ihlal eden bir hesabı askıya alabilir ve dilediğimiz kişiye hizmet vermeyi reddedebiliriz.",
        },
      ],
    },

    credits: {
      heading: "4. Krediler, paketler ve abonelikler",
      body: [
        {
          p: "AnswerGap'teki işler kredi ile ödenir. Sizin adınıza bir arama veri sağlayıcısına ücretli bir istek yaptığımızda bir kredi harcanır.",
        },
        {
          ul: [
            "Bir arama bir krediye mal olur. Daha önce çekip önbelleğe aldığımız sonuçlar ücretsizdir — onları yeniden açmak hiçbir şeye mal olmaz.",
            "Tek bir soruyu kontrol etmek, soru keşfinden ayrı fiyatlanır; çünkü her kontrol bize ayrı bir arama isteğine mal olur.",
            "Krediler tek seferlik paketler hâlinde satılabilir ya da yinelenen bir aboneliğe dâhil edilebilir. Fiyat, kredi sayısı ve varsa abonelik süresi ödemeden önce gösterilir.",
            "Paket kredileri, hesabınız etkin olduğu sürece geçerliliğini yitirmez.",
            "Bizim tarafımızda başarısız olan bir istek ücretlendirilmez.",
          ],
        },
        {
          p: "Hizmet önizlemedeyken hiçbir şey satılmaz: krediler elle tanımlanır ve satın alınamaz. Bu madde, satış açıldığında neyin geçerli olacağını anlatır.",
        },
      ],
    },

    refunds: {
      heading: "5. İade ve iptal",
      body: [
        {
          p: "Önizleme sırasında hiçbir şey satılmadığı için henüz iade edilecek bir şey de yok. Satış açıldığında aşağıdakiler geçerli olur.",
        },
        {
          ul: [
            "Kullanılmamış paket kredileri, satın alma tarihinden itibaren 14 gün içinde iade edilebilir. Harcanmış krediler iade edilmez; çünkü o aramaların bedeli veri sağlayıcımıza ödenmiştir ve geri alınamaz.",
            "Abonelik dilediğiniz zaman iptal edilebilir. Ödemesini yaptığınız dönemin sonuna kadar devam eder; dönem artığı iade edilmez.",
            "Hizmet ödediğiniz şeyi vermezse — bizim tarafımızda hata veren bir arama ya da mükerrer bir tahsilat — bize söyleyin, düzeltelim.",
          ],
        },
        {
          p: "İade talebi için hesaptaki e-posta adresi ve ödeme tarihiyle {email} adresine yazın. Beş iş günü içinde yanıtlıyoruz.",
        },
      ],
    },

    accuracy: {
      heading: "6. Doğruluk — lütfen bu maddeyi okuyun",
      body: [
        {
          p: "Boşluk skorları birer tahmindir. Olgu değildirler ve tavsiye de değildirler.",
        },
        {
          p: "Bir boşluk skoru, bir soruyu açık arama sonuçlarının başlıkları ve adresleriyle otomatik bir yöntemle karşılaştırarak üretilir. Bu yöntem etkin biçimde geliştirilmektedir ve kayda değer bir oranda yanılması beklenir. Bunu burada söylemeyi, şu anda gösteremediğimiz bir kesinliği ima etmeye tercih ediyoruz.",
        },
        {
          ul: [
            "Gösterildiği yerde arama hacmi rakamları üçüncü bir tarafın tahminidir ve öyle etiketlenir.",
            "Sonuçlar, arama motorunun onları çektiğimiz andaki hâlini yansıtır. Her sonuç çekildiği tarihi taşır ve veriyi asla canlı diye sunmayız.",
            "Kontrol etmediğimiz bir soru boşluk olarak değil, bilinmiyor olarak gösterilir. Bilinmiyor ile cevapsız aynı şey değildir.",
            "Hizmetteki hiçbir şey herhangi bir arama sıralamasını, herhangi bir trafik miktarını veya herhangi bir ticari sonucu garanti etmez.",
          ],
        },
        {
          p: "Bu skorlara dayanarak aldığınız kararlar sizindir. Çıktıyı muhakemenin yerine geçen bir şey olarak değil, muhakemenin başlangıç noktası olarak görün.",
        },
      ],
    },

    sources: {
      heading: "7. Veri nereden geliyor",
      body: [
        {
          p: "Sonuçlar, üçüncü taraf sağlayıcılar aracılığıyla elde edilen, kamuya açık arama sonuçlarından türetilir. Bu sonuçların geldiği arama motorlarını biz denetlemiyoruz ve verinin erişilebilir, eksiksiz veya doğru olduğunu garanti edemeyiz.",
        },
        {
          p: "Bir sağlayıcı döndürdüğü şeyi değiştirirse ya da döndürmeyi bırakırsa, hizmetin bazı bölümleri değişebilir veya çalışmayı durdurabilir.",
        },
      ],
    },

    use: {
      heading: "8. Kabul edilebilir kullanım",
      body: [
        { p: "Şunları yapmayın:" },
        {
          ul: [
            "ham sonuç verisini kendi veri setinizmiş gibi yeniden satmak veya dağıtmak;",
            "elinizdeki kredileri aşacak biçimde hizmete otomatik araçlarla erişmek;",
            "kredi sınırlarını, günlük ücretsiz hakkı ya da başka bir kısıtlamayı dolanmak;",
            "hizmeti yoklamak, taramak veya aksatmak, ya da size ait olmayan veriye ulaşmaya çalışmak;",
            "hizmeti hukuka aykırı biçimde veya başkalarının haklarını ihlal ederek kullanmak.",
          ],
        },
        {
          p: "Kendiniz ya da müşterileriniz için ürettiğiniz raporlar ve analizler sizindir. Kısıtlama, altta yatan verinin bir ürün olarak yeniden dağıtılmasınadır.",
        },
      ],
    },

    content: {
      heading: "9. Sizin içeriğiniz",
      body: [
        {
          p: "Girdiğiniz anahtar kelimeler ve sorular sizin kalır. Bunlar üzerinde arama yapmamız, sonuçları saklamamız ve Gizlilik Politikamızda anlatılan ortak soru havuzunu işletmemiz için gereken izni bize verirsiniz.",
        },
        {
          p: "Lütfen dikkat: sorular ve skorları, hesap başına özel bir kopyada değil, bütün müşterilerin paylaştığı tek bir havuzda tutulur. Gizlilik Politikamız bunun neyi açığa çıkardığını ve neyi çıkarmadığını tam olarak anlatır.",
        },
        {
          link: { text: "Gizlilik Politikasını okuyun", href: "/privacy" },
        },
      ],
    },

    availability: {
      heading: "10. Erişilebilirlik",
      body: [
        {
          p: "Hizmet, önizleme hâlinde, olduğu gibi ve çalışma süresi taahhüdü olmaksızın sunulur. Herhangi bir bölümünü değiştirebilir, askıya alabilir veya sonlandırabiliriz.",
        },
        {
          p: "Ödemesini yaptığınız bir şeyi geri çekmeden önce makul bir süre önceden haber verir ve bu yüzden kullanamadığınız kredileri iade ederiz.",
        },
      ],
    },

    liability: {
      heading: "11. Sorumluluğun reddi ve sınırı",
      body: [
        {
          p: "Hukukun izin verdiği azami ölçüde hizmet, belirli bir amaca uygunluk ve ihlal etmeme dâhil olmak üzere açık ya da zımni hiçbir garanti verilmeksizin, “olduğu gibi” ve “mevcut hâliyle” sunulur.",
        },
        {
          p: "Hukukun izin verdiği azami ölçüde, hizmetten doğan veya hizmetle ilgili toplam sorumluluğumuz, talebe yol açan olaydan önceki on iki ay içinde bize ödediğiniz tutarla sınırlıdır. Kâr kaybı, gelir kaybı, veri kaybı ya da dolaylı veya sonuç niteliğindeki zararlardan sorumlu değiliz.",
        },
        {
          p: "Bu koşullardaki hiçbir hüküm, dolandırıcılık sorumluluğu dâhil olmak üzere hukuken hariç tutulamayan veya sınırlandırılamayan sorumluluğu hariç tutmaz ya da sınırlandırmaz.",
        },
      ],
    },

    termination: {
      heading: "12. Sözleşmenin sona ermesi",
      body: [
        {
          p: "Hesabınızı dilediğiniz zaman hesap ayarlarınızdan ya da {email} adresine yazarak kapatabilirsiniz. Neyin silindiğini ve neyin saklandığını Gizlilik Politikamız anlatır.",
        },
        {
          p: "Bu koşulları ihlal etmeniz hâlinde erişiminizi askıya alabilir veya sonlandırabiliriz. Erişimin ihlal nedeniyle sona erdiği durumlarda kullanılmamış krediler iade edilmez.",
        },
      ],
    },

    changes: {
      heading: "13. Bu koşullardaki değişiklikler",
      body: [
        {
          p: "Bu koşulları güncelleyebiliriz. Sayfanın başındaki tarih en son ne zaman değiştiklerini gösterir; hesap sahiplerini kendilerini esaslı biçimde etkileyen değişikliklerden e-postayla haberdar ederiz.",
        },
        {
          p: "Bir değişiklikten sonra hizmeti kullanmaya devam etmeniz, güncellenmiş koşulları kabul ettiğiniz anlamına gelir.",
        },
      ],
    },

    law: {
      heading: "14. Geçerli hukuk",
      body: [
        {
          p: "Bu koşullar, kanunlar ihtilafı kurallarına bakılmaksızın Amerika Birleşik Devletleri {state} Eyaleti hukukuna tabidir. Her bir tarafın yetkili herhangi bir mahkemeden ihtiyati tedbir talep edebilmesi saklı kalmak kaydıyla, uyuşmazlıklarda {state} mahkemeleri münhasıran yetkilidir.",
        },
      ],
    },

    contact: {
      heading: "15. İletişim",
      body: [
        { p: "Bu koşullarla ilgili sorularınız için:" },
        {
          link: { text: "{email}", href: "mailto:{email}" },
        },
        { p: "{company}, {state}, Amerika Birleşik Devletleri." },
      ],
    },
  },
};
