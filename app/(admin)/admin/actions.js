'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { markdownNormalizeEt } from '@/lib/markdownNormalize'

const GALERI_MAKS = 10

async function yetkiKontrolu() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Yetkisiz işlem girişimi!')
  return user
}

export async function haberKaydet(formData) {
  const user = await yetkiKontrolu()
  const supabase = await createClient()

  const id = formData.get('id')
  const baslik = formData.get('baslik')
  const ozet = formData.get('ozet')
  const govde = markdownNormalizeEt(formData.get('govde'))
  const slug = formData.get('slug')
  const kategori_id = formData.get('kategori_id')
  const gorsel_url = formData.get('gorsel_url')
  const ai_gorsel_mi = formData.get('ai_gorsel_mi') === 'true'
  const durum = formData.get('durum')
  const kaynak_adi = formData.get('kaynak_adi')?.trim() || null
  const kaynak_url = formData.get('kaynak_url')?.trim() || null
  const seo_etiketleri = formData.get('seo_etiketleri')?.trim() || null
  const gorsel_kaynak_notu = formData.get('gorsel_kaynak_notu')?.trim() || null
  const yayin_zamani = formData.get('yayin_zamani')

  // Ek kategoriler: virgülle ayrılmış id listesi. Ana Kategori'yle mükerrer
  // olmasın diye burada da (form tarafındaki filtrelemeye ek olarak) süzülür.
  const anaKategoriId = kategori_id ? parseInt(kategori_id) : null
  const ekKategoriIdler = (formData.get('ek_kategori_id_listesi') || '')
    .split(',')
    .map((s) => parseInt(s, 10))
    .filter((n) => Number.isInteger(n) && n !== anaKategoriId)
  const ekKategoriIdlerTekil = [...new Set(ekKategoriIdler)]

  // Galeri: admin formunda JSON dizisi olarak biriktirilip tek alanda
  // gönderilir (her öğe kendi ai_gorsel_mi/gorsel_kaynak_notu'una sahip
  // olduğundan comma-join yetmez, ek kategorilerdeki gibi).
  let galeriListesi = []
  try {
    galeriListesi = JSON.parse(formData.get('galeri_json') || '[]')
  } catch {
    galeriListesi = []
  }

  // Zamanlanmış yayın: ileri bir tarih/saat seçildiyse haber otomatik
  // 'published' olur ama yayin_tarihi o gelecek zamana ayarlanır. Site
  // sorguları yayin_tarihi <= şimdi filtresi uyguladığı için haber, saati
  // gelene kadar hiçbir yerde görünmez.
  //
  // ÖNEMLİ: yayin_zamani formdan ZATEN UTC ISO string olarak gelir (admin
  // sayfası tarayıcıda new Date(...).toISOString() ile çeviriyor). Burada
  // ham datetime-local string'i (saat dilimi bilgisi taşımayan "YYYY-MM-
  // DDTHH:mm" formatı) new Date() ile parse ETMEYİN — sunucu (Vercel/Node,
  // genelde UTC) bunu KENDİ saat dilimiyle yorumlar, tarayıcının yerel saat
  // diliminden farklıysa (örn. CEST = UTC+2) saat kayması oluşur. Haberi
  // hiç değiştirmeden yeniden kaydetmek bile yayin_tarihi'ni ileri kaydırıp
  // haberi (henüz gelmemiş bir gelecek zamanla) fiilen görünmez yapardı.
  let durumSon = durum
  let yayin_tarihi
  if (yayin_zamani) {
    yayin_tarihi = new Date(yayin_zamani).toISOString()
    durumSon = 'published'
  } else if (durum === 'published') {
    yayin_tarihi = new Date().toISOString()
  } else {
    yayin_tarihi = null
  }

  const veri = {
    baslik,
    ozet,
    govde,
    slug,
    kategori_id: kategori_id ? parseInt(kategori_id) : null,
    gorsel_url,
    ai_gorsel_mi,
    durum: durumSon,
    kaynak_adi,
    kaynak_url,
    seo_etiketleri,
    gorsel_kaynak_notu,
    yazar_id: user.id,
    yayin_tarihi,
  }

  let dbError
  let haberId = id ? parseInt(id) : null
  if (id) {
    const { error } = await supabase.from('haberler').update(veri).eq('id', id)
    dbError = error
  } else {
    const { data, error } = await supabase.from('haberler').insert([veri]).select('id').single()
    dbError = error
    haberId = data?.id ?? null
  }

  if (dbError) {
    if (dbError.code === '23505') return { success: false, error: 'Bu URL Slug zaten başka bir haberde kullanılıyor!' }
    return { success: false, error: dbError.message }
  }

  // Ek kategoriler: en temizi — önce bu habere ait eski kayıtları sil,
  // sonra (varsa) yeni seçilenleri ekle. Ana Kategori'ye (haberler.
  // kategori_id) dokunulmaz, o ayrı ve zorunlu alan olarak kalır.
  if (haberId) {
    const { error: silmeHatasi } = await supabase
      .from('haber_kategorileri')
      .delete()
      .eq('haber_id', haberId)

    if (silmeHatasi) return { success: false, error: 'Ek kategoriler güncellenemedi: ' + silmeHatasi.message }

    if (ekKategoriIdlerTekil.length > 0) {
      const { error: eklemeHatasi } = await supabase
        .from('haber_kategorileri')
        .insert(ekKategoriIdlerTekil.map((kid) => ({ haber_id: haberId, kategori_id: kid })))

      if (eklemeHatasi) return { success: false, error: 'Ek kategoriler kaydedilemedi: ' + eklemeHatasi.message }
    }

    // Galeri: aynı delete-then-insert deseni — önce bu habere ait eski
    // galeri satırları silinir, sonra güncel liste sira (dizi index'i) ile
    // yeniden eklenir. Ana görsele (haberler.gorsel_url) dokunulmaz.
    const { error: galeriSilmeHatasi } = await supabase
      .from('haber_galeri')
      .delete()
      .eq('haber_id', haberId)

    if (galeriSilmeHatasi) return { success: false, error: 'Galeri güncellenemedi: ' + galeriSilmeHatasi.message }

    const galeriSatirlari = galeriListesi
      .filter((g) => g?.gorsel_url)
      .slice(0, GALERI_MAKS)
      .map((g, i) => ({
        haber_id: haberId,
        gorsel_url: g.gorsel_url,
        sira: i,
        ai_gorsel_mi: !!g.ai_gorsel_mi,
        gorsel_kaynak_notu: g.gorsel_kaynak_notu?.trim() || null,
      }))

    if (galeriSatirlari.length > 0) {
      const { error: galeriEklemeHatasi } = await supabase.from('haber_galeri').insert(galeriSatirlari)
      if (galeriEklemeHatasi) return { success: false, error: 'Galeri kaydedilemedi: ' + galeriEklemeHatasi.message }
    }
  }

  revalidatePath('/')
  revalidatePath(`/haber/${slug}`)
  revalidatePath('/kategori/[slug]', 'page')

  return { success: true }
}

