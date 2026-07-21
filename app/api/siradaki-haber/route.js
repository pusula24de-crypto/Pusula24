import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

const HABER_ALANLARI =
  'id, baslik, ozet, slug, govde, gorsel_url, ai_gorsel_mi, gorsel_kaynak_notu, yayin_tarihi, kaynak_adi, kaynak_url, kategori_id, kategoriler!haberler_kategori_id_fkey(ad, slug)'

// Sıradaki (daha eski) yayınlanmış haberi döndürür. Öncelik: aynı kategorideki
// bir önceki haber; kategori tükenirse genel akıştan devam. Zaten gösterilen
// haberler `exclude` ile elenir. durum='published' VE yayin_tarihi <= now şart.
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')
  const excludeParam = searchParams.get('exclude') || ''

  if (!slug) {
    return NextResponse.json({ error: 'slug gerekli' }, { status: 400 })
  }

  const supabase = await createClient()
  const simdi = new Date().toISOString()

  const { data: mevcut } = await supabase
    .from('haberler')
    .select('id, yayin_tarihi, kategori_id')
    .eq('slug', slug)
    .eq('durum', 'published')
    .lte('yayin_tarihi', simdi)
    .single()

  if (!mevcut) {
    return NextResponse.json({ haber: null })
  }

  const haricIdler = [
    ...excludeParam.split(',').map((s) => parseInt(s, 10)).filter(Boolean),
    mevcut.id,
  ]
  const haricListe = `(${haricIdler.join(',')})`

  function temelSorgu() {
    return supabase
      .from('haberler')
      .select(HABER_ALANLARI)
      .eq('durum', 'published')
      .lte('yayin_tarihi', simdi)
      .lte('yayin_tarihi', mevcut.yayin_tarihi)
      .not('id', 'in', haricListe)
      .order('yayin_tarihi', { ascending: false })
      .limit(1)
  }

  // 1) Aynı kategoriden daha eski bir haber
  let siradaki = null
  if (mevcut.kategori_id) {
    const { data } = await temelSorgu().eq('kategori_id', mevcut.kategori_id)
    siradaki = data?.[0] || null
  }

  // 2) Kategori tükendiyse genel akıştan devam
  if (!siradaki) {
    const { data } = await temelSorgu()
    siradaki = data?.[0] || null
  }

  // Ek kategoriler (opsiyonel, sade rozet için) — ana sayfa render'ıyla tutarlı olsun diye.
  if (siradaki) {
    const { data: ekKategoriSatirlari } = await supabase
      .from('haber_kategorileri')
      .select('kategoriler(ad, slug)')
      .eq('haber_id', siradaki.id)
    siradaki.ek_kategoriler = (ekKategoriSatirlari || []).map((s) => s.kategoriler).filter(Boolean)
  }

  return NextResponse.json({ haber: siradaki })
}
