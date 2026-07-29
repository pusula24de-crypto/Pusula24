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
// bu formatı hiç tanımıyor; iOS'un dosya seçicisi bazı durumlarda MIME
// type'ı boş/generic bildirdiği için uzantıya da bakıyoruz. (NOT: web/
// uygulamalardan "Kaydet" ile inen görseller genelde HEIC'e çevrilmez,
// orijinal formatında — PNG/JPEG — kalır; bu fonksiyon o durumda false
// döner ve dosya doğrudan aşağıdaki normal akışa girer.)
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

// GERÇEK KÖK NEDEN (teşhis logларıyla doğrulandı — bkz. proje geçmişi):
// iOS Safari/WebKit'in <canvas>.toBlob() implementasyonu WebP ÇIKIŞINI
// (encode) desteklemiyor — HTML5 spesifikasyonu gereği desteklenmeyen bir
// fileType istendiğinde tarayıcı SESSİZCE PNG'ye düşer. Kütüphaneden
// `fileType: 'image/webp'` istesek bile geri dönen blob'un GERÇEK tipi
// hâlâ "image/png" olabiliyordu; eski kod bunu fark etmeden dosyayı
// ".webp" diye yeniden adlandırıp yanlış etiketliyordu — içerik gerçekte
// PNG (fotoğraf gibi içerikte WebP'den çok daha az verimli) kaldığından
// hedef boyuta inmek için çözünürlük anormal küçülüyor, yine de dosya
// beklenenden büyük kalıyordu (örn. "552x685px, 632KB").
//
// Çözüm: WebP çıkışını tarayıcıda GERÇEKTEN destekleniyor mu diye önce
// (bir kere) sınıyoruz; desteklenmiyorsa hedefi doğrudan JPEG'e
// düşürüyoruz (canvas JPEG encode desteği evrensel). Kütüphaneden dönen
// blob'un GERÇEK tipini de her zaman kontrol edip dosya adını/etiketini
// ona göre veriyoruz — bir daha asla "aslında X ama Y diye etiketlenmiş"
// durumu oluşmasın.
let webpCikisDesteginiOnbellek = null

async function webpCikisDestekleniyorMu() {
  if (webpCikisDesteginiOnbellek !== null) return webpCikisDesteginiOnbellek
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 2
    canvas.height = 2
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/webp'))
    webpCikisDesteginiOnbellek = !!blob && blob.type === 'image/webp'
  } catch {
    webpCikisDesteginiOnbellek = false
  }
  return webpCikisDesteginiOnbellek
}

function uzantiVer(mimeTipi) {
  if (mimeTipi === 'image/webp') return '.webp'
  if (mimeTipi === 'image/jpeg') return '.jpg'
  if (mimeTipi === 'image/png') return '.png'
  return ''
}

// WebP encode'u tarayıcıda desteklenmiyorsa (ör. iOS Safari/WebKit), dosyayı
// /api/gorsel-webp'e yollar — orada sharp ile 1600px + GERÇEK WebP'ye
// çevrilir. Masaüstündeki (tarayıcı-webp) yolla AYNI kalitede sonuç verir;
// istemcide ayrıca kayıplı bir ön-sıkıştırma YAPILMAZ (bkz. gorselSikistir'
// deki yorum — çifte kayıplı geçiş JPEG'e özgü gren/blok artefaktlarını
// sabitler, masaüstüne göre görünür kalite farkına yol açardı).
async function sunucudaWebpeCevir(dosya) {
  const formData = new FormData()
  formData.append('dosya', dosya, dosya.name)

  const yanit = await fetch('/api/gorsel-webp', { method: 'POST', body: formData })
  if (!yanit.ok) {
    const hataVerisi = await yanit.json().catch(() => ({}))
    throw new Error(hataVerisi.error || 'Görsel sunucuda işlenemedi.')
  }
  return yanit.blob()
}

// Seçilen dosyayı 1600px'i aşmayacak, ~300-350 KB hedefli, GERÇEK bir
// WebP'ye çevirir (tarayıcı canvas'ta WebP encode edebiliyorsa istemcide,
// edemiyorsa sharp ile sunucuda — bkz. sunucudaWebpeCevir). Zaten küçük
// dosyalar da çevrilir ama büyütülmez. HEIC/HEIF girdiler önce JPEG'e
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

  const webpDestekli = await webpCikisDestekleniyorMu()

  if (!webpDestekli) {
    const webpBlob = await sunucudaWebpeCevir(islenecekDosya)
    const yeniAd = dosya.name.replace(/\.[^./\\]+$/, '') + '.webp'
    const cikisDosyasi = new File([webpBlob], yeniAd, { type: 'image/webp' })
    return { dosya: cikisDosyasi, orijinalBoyut, yeniBoyut: cikisDosyasi.size }
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

  // Kütüphane yine de istenenden FARKLI bir tip döndürebilir (webp
  // destekliyoruz sandığımız ama uçta beklenmedik bir sınırlama olan bir
  // durum) — dosyayı HER ZAMAN blob'un gerçek tipiyle etiketliyoruz, asla
  // varsayılan hedefle değil.
  const gercekTip = sikistirilmis.type || 'image/webp'
  const uzanti = uzantiVer(gercekTip) || '.webp'
  const yeniAd = dosya.name.replace(/\.[^./\\]+$/, '') + uzanti
  const cikisDosyasi = new File([sikistirilmis], yeniAd, { type: gercekTip })

  return { dosya: cikisDosyasi, orijinalBoyut, yeniBoyut: cikisDosyasi.size }
}
