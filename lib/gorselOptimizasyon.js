import imageCompression from 'browser-image-compression'

// Supabase'e yüklemeden ÖNCE tarayıcıda uygulanan sıkıştırma ayarları.
// Gemini görselleri ham halde 1-2 MB geliyor; 1600px + WebP ile hem
// depolama hem bant genişliği tüketimi büyük ölçüde azalır.
const MAKS_KENAR = 1600
const HEDEF_BOYUT_MB = 0.35
const KALITE = 0.9
const MAKS_DOSYA_BOYUTU = 15 * 1024 * 1024 // 15 MB üstü reddedilir

export function boyutFormatla(bayt) {
  if (bayt < 1024) return `${bayt} B`
  if (bayt < 1024 * 1024) return `${Math.round(bayt / 1024)} KB`
  return `${(bayt / (1024 * 1024)).toFixed(2)} MB`
}

// iPhone'un varsayılan fotoğraf formatı HEIC/HEIF. browser-image-compression
// bu formatı hiç tanımıyor (kaynağında HEIC/HEIF'e dair tek bir referans
// yok): EXIF yönünü otomatik okumaya çalışırken kullandığı ayrıştırıcı
// JPEG'e özgü SOI/APP1 marker yapısını arıyor ve HEIC'in tamamen farklı
// (ISO-BMFF) kutu yapısında bunu bulamayınca "not a valid JPEG" ile
// başarısız oluyor. Bu bozuk ön adım + kütüphanenin "hedef boyuta inene
// kadar tekrar tekrar küçült" iteratif algoritması bir araya gelince,
// çözünürlük gereğinden çok küçülürken dosya boyutu yine de hedefin
// üstünde kalabiliyor (küçük çözünürlükte anormal büyük dosya).
// iOS'un dosya seçicisi bazı durumlarda MIME type'ı boş/generic
// bildirdiği için uzantıya da bakıyoruz.
function heicMi(dosya) {
  const tip = (dosya.type || '').toLowerCase()
  if (tip === 'image/heic' || tip === 'image/heif') return true
  const ad = (dosya.name || '').toLowerCase()
  return ad.endsWith('.heic') || ad.endsWith('.heif')
}

// HEIC/HEIF dosyasını, browser-image-compression'a vermeden ÖNCE JPEG'e
// çevirir — bu sayede kütüphane hep bildiği, JPEG'e özgü EXIF/çözümleme
// mantığıyla çalışan bir girdi görür. heic2any (WASM tabanlı libheif)
// yalnızca gerçekten HEIC/HEIF geldiğinde, dinamik import ile yüklenir —
// JPEG/PNG/WebP yüklemelerinin paket boyutunu etkilemez.
async function heicToJpegDonustur(dosya) {
  const { default: heic2any } = await import('heic2any')
  const sonuc = await heic2any({ blob: dosya, toType: 'image/jpeg', quality: 0.92 })
  const blob = Array.isArray(sonuc) ? sonuc[0] : sonuc
  const yeniAd = dosya.name.replace(/\.[^./\\]+$/, '') + '.jpg'
  return new File([blob], yeniAd, { type: 'image/jpeg' })
}

// Seçilen dosyayı 1600px'i aşmayacak, ~300-350 KB hedefli WebP'ye çevirir.
// Zaten küçük dosyalar da WebP'ye çevrilir ama büyütülmez (kütüphane
// varsayılan olarak yukarı ölçeklemez). HEIC/HEIF girdiler önce JPEG'e
// çevrilir (bkz. heicToJpegDonustur), diğer formatlar doğrudan işlenir.
// Hata durumunda fırlatır.
export async function gorselSikistir(dosya) {
  if (!dosya.type?.startsWith('image/') && !heicMi(dosya)) {
    throw new Error('Yalnızca görsel dosyaları yüklenebilir (JPG, PNG, WebP vb.).')
  }
  if (dosya.size > MAKS_DOSYA_BOYUTU) {
    throw new Error('Dosya çok büyük (15 MB üstü). Lütfen daha küçük bir görsel seçin.')
  }

  const orijinalBoyut = dosya.size
  let islenecekDosya = dosya

  if (heicMi(dosya)) {
    try {
      islenecekDosya = await heicToJpegDonustur(dosya)
    } catch {
      throw new Error(
        'HEIC/HEIF görseli işlenemedi. Lütfen görseli iPhone Fotoğraflar uygulamasında "Kopyala" ile JPEG olarak paylaşıp tekrar deneyin.'
      )
    }
  }

  let sikistirilmis
  try {
    sikistirilmis = await imageCompression(islenecekDosya, {
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
