// Etiket eşleşmesi için: önce Türkçe büyük/küçük harfli aksanlı karakterleri
// ASCII karşılıklarına çevirir, SONRA yalnızca düz ASCII a-z harflerini
// büyütür. Yalnızca EŞLEŞME ARAMASI için kullanılır — kritik önkoşul,
// normalize edilmiş metnin ORİJİNAL metinle AYNI karakter SAYISINA sahip
// kalması: aksi halde bulunan konum/uzunluk orijinal metindeki gerçek
// konumla örtüşmez.
//
// CANLI KANIT #1 (haberler.id=208): motor çıktısı "KATEGORİ:" yerine ASCII
// "KATEGORI:" (düz I) kullanmış — Türkçe katlama olmadan bu hiç eşleşmiyordu.
// CANLI KANIT #2 (haberler.id=209): motor çıktısı "URL SLUG:" yerine "URL
// slug:" (küçük harfli "slug") kullanmış — büyük/küçük harf eşleşmesi
// olmadan bu da eşleşmiyordu, bu yüzden BAŞLIK alanı "URL slug: ..."
// satırını içine yuttu ve bu bozuk başlık otomatik-slug üretimine
// (slugUret) girip birleşik/anlamsız bir slug'a dönüştü.
// CANLI KANIT #3 (regresyon — bu düzeltmenin İLK denemesinde bulundu):
// bir haberde "Straße"/"groß" gibi Almanca "ß" (sharp S) geçen bir kelime
// varsa, JS'in düz metin.toUpperCase()'i "ß"yı SESSİZCE "SS"ye (2 karaktere)
// GENİŞLETİYOR — bu da normalize edilmiş metnin uzunluğunu orijinalden
// FARKLI kılıyor, "ß"dan SONRA bulunan HER etiketin konumu 1 kayıyor ve
// dilimleme başlangıcı orijinal metinde 1 karakter FAZLA ileri gidip her
// alanın İLK HARFİNİ yutuyordu. Bu yüzden burada .toUpperCase() TÜM metne
// değil, yalnızca [a-z] karakterlerine (her zaman garanti 1:1 büyüyen tek
// ASCII harfler) uygulanıyor — "ß" gibi başka hiçbir karakter dokunulmadan
// kalıyor (bizim etiketlerimizde zaten hiç geçmiyor, o yüzden eşleşmeyi
// etkilemiyor) ve karakter sayısı HER durumda korunuyor.
function etiketEslesmeIcinNormalizeEt(metin) {
  return metin
    .replace(/İ/g, 'I').replace(/ı/g, 'i')
    .replace(/Ç/g, 'C').replace(/ç/g, 'c')
    .replace(/Ğ/g, 'G').replace(/ğ/g, 'g')
    .replace(/Ö/g, 'O').replace(/ö/g, 'o')
    .replace(/Ş/g, 'S').replace(/ş/g, 's')
    .replace(/Ü/g, 'U').replace(/ü/g, 'u')
    .replace(/[a-z]/g, (harf) => harf.toUpperCase())
}

