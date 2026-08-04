// Bazı yapay zekâ/redaksiyon motoru çıktıları Türkçe büyük harfli aksanlı
// karakterleri (İ, Ç, Ğ, Ö, Ş, Ü) tutarsızca ASCII karşılığına dönüştürebiliyor
// — örn. "KATEGORİ:" yerine "KATEGORI:" (düz I). indexOf TAM eşleşme
// aradığı için bu farkta etiket hiç BULUNAMIYORDU, bu da bir önceki alanın
// kendi sınırında değil bu etiketin bir SONRAKİ bulunan etikete kadar
// (satır sonu dahil) her şeyi yutmasına yol açtı — CANLI KANIT
// (haberler.id=208): URL SLUG alanı "...-kaybetti\r\n\r\nKATEGORI: Almanya"
// olarak kaydedilmiş bulundu. Yalnızca EŞLEŞME ARAMASI için normalize
// ediyoruz — karakter SAYISI değişmediği için bulunan index, orijinal
// (normalize edilmemiş) metindeki gerçek konumla birebir örtüşmeye devam
// ediyor; asıl DEĞER hep orijinal metinden dilimleniyor.
function turkceEtiketNormalizeEt(metin) {
  return metin
    .replace(/İ/g, 'I')
    .replace(/Ç/g, 'C')
    .replace(/Ğ/g, 'G')
    .replace(/Ö/g, 'O')
    .replace(/Ş/g, 'S')
    .replace(/Ü/g, 'U')
}

// "Yapıştır ve Otomatik Doldur" panellerinin (haber + rehber) ortak ayrıştırma
// algoritması: sabit etiketli ("ETİKET:" değer) çıktı metinlerini ayrıştırır.
// Her etiketin metin içindeki konumunu bulur, konuma göre sıralar, ardışık
// iki etiket arasını o alanın değeri sayar — çıktıdaki etiket SIRASI
// beklenenden farklı olsa bile çalışır. Bulunamayan etiketler sonuç
// objesinde hiç yer almaz (çağıran taraf bunu "alanı boş bırak" olarak
// yorumlar, hata fırlatmaz).
export function etiketliMetniAyristir(metin, etiketler) {
  const normalizeMetin = turkceEtiketNormalizeEt(metin)
  const bulunanlar = etiketler
    .map(([anahtar, etiket]) => ({
      anahtar,
      index: normalizeMetin.indexOf(turkceEtiketNormalizeEt(etiket)),
      uzunluk: etiket.length,
    }))
    .filter((b) => b.index !== -1)
    .sort((a, b) => a.index - b.index)

  const sonuc = {}
  bulunanlar.forEach((bu, i) => {
    const baslangic = bu.index + bu.uzunluk
    const bitis = i + 1 < bulunanlar.length ? bulunanlar[i + 1].index : metin.length
    sonuc[bu.anahtar] = metin.slice(baslangic, bitis).trim()
  })
  return sonuc
}

// Rehber/redaksiyon motorunun SSS bloğu formatı:
// **S: [Soru]**
// C: [Cevap]
// (tekrarlayan bloklar halinde, cevaplar birden fazla satır/paragraf olabilir)
// Format eşleşmezse boş dizi döner (hata fırlatmaz).
export function sssBlokuAyristir(metin) {
  if (!metin) return []
  const sonuc = []
  const regex = /\*\*S:\s*(.+?)\*\*\s*\n?\s*C:\s*([\s\S]*?)(?=\n\s*\*\*S:|$)/g
  let eslesme
  while ((eslesme = regex.exec(metin)) !== null) {
    const soru = eslesme[1].trim()
    const cevap = eslesme[2].trim()
    if (soru || cevap) sonuc.push({ soru, cevap })
  }
  return sonuc
}
