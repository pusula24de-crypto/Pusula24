import imageCompression from 'browser-image-compression'

// Supabase'e yüklemeden ÖNCE tarayıcıda uygulanan sıkıştırma ayarları.
// Gemini görselleri ham halde 1-2 MB geliyor; 1600px + WebP ile hem
// depolama hem bant genişliği tüketimi büyük ölçüde azalır.
const MAKS_KENAR = 1600
const HEDEF_BOYUT_MB = 0.25
const KALITE = 0.82
const MAKS_DOSYA_BOYUTU = 15 * 1024 * 1024 // 15 MB üstü reddedilir

export function boyutFormatla(bayt) {
  if (bayt < 1024) return `${bayt} B`
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`
  return `${(bayt / (1024 * 1024)).toFixed(2)} MB`
}

// Seçilen dosyayı 1600px'i aşmayacak, ~250 KB hedefli WebP'ye çevirir.
// Zaten küçük dosyalar da WebP'ye çevrilir ama büyütülmez (kütüphane
// varsayılan olarak yukarı ölçeklemez). Hata durumunda fırlatır.
export async function gorselSikistir(dosya) {
  if (!dosya.type?.startsWith('image/')) {
    throw new Error('Yalnızca görsel dosyaları yüklenebilir (JPG, PNG, WebP vb.).')
  }
  if (dosya.size > MAKS_DOSYA_BOYUTU) {
    throw new Error('Dosya çok büyük (15 MB üstü). Lütfen daha küçük bir görsel seçin.')
  }

  const orijinalBoyut = dosya.size

  let sikistirilmis
  try {
    sikistirilmis = await imageCompression(dosya, {
      maxWidthOrHeight: MAKS_KENAR,
      maxSizeMB: HEDEF_BOYUT_MB,
      fileType: 'image/webp',
      useWebWorker: true,
      initialQuality: KALITE,
    })
  } catch {
    throw new Error('Görsel işlenemedi. Desteklenmeyen veya bozuk bir dosya olabilir.')
  }

  const yeniAd = dosya.name.replace(/\.[^./\\]+$/, '') + '.webp'
  const webpDosya = new File([sikistirilmis], yeniAd, { type: 'image/webp' })

  return { dosya: webpDosya, orijinalBoyut, yeniBoyut: webpDosya.size }
}