function regexOzelKarakterleriKacir(metin) {
  return metin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Etiketi, kelimeler arasındaki TEK boşluğu \s+ (bir ya da daha fazla
// boşluk/sekme) ile eşleştiren bir regex'e çevirir — "URL  SLUG:" (çift
// boşluk) gibi küçük format sapmalarına da tolerans sağlar.
function etiketRegexUret(etiket) {
  const normalizeEtiket = etiketEslesmeIcinNormalizeEt(etiket)
  const desen = regexOzelKarakterleriKacir(normalizeEtiket).replace(/ /g, '\\s+')
  return new RegExp(desen)
}

// GENEL GÜVENLİK AĞI: etiket eşleşmesi ne kadar sağlamlaştırılırsa
// sağlamlaştırılsın, hiç öngörülmemiş bir format sapmasında (ör. aynı
// etiketin metinde birden fazla geçmesi) yine bir alan bir SONRAKİ alana
// ait metni içine alabilir. Bu yüzden her alanın değeri çıkarıldıktan SONRA,
// değerin İÇİNDE listedeki BAŞKA bir etiketin bir daha geçtiği yer aranır —
// varsa değer o noktadan kesilir. Yalnızca BİZİM TANIMLADIĞIMIZ etiketlere
// (örn. "KATEGORİ:", "SEO ETİKETLERİ:") bakıldığı için, gövde/SSS gibi
// serbest metinlerde tesadüfen büyük harfli bir kelimenin ardından iki nokta
// gelmesi gibi durumlarda YANLIŞ POZİTİF riski yok denecek kadar düşük.
function digerEtiketKalintisindenKes(deger, etiketler) {
  if (!deger) return deger
  const normalizeDeger = etiketEslesmeIcinNormalizeEt(deger)
  let enErkenIndex = -1
  for (const [, etiket] of etiketler) {
    const eslesme = etiketRegexUret(etiket).exec(normalizeDeger)
    if (eslesme && (enErkenIndex === -1 || eslesme.index < enErkenIndex)) {
      enErkenIndex = eslesme.index
    }
  }
  return enErkenIndex === -1 ? deger : deger.slice(0, enErkenIndex).trim()
}

// BAŞLIK ve URL SLUG gibi doğası gereği TEK SATIRLIK olması gereken alanlar
// için ek güvence: yukarıdaki genel eşleştirme/kesme mantığı ne kadar
// sağlamlaştırılırsa sağlamlaştırılsın, hiç öngörülmemiş bir format
// sapmasında bu alanların içine bir satır sonu (\n) sızabilir — CANLI KANIT
// (haberler.id=209): BAŞLIK, bir sonraki "URL SLUG:" etiketi tanınamadığı
// için "...Konuldu\r\n\r\nURL slug: frankfurt-..." satırını içine yuttu ve bu
// bozuk başlık, otomatik-slug üretimine girip anlamsız/birleşik bir slug'a
// dönüştü. Bu fonksiyon çağıran tarafta İLK satırdan sonrasını KOŞULSUZ atar.
export function ilkSatiraIndir(metin) {
  if (!metin) return metin
  return metin.split('\n')[0].trim()
}

// "Yapıştır ve Otomatik Doldur" panellerinin (haber + rehber) ortak ayrıştırma
// algoritması: sabit etiketli ("ETİKET:" değer) çıktı metinlerini ayrıştırır.
// Her etiketin metin içindeki konumunu bulur, konuma göre sıralar, ardışık
// iki etiket arasını o alanın değeri sayar — çıktıdaki etiket SIRASI
// beklenenden farklı olsa bile çalışır. Bulunamayan etiketler sonuç
// objesinde hiç yer almaz (çağıran taraf bunu "alanı boş bırak" olarak
// yorumlar, hata fırlatmaz).
export function etiketliMetniAyristir(metin, etiketler) {
  const normalizeMetin = etiketEslesmeIcinNormalizeEt(metin)

  const bulunanlar = etiketler
    .map(([anahtar, etiket]) => {
      const eslesme = etiketRegexUret(etiket).exec(normalizeMetin)
      return eslesme
        ? { anahtar, index: eslesme.index, uzunluk: eslesme[0].length }
        : { anahtar, index: -1, uzunluk: 0 }
    })
    .filter((b) => b.index !== -1)
    .sort((a, b) => a.index - b.index)

  const sonuc = {}
  bulunanlar.forEach((bu, i) => {
    const baslangic = bu.index + bu.uzunluk
    const bitis = i + 1 < bulunanlar.length ? bulunanlar[i + 1].index : metin.length
    const deger = metin.slice(baslangic, bitis).trim()
    sonuc[bu.anahtar] = digerEtiketKalintisindenKes(deger, etiketler)
  })
  return sonuc
}

// Rehber/redaksiyon motorunun SSS bloğu formatı:
// **S: [Soru]**
// C: [Cevap]
// (tekrarlayan bloklar halinde, cevaplar birden fazla satır/paragraf olabilir)
// "S"/"C" harfleri büyük/küçük yazılmış olabilir diye case-insensitive
// eşleştiriyoruz (aynı sistemik kırılganlık sınıfı — bkz. yukarısı). Format
// eşleşmezse boş dizi döner (hata fırlatmaz).
export function sssBlokuAyristir(metin) {
  if (!metin) return []
  const sonuc = []
  const regex = /\*\*S:\s*(.+?)\*\*\s*\n?\s*C:\s*([\s\S]*?)(?=\n\s*\*\*S:|$)/gi
  let eslesme
  while ((eslesme = regex.exec(metin)) !== null) {
    const soru = eslesme[1].trim()
    const cevap = eslesme[2].trim()
    if (soru || cevap) sonuc.push({ soru, cevap })
  }
  return sonuc
}
