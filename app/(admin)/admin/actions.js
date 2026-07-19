'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { markdownNormalizeEt } from '@/lib/markdownNormalize'

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
  const yayin_zamani = formData.get('yayin_zamani')

  // Zamanlanmış yayın: ileri bir tarih/saat seçildiyse haber otomatik
  // 'published' olur ama yayin_tarihi o gelecek zamana ayarlanır. Site
  // sorguları yayin_tarihi <= şimdi filtresi uyguladığı için haber, saati
  // gelene kadar hiçbir yerde görünmez.
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
    yazar_id: user.id,
    yayin_tarihi,
  }

  let dbError
  if (id) {
    const { error } = await supabase.from('haberler').update(veri).eq('id', id)
    dbError = error
  } else {
    const { error } = await supabase.from('haberler').insert([veri])
    dbError = error
  }

  if (dbError) {
    if (dbError.code === '23505') return { success: false, error: 'Bu URL Slug zaten başka bir haberde kullanılıyor!' }
    return { success: false, error: dbError.message }
  }

  revalidatePath('/')
  revalidatePath(`/haber/${slug}`)

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

export async function kategoriEkle(ad, slug, gorsel_url) {
  await yetkiKontrolu()
  const supabase = await createClient()

  const { data: mevcutlar } = await supabase.from('kategoriler').select('sira')
  const maxSira = (mevcutlar || []).reduce((maks, k) => Math.max(maks, k.sira || 0), 0)

  const { error } = await supabase
    .from('kategoriler')
    .insert([{ ad, slug, sira: maxSira + 1, gorsel_url: gorsel_url || null }])
  if (error) return { success: false, error: error.message }

  revalidatePath('/')
  return { success: true }
}

export async function kategoriGorselGuncelle(id, gorsel_url) {
  await yetkiKontrolu()
  const supabase = await createClient()

  const { error } = await supabase
    .from('kategoriler')
    .update({ gorsel_url: gorsel_url || null })
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
