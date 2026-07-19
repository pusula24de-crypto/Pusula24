import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HaberIcerik from '@/components/HaberIcerik'
import SiradakiHaberAkisi from '@/components/SiradakiHaberAkisi'

export const revalidate = 300

const SITE_URL = 'https://www.pusula24.de'

async function haberGetir(slug) {
  const supabase = await createClient()
  const { data: haber } = await supabase
    .from('haberler')
    .select('*, kategoriler(ad, slug)')
    .eq('slug', slug)
    .eq('durum', 'published')
    .lte('yayin_tarihi', new Date().toISOString())
    .single()
  return haber
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const haber = await haberGetir(slug)
  if (!haber) return {}

  return {
    title: haber.baslik,
    description: haber.ozet,
    alternates: {
      canonical: `${SITE_URL}/haber/${haber.slug}`,
    },
    openGraph: {
      title: haber.baslik,
      description: haber.ozet,
      type: 'article',
      publishedTime: haber.yayin_tarihi,
      modifiedTime: haber.updated_at || haber.yayin_tarihi,
      images: haber.gorsel_url ? [haber.gorsel_url] : [],
    },
  }
}

export default async function HaberDetay({ params }) {
  const { slug } = await params
  const haber = await haberGetir(slug)

  if (!haber) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: haber.baslik,
    description: haber.ozet,
    image: haber.gorsel_url ? [haber.gorsel_url] : [],
    datePublished: haber.yayin_tarihi,
    dateModified: haber.updated_at || haber.yayin_tarihi,
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
