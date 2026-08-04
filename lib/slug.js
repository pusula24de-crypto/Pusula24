const TURKCE_KARAKTER_HARITASI = {
  ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u',
  Ç: 'C', Ğ: 'G', İ: 'I', Ö: 'O', Ş: 'S', Ü: 'U',
}

export function slugUret(metin) {
  if (!metin) return ''

  const temizMetin = metin.replace(
    /[çğıöşüÇĞİÖŞÜ]/g,
    (harf) => TURKCE_KARAKTER_HARITASI[harf]
  )

  return temizMetin
    .toLowerCase()
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

// slugUret metinden (başlıktan) YENİ bir slug ÜRETMEK için; bu fonksiyon ise
// zaten "hazır" olması beklenen bir slug değerini (örn. "Yapıştır ve Doldur"
// ile ayrıştırılan URL SLUG alanı, ya da ileride başka bir yoldan gelecek
// herhangi bir slug girdisi) veritabanına gitmeden önce son bir güvenlik
// katmanından geçirir.
//
// CANLI KANIT (haberler.id=208): ayrıştırma sırasında bir sonraki etiket
// ("KATEGORİ:") metinde ASCII "KATEGORI:" olarak geçtiği için hiç
// bulunamadı, bu da URL SLUG alanının bir SONRAKİ bulunan etikete kadar
// (satır sonu dahil) her şeyi yutmasına yol açtı — DB'ye
// "...-kaybetti\r\n\r\nKATEGORI: Almanya" gibi bozuk bir değer yazıldı.
// Etiket eşleştirmesi artık bu tür Türkçe/ASCII karışıklığına karşı
// toleranslı (bkz. lib/etiketliMetniAyristir.js) ama slug DOĞASI GEREĞİ
// tek satırlık olduğu için burada AYRICA, hangi sebeple olursa olsun asla
// tek satırı ve [a-z0-9-] kümesini aşamayacak şekilde sağlamlaştırılıyor.
export function slugSanitizeEt(metin) {
  if (!metin) return ''

  const ilkSatir = metin.split('\n')[0]
  const temizMetin = ilkSatir.replace(
    /[çğıöşüÇĞİÖŞÜ]/g,
    (harf) => TURKCE_KARAKTER_HARITASI[harf]
  )

  return temizMetin.toLowerCase().replace(/[^a-z0-9-]/g, '').trim()
}
