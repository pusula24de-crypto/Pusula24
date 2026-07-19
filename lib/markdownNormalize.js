// Admin panelden yapıştırılan haber gövdesini kaydetmeden önce markdown-dostu
// hale getirir. Render tarafında remark-breaks tek satır sonlarını zaten
// <br>'a çevirir; burada amaç kayıtta temiz ve taşınabilir bir metin
// bırakmak: satır sonu normalizasyonu, aşırı boş satır temizliği ve ## ara
// başlıkların her zaman kendi paragraf bloğunda durması.
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

  // ## (H1-H6) ara başlıklarının önüne, önceki satır boş değilse boş satır ekle.
  metin = metin.replace(/([^\n])\n(#{1,6} )/g, '$1\n\n$2')

  // Aynı başlıkların ardına, sonraki satır boş değilse boş satır ekle.
  metin = metin.replace(/(#{1,6} [^\n]*)\n([^\n])/g, '$1\n\n$2')

  return metin.trim()
}
