import type { AiSeoShape } from "../blocks";

/** Turkish AI SEO copy. Shape, sources of every figure and the reasoning are in `en.ts`. */
export const tr = {
  title: "AI SEO: Google AI Overview'da kaynak gösterilin",
  description:
    "Google artık birçok soruyu birkaç kaynak gösteren bir AI Overview ile " +
    "cevaplıyor. İnsanların ne sorduğunu, hangi soruları hiçbir sayfanın " +
    "cevaplamadığını ve yapay zekanın hangi siteleri gösterdiğini görün; " +
    "sizinki dahil.",

  hero: {
    eyebrow: "AI SEO",
    head: "Yapay zeka aramasının",
    headTinted: "gösterdiği kaynak",
    headTail: "siz olun.",
    lead:
      "Google artık birçok soruyu bir AI Overview ile cevaplıyor ve yanında " +
      "yalnızca birkaç kaynak gösteriyor. AnswerGap insanların ne sorduğunu, " +
      "hangi soruları hiçbir sayfanın gerçekten cevaplamadığını ve yapay " +
      "zekanın hangi siteleri gösterdiğini ortaya koyar; sizinki dahil.",
  },
  heroPrimary: "Ücretsiz başlayın",
  heroSecondary: "Nasıl çalıştığını görün",

  shift: {
    eyebrow: "Ne değişti",
    heading: "Cevap artık linklerden önce geliyor.",
    lead:
      "Arama eskiden on mavi linkti. Şimdi bu linklerin üstünde yapay zekanın " +
      "yazdığı bir cevap duruyor ve hangi birkaç sitenin anılacağına o karar " +
      "veriyor.",
    cards: [
      {
        figure: "32 / 32",
        title: "\"Diğer kullanıcılar şunları da sordu\" yapay zekayla cevaplıyor",
        desc:
          "Bu ürünü geliştirirken çektiğimiz bir örnekte, açılan 32 People " +
          "Also Ask cevabının hepsi bir sayfadan alıntı değil, bir AI " +
          "Overview'du.",
      },
      {
        figure: "13 / 16",
        title: "Yapay zeka kaynaklarını adıyla gösteriyor",
        desc:
          "Diş beyazlatma konusunda baktığımız 16 sorunun 13'ünde Google'ın " +
          "AI Overview'u kaynak gösterdi. O birkaç link, aramanın yeni ilk " +
          "sayfası.",
      },
      {
        figure: "1.'nin üstünde",
        title: "Sıralama takibi bunu göremez",
        desc:
          "Sıralama aracı listedeki yerinizi söyler. Listenin üstündeki " +
          "cevabın sizi anıp anmadığını söylemez; oysa insanların ilk " +
          "okuduğu şey o cevap.",
      },
    ],
  },

  product: {
    eyebrow: "AnswerGap neyi ölçer",
    heading: "Tek bir anahtar kelimeden fırsat listesine.",
    lead:
      "Aynı Google sonuçlarından okunan üç şey; ağaçtaki her soru için yan " +
      "yana.",
    points: [
      {
        title: "İnsanlar ne soruyor",
        desc:
          "Tek bir arama Google'ın People Also Ask zincirini açar: seçtiğiniz " +
          "ülke ve dilde, beş seviye derinlikte yaklaşık 15 soru.",
      },
      {
        title: "Hangi soruları kimse cevaplamıyor",
        desc:
          "Bir sorunun arkasındaki arama sonuçlarını okuyup o soruyu gerçekten " +
          "hedefleyen sayfaları sayarız. Az ya da hiç yoksa bu bir boşluktur: " +
          "sahiplenebileceğiniz bir soru. Her karar kanıtını gösterir.",
      },
      {
        title: "Yapay zeka kimi gösteriyor, siz var mısınız",
        desc:
          "Bakılan her soru, Google'ın AI Overview'unun gösterdiği siteleri " +
          "listeler. Alan adınızı girin; nerede anıldığınızı, nerede onun " +
          "yerine bir rakibin anıldığını görün.",
      },
    ],
    demo: {
      badge: "Örnek",
      seed: "diş beyazlatma",
      pagesLabel: "{checked} sayfanın {matching} tanesi hedefliyor",
      rows: [
        {
          question: "Diş hekimleri diş beyazlatmayı önerir mi?",
          status: "gap",
          label: "Cevapsız",
          matching: 0,
          checked: 8,
          ai: "AI 4",
          you: false,
        },
        {
          question: "Dişleri en hızlı ne beyazlatır?",
          status: "weak",
          label: "Az cevaplanmış",
          matching: 1,
          checked: 7,
          ai: "AI 6",
          you: false,
        },
        {
          question: "Diş beyazlatma ne kadar tutar?",
          status: "covered",
          label: "İyi cevaplanmış",
          matching: 6,
          checked: 8,
          ai: "AI 5 · siz",
          you: true,
        },
      ],
      note:
        "Temsilîdir. Gerçek bir sonuç okuduğumuz her sayfayı ve yapay zekanın " +
        "gösterdiği her siteyi listeler.",
    },
  },

  playbook: {
    head: "Yapay zeka araması için",
    headTinted: "bir oyun planı",
    headTail: ".",
    lead:
      "Dört adım, tekrar tekrar. Ağaç nereden başlayacağınızı söyler; yeniden " +
      "aramak işe yarayıp yaramadığını.",
    steps: [
      {
        title: "Konunuzu arayın",
        desc:
          "Müşterilerinizin kullandığı kelimelerle başlayın. Bir arama bir " +
          "kredidir ve AI Overview kaynakları da onunla birlikte gelir.",
      },
      {
        title: "Boşlukları seçin",
        desc:
          "Tabloyu her soruyu hedefleyen sayfa sayısına göre sıralayın. En " +
          "azdan başlayanlar, cevabın eksik olduğu yerlerdir.",
      },
      {
        title: "Yapay zekanın kimi gösterdiğine bakın",
        desc:
          "Alan adınızı girin. Yapay zekanın sizi değil bir rakibi andığı " +
          "sorular ikinci listenizdir.",
      },
      {
        title: "Cevabı yazın, sonra yeniden arayın",
        desc:
          "Soruyu doğrudan cevaplayan bir sayfa yayımlayın, sonra aramayı " +
          "tekrarlayın. Her sonuç tarihlidir, karşılaştırabilirsiniz.",
      },
    ],
  },

  citable: {
    eyebrow: "Yapay zeka cevapları için yazmak",
    heading: "Bir sayfayı kaynak gösterilmeye uygun yapan şey.",
    lead:
      "AI Overview'un kaynaklarını tam olarak nasıl seçtiğini Google dışında " +
      "kimse bilmiyor. Bu alışkanlıklar bir cevabı bulunması, alıntılanması " +
      "ve güvenilmesi kolay hâle getirir; okuyan insanlar için de iyidir.",
    cards: [
      {
        title: "İlk cümlede cevaplayın",
        desc:
          "Doğrudan cevabı başlığın hemen altına koyun, sonra açıklayın. " +
          "Dördüncü paragrafa gömülmüş bir cevap zor alıntılanır.",
      },
      {
        title: "Soruyu başlık yapın",
        desc:
          "Başlıkları insanların sorduğu gibi kurun. Soru People Also Ask'te " +
          "zaten bu biçimde görünüyor.",
      },
      {
        title: "Bir soru, bir bölüm",
        desc:
          "Her soruya sınırları belli kendi bölümünü verin; bir paragraf tek " +
          "başına alındığında da anlamlı kalsın.",
      },
      {
        title: "Devam sorularını da cevaplayın",
        desc:
          "Ağaç insanların sonra ne sorduğunu gösterir. Bir sorunun alt " +
          "sorularını da cevaplamak sayfanızı birçok kaynaktan biri değil, " +
          "eksiksiz kaynak yapar.",
      },
      {
        title: "Kanıtınızı gösterin",
        desc:
          "Rakamlar, adı geçen kaynaklar ve adı belli bir yazar. Somut bir " +
          "iddiaya genel bir iddiadan daha kolay güvenilir.",
      },
      {
        title: "Tarihli ve güncel tutun",
        desc:
          "Sayfanın en son ne zaman güncellendiğini gösterin; ağacınızdaki " +
          "sorular değiştiğinde sayfaya geri dönün.",
      },
    ],
  },

  limits: {
    eyebrow: "Açıkça söyleyelim",
    heading: "Neyi iddia etmiyoruz.",
    lead:
      "Yapay zeka araması yeni ve bu alandaki birçok araç kimsenin sahip " +
      "olmadığı bir kesinliği satıyor. AnswerGap'in tam olarak neyi ölçtüğü " +
      "ve neyi ölçmediği şu:",
    items: [
      {
        title: "Şimdilik yalnızca Google",
        desc:
          "Google'ın AI Overview'unu okuyoruz. ChatGPT, Claude ve Perplexity " +
          "ölçülmüyor; gerçek soru hacimlerini de kimse size satamaz.",
      },
      {
        title: "Anlık görüntü, canlı değil",
        desc:
          "Her sonuç çekildiği zamanı taşır. Google'ın sonuçları değişir; " +
          "yenilemek için yeniden arayın.",
      },
      {
        title: "Boşluk kararı bir tahmindir",
        desc:
          "Okuduğumuz sayfalardan hesaplanır ve bazen yanılır. Kanıt her zaman " +
          "gösterilir; her kararı doğru ya da yanlış diye işaretleyebilirsiniz.",
      },
      {
        title: "Kaynak gösterilme garantisi yok",
        desc:
          "Hiç kimse bir yapay zekanın sizi kaynak göstereceğini vaat edemez. " +
          "Biz boşluğun nerede olduğunu gösteririz; cevabı yazmak size kalır.",
      },
    ],
  },

  faq: {
    heading: "Kısaca AI SEO",
    items: [
      {
        title: "AI SEO nedir?",
        desc:
          "GEO (generative engine optimization) ya da AEO (answer engine " +
          "optimization) diye de anılan AI SEO, içeriğinizin Google'ın AI " +
          "Overview'u gibi yapay zekanın yazdığı cevaplarda kullanılması ve " +
          "kaynak gösterilmesi için yapılan iştir; yalnızca altındaki " +
          "linklerde sıralanmak değil.",
      },
      {
        title: "AI SEO normal SEO'dan farklı mı?",
        desc:
          "Onun üzerine kurulur. Yapay zeka cevapları arama motorlarının zaten " +
          "bulabildiği sayfalardan beslenir; taranabilirlik ve kalite hâlâ " +
          "önemlidir. Değişen hedeftir: bir anahtar kelimede sıralanan bir " +
          "sayfa yerine, belirli bir soruya açık ve alıntılanabilir bir cevap.",
      },
      {
        title: "AnswerGap hangi yapay zeka motorlarını izliyor?",
        desc:
          "Google'ın AI Overview'unu; boşlukları bulmak için kullandığımız " +
          "aynı arama sonuçlarından okuyoruz. Diğer asistanlar bugün " +
          "izlenmiyor.",
      },
      {
        title: "AnswerGap bir sorunun boşluk olduğuna nasıl karar veriyor?",
        desc:
          "Her soru için arama sonuçlarını çekip her sayfayı soruyla " +
          "karşılaştırır, soruyu gerçekten hedefleyen sayfaları sayarız. Az ya " +
          "da hiç yoksa boşluktur. Bu bir tahmindir ve arkasındaki sayfalar " +
          "her zaman gösterilir.",
      },
      {
        title: "Ücreti ne?",
        desc:
          "Her arama bir kredidir ve AI Overview kaynakları ek ücret olmadan " +
          "onunla gelir. Zaten elinizde olan bir sonucu yeniden açmak " +
          "ücretsizdir.",
      },
    ],
  },

  cta: {
    head: "Yapay zekanın sizsiz cevapladığı soruları bulun.",
    lead:
      "Bir konu arayın; boşlukları ve yapay zekanın gösterdiği siteleri tek " +
      "ekranda görün.",
    primary: "Ücretsiz başlayın",
    secondary: "Fiyatlandırmayı görün",
  },
} as const satisfies AiSeoShape;
