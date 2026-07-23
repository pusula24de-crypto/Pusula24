import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HaberIcerik from '@/components/HaberIcerik'
import SiradakiHaberAkisi from '@/components/SiradakiHaberAkisi'

export const revalidate = 300

const SITE_URL = 'https://www.pusula24.de'

// Admin panelde virgülle ayrılmış ham metin olarak saklanan SEO
// etiketlerini ("Kindergeld, çocuk parası, ...") temiz bir diziye çevirir.
// Boş/tekrar eden boşluklu girdileri eler; hiç etiket yoksa boş dizi döner.
function etiketleriAyristir(seo_etiketleri) {
  if (!seo_etiketleri) return []
  return seo_etiketleri
    .split(',')
    .map((etiket) => etiket.trim())
    .filter(Boolean)
}

async function haberGetir(slug) {
  const supabase = await createClient()
  const { data: haber } = await supabase
    .from('haberler')
    .select('*, kategoriler!haberler_kategori_id_fkey(ad, slug)')
    .eq('slug', slug)
    .eq('durum', 'published')
    .lte('yayin_tarihi', new Date().toISOString())
    .single()

  if (!haber) return haber

  // Ek kategoriler (opsiyonel, sade rozet için) — ayrı ilişki tablosundan.
  const { data: ekKategoriSatirlari } = await supabase
    .from('haber_kategorileri')
    .select('kategoriler(ad, slug)')
    .eq('haber_id', haber.id)

  haber.ek_kategoriler = (ekKategoriSatirlari || []).map((s) => s.kategoriler).filter(Boolean)

  // Galeri (opsiyonel, çoklu görsel) — ayrı bir tablodan sira sırasına göre.
  const { data: galeriSatirlari } = await supabase
    .from('haber_galeri')
    .select('id, gorsel_url, ai_gorsel_mi, gorsel_kaynak_notu')
    .eq('haber_id', haber.id)
    .order('sira')

  haber.galeri = galeriSatirlari || []

  return haber
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const haber = await haberGetir(slug)
  if (!haber) return {}

  const etiketler = etiketleriAyristir(haber.seo_etiketleri)

  // og:image ve twitter:image, haberin ham fotoğrafı yerine markalı sosyal
  // görsel motorunun ürettiği 1080x1350 PNG'ye işaret eder (manşet + logo +
  // kategori çipi içerir, paylaşımlarda daha tanınır/tutarlı görünür).
  const sosyalGorselUrl = `${SITE_URL}/api/sosyal-gorsel/${haber.id}`

  return {
    title: haber.baslik,
    description: haber.ozet,
    ...(etiketler.length > 0 ? { keywords: etiketler } : {}),
    alternates: {
      canonical: `${SITE_URL}/haber/${haber.slug}`,
    },
    openGraph: {
      title: haber.baslik,
      description: haber.ozet,
      type: 'article',
      publishedTime: haber.yayin_tarihi,
      modifiedTime: haber.updated_at || haber.yayin_tarihi,
      images: [
        {
          url: sosyalGorselUrl,
          width: 1080,
          height: 1350,
          type: 'image/png',
          alt: haber.baslik,
        },
      ],
    },
    // Kök layout'taki twitter bloğu (sabit logo) burada AÇIKÇA ezilir —
    // aksi halde bu sayfa da o statik logoyu miras alırdı (asıl bug buydu).
    twitter: {
      card: 'summary_large_image',
      title: haber.baslik,
      description: haber.ozet,
      images: [sosyalGorselUrl],
    },
  }
}

export default async function HaberDetay({ params }) {
  const { slug } = await params
  const haber = await haberGetir(slug)

  if (!haber) notFound()

  const etiketler = etiketleriAyristir(haber.seo_etiketleri)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: haber.baslik,
    description: haber.ozet,
    image: haber.gorsel_url ? [haber.gorsel_url] : [],
    datePublished: haber.yayin_tarihi,
    dateModified: haber.updated_at || haber.yayin_tarihi,
    ...(etiketler.length > 0 ? { keywords: etiketler.join(', ') } : {}),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${SITE_URL}/haber/${haber.slug}`,
    },
    author: [{ '@type': 'Organization', name: 'Pusula24' }],
    publisher: {
      '@type': 'Organization',
      name: 'Pusula24',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/marka/logo-yatay-renkli.png`,
      },
      sameAs: [
        'https://facebook.com/pusula24de',
        'https://instagram.com/pusula24de',
        'https://x.com/pusula24de',
        'https://www.youtube.com/channel/UCT9mC98WdJMWdpTZefDegkQ',
        'https://tiktok.com/@pusula24de',
      ],
    },
  }

  return (
    <main className="pb-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article
        className="mx-auto max-w-3xl px-4 pt-10"
        data-haber-slug={haber.slug}
        data-haber-baslik={haber.baslik}
      >
        <HaberIcerik haber={haber} oncelikli />
      </article>

      <SiradakiHaberAkisi ilkId={haber.id} ilkSlug={haber.slug} ilkBaslik={haber.baslik} />
    </main>
  )
}
