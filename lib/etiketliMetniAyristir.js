// "Yapıştır ve Otomatik Doldur" panellerinin (haber + rehber) ortak ayrıştırma
// algoritması: sabit etiketli ("ETİKET:" değer) çıktı metinlerini ayrıştırır.
// Her etiketin metin içindeki konumunu bulur, konuma göre sıralar, ardışık
// iki etiket arasını o alanın değeri sayar — çıktıdaki etiket SIRASI
// beklenenden farklı olsa bile çalışır. Bulunamayan etiketler sonuç
// objesinde hiç yer almaz (çağıran taraf bunu "alanı boş bırak" olarak
// yorumlar, hata fırlatmaz).
export function etiketliMetniAyristir(metin, etiketler) {
  const bulunanlar = etiketler
    .map(([anahtar, etiket]) => ({ anahtar, index: metin.indexOf(etiket), uzunluk: etiket.length }))
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
