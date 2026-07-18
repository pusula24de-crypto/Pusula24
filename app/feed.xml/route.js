import { createClient } from '@/lib/supabase/server'
import { SITE_URL } from '@/lib/site'

export const revalidate = 900

function xmlKacis(metin) {
  return String(metin || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Basit RSS 2.0 beslemesi — son 20 yayındaki haber (durum='published',
// yayin_tarihi <= now).
export async function GET() {
  const supabase = await createClient()
  const simdi = new Date().toISOString()

  const { data: haberler } = await supabase
    .from('haberler')
    .select('baslik, ozet, slug, yayin_tarihi')
    .eq('durum', 'published')
    .lte('yayin_tarihi', simdi)
    .order('yayin_tarihi', { ascending: false })
    .limit(20)

  const ogeler = (haberler || [])
    .map((h) => {
      const link = `${SITE_URL}/haber/${h.slug}`
      return `    <item>
      <title>${xmlKacis(h.baslik)}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description>${xmlKacis(h.ozet)}</description>
      <pubDate>${new Date(h.yayin_tarihi).toUTCString()}</pubDate>
    </item>`
    })
    .join('\n')

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Haberopa - Almanya Son Dakika Haberleri</title>
    <link>${SITE_URL}</link>
    <description>Almanya'da yaşayan Türk topluluğu için tarafsız, hızlı ve doğru haber portalı.</description>
    <language>tr</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
${ogeler}
  </channel>
</rss>`

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  })
}
