import { gorselSikistir } from './gorselOptimizasyon'

// datetime-local <input> değeri (tarayıcının yerel saatini temsil eder, saat
// dilimi bilgisi taşımaz) üretmek için ISO string'i yerel saate çevirir.
export function isoToDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const yerelOfset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - yerelOfset).toISOString().slice(0, 16)
}

// Yüklemeden önce görseli tarayıcıda 1600px/WebP'ye sıkıştırır (bkz.
// lib/gorselOptimizasyon), sonra Supabase Storage'a atar. boyutBilgisi
// çağıran tarafın "1.6 MB → 210 KB" gibi bir geri bildirim göstermesi için
// dönülür. Admin panelindeki haber/kategori/galeri VE rehber görsel
// yüklemeleri aynı bu fonksiyonu, farklı `onEk` (dosya adı öneki) ile
// paylaşır — hepsi tek bir "haber-gorselleri" Storage bucket'ında tutulur.
export async function dosyaYukle(supabase, dosya, onEk = '') {
  let yuklenecekDosya
  let boyutBilgisi = null

  try {
    const sonuc = await gorselSikistir(dosya)
    yuklenecekDosya = sonuc.dosya
    boyutBilgisi = { orijinalBoyut: sonuc.orijinalBoyut, yeniBoyut: sonuc.yeniBoyut }
  } catch (err) {
    return { url: null, error: err.message, boyutBilgisi: null }
  }

  const guvenliAd = yuklenecekDosya.name.replace(/[^a-zA-Z0-9.\-_]/g, '-')
  const dosyaYolu = `${onEk}${Date.now()}-${guvenliAd}`

  const { error } = await supabase.storage
    .from('haber-gorselleri')
    .upload(dosyaYolu, yuklenecekDosya, { contentType: 'image/webp' })
  if (error) {
    const mesaj = error.message?.toLowerCase().includes('bucket not found')
      ? 'Storage bucket bulunamadı. Lütfen Supabase panelinden "haber-gorselleri" adında public bir bucket oluşturun.'
      : 'Görsel yüklenemedi: ' + error.message
    return { url: null, error: mesaj, boyutBilgisi: null }
  }

  const { data } = supabase.storage.from('haber-gorselleri').getPublicUrl(dosyaYolu)
  return { url: data.publicUrl, error: null, boyutBilgisi }
}
