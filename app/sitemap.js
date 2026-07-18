import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/site'

export const revalidate = 900

// Dinamik sitemap: anasayfa + tüm kategori sayfaları + yayındaki tüm haberler
// (durum='published' VE yayin_tarihi <= now). lastModified önceliği:
// updated_at → yoksa yayin_tarihi.
export default async function sitemap() {
  const supabase = await createClient()
  const simdi = new Date()
  const simdiIso = simdi.toISOString()

  const [{ data: haberler }, { data: kategoriler }] = await Promise.all([
    supabase
      .from('haberler')
      .select('slug, yayin_tarihi, updated_at')
      .eq('durum', 'published')
      .lte('yayin_tarihi', simdiIso)
      .order('yayin_tarihi', { ascending: false }),
    supabase.from('kategoriler').select('slug').order('sira'),
  ])

  const anasayfa = [
    {
      url: SITE_URL,
      lastModified: simdi,
      changeFrequency: 'hourly',
      priority: 1,
    },
  ]

  const kategoriUrlleri = (kategoriler || []).map((k) => ({
    url: `${SITE_URL}/kategori/${k.slug}`,
    lastModified: simdi,
    changeFrequency: 'daily',
    priority: 0.7,
  }))

  const haberUrlleri = (haberler || []).map((h) => ({
    url: `${SITE_URL}/haber/${h.slug}`,
    lastModified: new Date(h.updated_at || h.yayin_tarihi),
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  return [...anasayfa, ...kategoriUrlleri, ...haberUrlleri]
}
