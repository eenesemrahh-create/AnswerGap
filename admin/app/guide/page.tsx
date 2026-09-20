import { translator } from "@/lib/locale";
import { get } from "@/lib/api";

export const dynamic = "force-dynamic";

/* The team explainer: where the AI Overview figures and the "your site" match
 * come from, for someone who has never seen the pipeline.
 *
 * TURKISH, unlike the rest of this panel. The panel is English because it has
 * one operator; this page exists to be read by the Turkish-speaking team, and
 * a shareable copy lives in a Claude doc (linked below) for people with no
 * admin access.
 *
 * Static copy, but still behind the admin gate: the one `get` below is there
 * to refuse non-admins exactly as every other screen does. Keep the examples in
 * step with the demo data if the teeth-whitening archive is ever rebuilt. */

const DOC_URL = "https://claude.ai/code/artifact/77530b9b-221b-483b-855d-64ee16850069";

export default async function GuidePage() {
  const t = await translator();
  await get("/api/admin/settings");

  return (
    <article className="guide">
      <h1>AI Overview verisi nereden geliyor?</h1>
      <p className="notice">{t("guide.englishOnly")}</p>
      <p className="sub">
        AnswerGap hiçbir siteye girip içeriğini okumaz. Bir soruyu Google&apos;a bir kez
        sorar, Google&apos;ın o gün gösterdiği sonuç sayfasının kopyasını saklar ve bütün
        rakamları o kopyadan sayar. Ekiple paylaşılabilir kopyası:{" "}
        <a href={DOC_URL} target="_blank" rel="noreferrer">Claude dokümanı</a>.
      </p>

      <ol className="guide-flow" aria-label="Akış">
        <li>Soru seçilir</li>
        <li>DataForSEO soruyu Google&apos;da arar</li>
        <li>Sonuç sayfasının kopyası kaydedilir</li>
        <li>
          İki ayrı hesap: <b>AI Overview kaynak listesi</b> ve <b>normal sonuçların başlıkları</b>
        </li>
      </ol>

      <h2>Adım 1: Soru Google&apos;a soruluyor</h2>
      <p>
        Bir soruyu &ldquo;kontrol et&rdquo; dediğinizde, örneğin <i>Can yellow teeth become
        white again?</i>, Google&apos;ı biz açmıyoruz. <b>DataForSEO</b> adlı ücretli bir
        servis bu soruyu bizim yerimize Google&apos;da arıyor.
      </p>
      <ul>
        <li><b>Konum ve dil:</b> ABD, İngilizce. Başka ülke seçilirse o ülkenin Google&apos;ı sorulur.</li>
        <li>
          <b>Gelen şey:</b> Google&apos;ın o anda gösterdiği ilk sayfanın kopyası: yaklaşık 8 normal
          sonucun başlığı ve adresi, varsa en üstteki <b>AI Overview</b> kutusu.
        </li>
        <li><b>Maliyet:</b> soru başına yaklaşık $0,002 (0,2 sent).</li>
        <li><b>Kayıt:</b> kopya veritabanına yazılır; aynı soru tekrar sorulursa para ödenmez.</li>
      </ul>
      <p>
        Kopyanın alındığı tarih &ldquo;Son güncelleme&rdquo; olarak yazar. Veri canlı değil, o
        tarihin fotoğrafıdır.
      </p>

      <h2>Adım 2: AI Overview kaynak listesi</h2>
      <p>
        Google bazı soruların en üstüne yapay zekânın yazdığı kısa bir cevap koyar; yanında
        &ldquo;bu bilgiyi şu sitelerden aldım&rdquo; diyen link kartları durur. DataForSEO bize o
        kartların site listesini verir. Biz bunu hesaplamayız, tahmin etmeyiz; olduğu gibi saklarız.
      </p>
      <div className="tablewrap">
        <table>
          <thead>
            <tr><th>Ekranda görülen</th><th>Anlamı</th><th>Örnek (teeth whitening)</th></tr>
          </thead>
          <tbody>
            <tr>
              <td>Tabloda &ldquo;8 site&rdquo;</td>
              <td>O sorunun kaynak listesindeki farklı site sayısı</td>
              <td>Can yellow teeth actually be whitened? → 8</td>
            </tr>
            <tr>
              <td>Tabloda &ldquo;yok&rdquo;</td>
              <td>Kutu vardı ama hiçbir site kaynak gösterilmemiş</td>
              <td>—</td>
            </tr>
            <tr>
              <td>Tabloda &ldquo;bilinmiyor&rdquo;</td>
              <td>Kutu var ama kaynakları okunamadı (Google sonradan yüklüyor)</td>
              <td>Can 60 year old teeth be whitened?</td>
            </tr>
            <tr>
              <td>Tabloda &ldquo;—&rdquo;</td>
              <td>Kopyası hiç alınmadı, bakılmadı</td>
              <td>Which teeth cannot be whitened?</td>
            </tr>
            <tr>
              <td>&ldquo;15 sorunun 13&apos;ünde&rdquo;</td>
              <td>AI cevabı okunabilen 15 sorudan 13&apos;ünde kaynak var</td>
              <td>16 kontrol edildi, 1&apos;i okunamadı</td>
            </tr>
            <tr>
              <td>&ldquo;youtube.com 15 sorunun 7&apos;sinde&rdquo;</td>
              <td>Bu site 7 farklı sorunun listesinde geçiyor</td>
              <td>en sık 5 site gösterilir</td>
            </tr>
            <tr>
              <td>Ağaçta &ldquo;AI 8&rdquo;</td>
              <td>Tablodaki &ldquo;8 site&rdquo; ile aynı bilgi</td>
              <td>okunamayan düğümde etiket yok</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p>
        Sayımlar yalnızca AI cevabı okunabilen sorular üzerindendir. Diş beyazlatma ağacında
        kontrol edilen 24 sorunun 17&apos;sinde kutu okunamadı; o 17 soru hiçbir sayıya katılmaz.
        Kaynak listesi Google&apos;ın AI cevabında hem kutunun altındaki genel listeden hem de her
        paragrafın kendi listesinden toplanır.
      </p>

      <h2>Adım 3: &ldquo;Siten&rdquo; kutusu</h2>
      <p>
        Kutuya domain yazıldığında internete çıkılmaz: siteye girilmez, Google&apos;a yeniden
        sorulmaz, para harcanmaz. Eşleştirme tarayıcıda, eldeki kaynak listeleriyle yapılır.
      </p>
      <ol>
        <li>
          <b>Yazılan sadeleştirilir:</b> <code>https://www.clevelandclinic.org/health</code> →{" "}
          <code>clevelandclinic.org</code>.
        </li>
        <li>
          <b>Her sorunun listesinde aranır.</b> Alt adresler de sayılır:{" "}
          <code>my.clevelandclinic.org</code> eşleşir.
        </li>
        <li>
          <b>Sonuç gösterilir:</b> özette &ldquo;15 sorunun 5 tanesinde&rdquo;, tabloda ve ağaçta
          &ldquo;you&rdquo; işareti.
        </li>
      </ol>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Yazılan</th><th>Sonuç</th><th>Neden</th></tr></thead>
          <tbody>
            <tr><td><code>clevelandclinic.org</code></td><td>5 soru</td><td>tüm alt adresleri kapsar</td></tr>
            <tr><td><code>health.clevelandclinic.org</code></td><td>2 soru</td><td>yalnızca o alt adres</td></tr>
            <tr><td><code>notcolgate.com</code></td><td>colgate.com ile eşleşmez</td><td>benzer ad aynı site sayılmaz</td></tr>
          </tbody>
        </table>
      </div>
      <p>Yazılan domain yalnızca o tarayıcıda hatırlanır; sunucuya gönderilmez.</p>

      <h2>Bu kontrol neyi söylemez</h2>
      <p>
        Söylediği tek şey: <i>Google&apos;ın yapay zekâsı, o tarihte, o ülkede, bu soruya cevap
        yazarken bu siteyi kaynak gösterdi.</i>
      </p>
      <ul>
        <li><b>&ldquo;Siten bu soruyu cevaplıyor&rdquo; demez.</b> Sitenin içeriğine bakılmaz.</li>
        <li><b>Hangi sayfanın kaynak olduğunu göstermez.</b> Yalnızca site adı saklanıyor.</li>
        <li><b>Güncel değildir.</b> Demo ağaçlarının kopyaları 25 Ağustos 2026&apos;da alındı.</li>
        <li><b>Başka ülke ya da dil için geçerli değildir.</b></li>
        <li>
          <b>&ldquo;Kaynak değilsin&rdquo; yalnızca AI cevabı okunabilen sorular içindir.</b>{" "}
          Okunamayan sorularda siteniz kaynak olabilir de olmayabilir de; ekran bunu
          &ldquo;bilinmiyor&rdquo; diye gösterir.
        </li>
      </ul>

      <h2>Durum rozetleri ayrı bir hesaptır</h2>
      <p>
        &ldquo;Cevapsız / Az cevaplanmış / İyi cevaplanmış&rdquo; rozetleri AI Overview&apos;dan
        gelmez. Aynı kopyadaki normal sonuçların <b>başlıklarından</b> hesaplanır; sayfaların içi
        burada da okunmaz. Başlıktaki kelimeler sorunun kelimeleriyle karşılaştırılır, örtüşmesi
        %60 ve üstü olan sayfa &ldquo;bu soruyu hedefliyor&rdquo; sayılır.
      </p>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Soruyu hedefleyen sayfa</th><th>Rozet</th></tr></thead>
          <tbody>
            <tr><td>0</td><td>Cevapsız</td></tr>
            <tr><td>1–2</td><td>Az cevaplanmış</td></tr>
            <tr><td>3 ve üstü</td><td>İyi cevaplanmış</td></tr>
            <tr><td>Kopya alınmadı</td><td>Bakılmadı</td></tr>
          </tbody>
        </table>
      </div>
      <ul>
        <li>
          <b>Aynı anlamı farklı kelimelerle söyleyen başlığı kaçırır.</b> <i>Can 60 year old teeth
          be whitened?</i> ile <i>Can Senior Teeth be Whitened?</i> yalnızca %50 örtüşür.
        </li>
        <li><b>%60 eşiği henüz doğrulanmadı.</b> 14 etiketli soruda en iyi kuralın isabeti 0,20 çıktı.</li>
        <li>
          <b>Geri bildirim toplanıyor:</b> soru detayındaki &ldquo;Bu sayfalar soruyu cevaplıyor
          mu?&rdquo; butonları.
        </li>
      </ul>

      <h2>Sık sorulan: kaynaklar reklam veren siteler mi?</h2>
      <p>Verimiz bunu göstermiyor. Arşivdeki 56 Google sonuç sayfasında:</p>
      <div className="tablewrap">
        <table>
          <tbody>
            <tr><td>AI Overview içeren sonuç</td><td className="num">29</td></tr>
            <tr><td>Kaynak gösterilen farklı site</td><td className="num">92</td></tr>
            <tr><td>Bu sonuçlarda reklam bulunan sayfa</td><td className="num">0</td></tr>
            <tr><td>Kaynak sitelerden normal sonuçlarda da çıkan</td><td className="num">58</td></tr>
          </tbody>
        </table>
      </div>
      <p>
        Kaynaklar arasında <code>pmc.ncbi.nlm.nih.gov</code>, <code>reddit.com</code>,{" "}
        <code>youtube.com</code> ve küçük diş klinikleri var. Reklamlar AI Overview&apos;un
        çevresinde &ldquo;Sponsorlu&rdquo; etiketiyle ayrı gösterilir ve kaynak listesine girmez.
      </p>
      <p className="sub">
        <b>Sınır:</b> arşivdeki aramaların çoğu sağlık sorusu ve hiçbirinde reklam çıkmadı. Veri
        &ldquo;kaynaklar reklamcılarla sınırlı değil&rdquo; demeye yeter; &ldquo;reklam vermek
        kaynak olma şansını artırır mı?&rdquo; sorusunu cevaplamaz.
      </p>
    </article>
  );
}