export async function haberSil(id, slug) {
  await yetkiKontrolu()
  const supabase = await createClient()

  const { error } = await supabase.from('haberler').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/')
  revalidatePath(`/haber/${slug}`)
  return { success: true }
}

export async function kategoriEkle(ad, slug, gorsel_url, gorsel_kaynak_notu) {
  await yetkiKontrolu()
  const supabase = await createClient()

  const { data: mevcutlar } = await supabase.from('kategoriler').select('sira')
  const maxSira = (mevcutlar || []).reduce((maks, k) => Math.max(maks, k.sira || 0), 0)

  const { error } = await supabase
    .from('kategoriler')
    .insert([{
      ad,
      slug,
      sira: maxSira + 1,
      gorsel_url: gorsel_url || null,
      gorsel_kaynak_notu: gorsel_kaynak_notu?.trim() || null,
    }])
  if (error) return { success: false, error: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function kategoriGorselGuncelle(id, gorsel_url, gorsel_kaynak_notu) {
  await yetkiKontrolu()
  const supabase = await createClient()

  const { error } = await supabase
    .from('kategoriler')
    .update({
      gorsel_url: gorsel_url || null,
      gorsel_kaynak_notu: gorsel_kaynak_notu?.trim() || null,
    })
    .eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/kategori/[slug]', 'page')
  return { success: true }
}

export async function kategoriSil(id) {
  await yetkiKontrolu()
  const supabase = await createClient()

  const { error } = await supabase.from('kategoriler').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function ayarlariGetir() {
  // Okuma herkese açık (anon select). Tablo henüz yoksa boş obje döner.
  const supabase = await createClient()
  const { data, error } = await supabase.from('ayarlar').select('anahtar, deger')
  if (error || !data) return {}
  return Object.fromEntries(data.map((satir) => [satir.anahtar, satir.deger]))
}

export async function ayarlariKaydet(veri) {
  await yetkiKontrolu()
  const supabase = await createClient()

  const satirlar = Object.entries(veri).map(([anahtar, deger]) => ({
    anahtar,
    deger: deger ?? '',
  }))

  const { error } = await supabase
    .from('ayarlar')
    .upsert(satirlar, { onConflict: 'anahtar' })

  if (error) return { success: false, error: error.message }

  // Layout ayarları okuyup meta/AdSense bastığı için tüm sayfaları tazele.
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function kategoriSirasiDegistir(id, yon) {
  await yetkiKontrolu()
  const supabase = await createClient()

  const { data: kategoriler, error } = await supabase
    .from('kategoriler')
    .select('id, sira')
    .order('sira')

  if (error || !kategoriler) {
    return { success: false, error: error?.message || 'Kategoriler alınamadı' }
  }

  const index = kategoriler.findIndex((k) => k.id === id)
  if (index === -1) return { success: false, error: 'Kategori bulunamadı' }

  const komsuIndex = yon === 'yukari' ? index - 1 : index + 1
  if (komsuIndex < 0 || komsuIndex >= kategoriler.length) {
    return { success: false, error: 'Kategori zaten listenin ucunda' }
  }

  const bu = kategoriler[index]
  const komsu = kategoriler[komsuIndex]

  const [{ error: hata1 }, { error: hata2 }] = await Promise.all([
    supabase.from('kategoriler').update({ sira: komsu.sira }).eq('id', bu.id),
    supabase.from('kategoriler').update({ sira: bu.sira }).eq('id', komsu.id),
  ])

  if (hata1 || hata2) return { success: false, error: (hata1 || hata2).message }

  revalidatePath('/')
  return { success: true }
}
