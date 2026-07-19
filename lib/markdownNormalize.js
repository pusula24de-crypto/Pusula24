// Bazı haberlerde alt başlıklar "## " öneki UNUTULARAK, tek başına duran
// TAMAMEN BÜYÜK HARFLİ bir satır olarak yazılıyor (örn. "BU NE ANLAMA
// GELİYOR?"). Bu satırları otomatik "## " başlığına yükseltir. Yanlış
// pozitifi sınırlamak için: satır tek başına olmalı (4-70 karakter), en az
// bir harf içermeli, zaten "#" ile başlamamalı (idempotent — önceden
// yükseltilmiş başlıkları tekrar işlemez) ve "." ile bitmemeli (tam cümleyle
// başlık/etiketi ayırt etmek için — "?" ile bitmesine izin verilir).
// Türkçe büyük/küçük harf dönüşümü locale'e duyarlı yapılır (İ/ı ayrımı).
function tamamiBuyukHarfBasligaYukselt(metin) {
  return metin
    .split('\n')
    .map((satir) => {
      const t = satir.trim()
      if (t.length < 4 || t.length > 70) return satir
      if (t.startsWith('#')) return satir
      if (t.endsWith('.')) return satir
      if (!/[a-zçğıöşüA-ZÇĞİÖŞÜ]/.test(t)) return satir
      const buyukHali = t.toLocaleUpperCase('tr-TR')
      const kucukHali = t.toLocaleLowerCase('tr-TR')
      if (t !== buyukHali || t === kucukHali) return satir
      return `## ${t}`
    })
    .join('\n')
}

// Admin panelden yapıştırılan haber gövdesini kaydetmeden önce markdown-dostu
// hale getirir. Render tarafında remark-breaks tek satır sonlarını zaten
// <br>'a çevirir; burada amaç kayıtta temiz ve taşınabilir bir metin
// bırakmak: satır sonu normalizasyonu, aşırı boş satır temizliği, unutulmuş
// ALL-CAPS başlıkların "## "ya yükseltilmesi ve ## ara başlıkların her zaman
// kendi paragraf bloğunda durması.
export function markdownNormalizeEt(govde) {
  if (!govde) return govde

  // Windows/Mac satır sonlarını \n'e indir.
  let metin = govde.replace(/\r\n?/g, '\n')

  // Satır sonu boşluklarını temizle.
  metin = metin
    .split('\n')
    .map((satir) => satir.replace(/[ \t]+$/, ''))
    .join('\n')

  // 3+ ardışık boş satırı (4+ üst üste \n) 2 boş satıra (3 \n) indir.
  metin = metin.replace(/\n{4,}/g, '\n\n\n')

  // "## " öneki unutulmuş ALL-CAPS başlık satırlarını yükselt.
  metin = tamamiBuyukHarfBasligaYukselt(metin)

  // ## (H1-H6) ara başlıklarının önüne, önceki satır boş değilse boş satır ekle.
  metin = metin.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')

  // Aynı başlıkların ardına, sonraki satır boş değilse boş satır ekle.
  metin = metin.replace(/(#{1,6} [^\n]*)\n([^\n])/g, '$1\n\n$2')

  return metin.trim()
}
