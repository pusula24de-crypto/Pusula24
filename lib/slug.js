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
