'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { markdownNormalizeEt, satirSonuNormalizeEt } from '@/lib/markdownNormalize'

async function yetkiKontrolu() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) throw new Error('Yetkisiz işlem girişimi!')
  return user
}

export async function rehberKaydet(formData) {
  const user = await yetkiKontrolu()
  const supabase = await createClient()

  const id = formData.get('id')
  const baslik = formData.get('baslik')
  const slug = formData.get('slug')
  const kategori = formData.get('kategori')
  const ozet = formData.get('ozet')
  const govde = markdownNormalizeEt(formData.get('govde'))
  const gorsel_url = formData.get('gorsel_url')
  const ai_gorsel_mi = formData.get('ai_gorsel_mi') === 'true'
  const gorsel_kaynak_notu = formData.get('gorsel_kaynak_notu')?.trim() || null
  const seo_etiketleri = formData.get('seo_etiketleri')?.trim() || null
  const durum = formData.get('durum')

  // SSS: admin formunda JSON dizisi olarak biriktirilip tek alanda
  // gönderilir. Cevap metinleri govde/sosyal medya alanlarıyla aynı
  // sebepten satirSonuNormalizeEt'ten geçer (FormData/multipart
  // serileştirmesi çok satırlı metinlere "\r" enjekte edebiliyor).
  let sssListesi = []
  try {
    sssListesi = JSON.parse(formData.get('sss_json') || '[]')
  } catch {
    sssListesi = []
  }
  const sss = sssListesi
    .filter((s) => s?.soru?.trim() && s?.cevap?.trim())
    .map((s) => ({ soru: s.soru.trim(), cevap: satirSonuNormalizeEt(s.cevap) || '' }))

  // Son Güncelleme Tarihi formdan zaten UTC ISO string olarak gelir (admin
  // sayfası tarayıcıda new Date(...).toISOString() ile çeviriyor — haberlerin
  // yayin_zamani mantığıyla AYNI, saat dilimi kaymasını önlemek için).
  const sonGuncellemeHam = formData.get('son_guncelleme_tarihi')
  const son_guncelleme_tarihi = sonGuncellemeHam
    ? new Date(sonGuncellemeHam).toISOString()
    : new Date().toISOString()

  const veri = {
    baslik,
    slug,
    kategori,
    ozet,
    govde,
    gorsel_url,
    ai_gorsel_mi,
    gorsel_kaynak_notu,
    sss,
    son_guncelleme_tarihi,
    durum,
    seo_etiketleri,
    yazar_id: user.id,
    updated_at: new Date().toISOString(),
  }

  let dbError
  let rehberId = id ? parseInt(id) : null
  if (id) {
    // ilk_yayin_tarihi düzenlemede HİÇ dokunulmaz — yalnızca oluşturmada
    // yazılır, sonraki her düzenleme orijinal tarihi korur.
    const { error } = await supabase.from('rehberler').update(veri).eq('id', id)
    dbError = error
  } else {
    const { data, error } = await supabase
      .from('rehberler')
      .insert([{ ...veri, ilk_yayin_tarihi: new Date().toISOString() }])
      .select('id')
      .single()
    dbError = error
    rehberId = data?.id ?? null
  }

  if (dbError) {
    if (dbError.code === '23505') return { success: false, error: 'Bu URL Slug zaten başka bir rehberde kullanılıyor!' }
    return { success: false, error: dbError.message }
  }

  revalidatePath('/')
  revalidatePath('/rehberler')
  revalidatePath(`/rehber/${slug}`)

  return { success: true, id: rehberId }
}

export async function rehberSil(id, slug) {
  await yetkiKontrolu()
  const supabase = await createClient()

  const { error } = await supabase.from('rehberler').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/')
  revalidatePath('/rehberler')
  revalidatePath(`/rehber/${slug}`)
  return { success: true }
}
