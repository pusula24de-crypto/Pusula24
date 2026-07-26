import { notFound } from 'next/navigation'
import Link from 'next/link'
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { FaClockRotateLeft } from 'react-icons/fa6'
import { createClient } from '@/lib/supabase/server'
import { formatTarih } from '@/lib/format'
import PaylasimButonlari from '@/components/PaylasimButonlari'
import RehberSSS from '@/components/RehberSSS'
import { SITE_URL } from '@/lib/site'

export const revalidate = 300

// Admin panelde virgülle ayrılmış ham metin olarak saklanan SEO
// etiketlerini temiz bir diziye çevirir — haber/[slug]'daki mantıkla aynı.
function etiketleriAyristir(seo_etiketleri) {
  if (!seo_etiketleri) return []
  return seo_etiketleri
    .split(',')
    .map((etiket) => etiket.trim())
    .filter(Boolean)
}

async function rehberGetir(slug) {
  const supabase = await createClient()
  const { data: rehber } = await supabase
    .from('rehberler')
    .select('*')
    .eq('slug', slug)
    .eq('durum', 'published')
    .single()
  return rehber
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const rehber = await rehberGetir(slug)
  if (!rehber) return {}

  const etiketler = etiketleriAyristir(rehber.seo_etiketleri)

  return {
    title: `${rehber.baslik} | Pusula24 Rehberler`,
    description: rehber.ozet,
    ...(etiketler.length > 0 ? { keywords: etiketler } : {}),
    alternates: {
      canonical: `${SITE_URL}/rehber/${rehber.slug}`,
    },
    openGraph: {
      title: rehber.baslik,
      description: rehber.ozet,
      type: 'article',
      publishedTime: rehber.ilk_yayin_tarihi,
      modifiedTime: rehber.son_guncelleme_tarihi,
      ...(rehber.gorsel_url
        ? { images: [{ url: rehber.gorsel_url, alt: rehber.baslik }] }
        : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: rehber.baslik,
      description: rehber.ozet,
      ...(rehber.gorsel_url ? { images: [rehber.gorsel_url] } : {}),
    },
  }
}

export default async function RehberDetay({ params }) {
  const { slug } = await params
  const rehber = await rehberGetir(slug)
  if (!rehber) notFound()

  const paylasimUrl = `${SITE_URL}/rehber/${rehber.slug}`
  const sss = Array.isArray(rehber.sss) ? rehber.sss : []

  // Article şeması + (SSS varsa) FAQPage şeması — Google'ın zengin
  // sonuçlarında (rich results) çıkma şansını artırır. sss'teki soru/cevap
  // çiftlerinden otomatik üretilir, admin formunda ayrı bir işlem gerekmez.
  const jsonLdBlocklari = [
    {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: rehber.baslik,
      description: rehber.ozet,
      image: rehber.gorsel_url ? [rehber.gorsel_url] : [],
      datePublished: rehber.ilk_yayin_tarihi,
      dateModified: rehber.son_guncelleme_tarihi,
      mainEntityOfPage: { '@type': 'WebPage', '@id': paylasimUrl },
      author: [{ '@type': 'Organization', name: 'Pusula24' }],
      publisher: {
        '@type': 'Organization',
        name: 'Pusula24',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/marka/logo-yatay-renkli.png` },
      },
    },
  ]

  if (sss.length > 0) {
    jsonLdBlocklari.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: sss.map((s) => ({
        '@type': 'Question',
        name: s.soru,
        acceptedAnswer: { '@type': 'Answer', text: s.cevap },
      })),
    })
  }

  return (
    <main className="pb-10">
      {jsonLdBlocklari.map((jsonLd, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      ))}

      <article className="mx-auto max-w-3xl px-4 pt-10">
        <nav className="mb-4 text-sm text-neutral-500">
          <Link href="/" className="hover:text-blue-600">Anasayfa</Link>
          <span className="mx-2">›</span>
          <Link href="/rehberler" className="hover:text-blue-600">Rehberler</Link>
          <span className="mx-2">›</span>
          <Link
            href={`/rehberler?kategori=${encodeURIComponent(rehber.kategori)}`}
            className="hover:text-blue-600"
          >
            {rehber.kategori}
          </Link>
        </nav>

        <div className="space-y-4">
          <span className="inline-block text-xs font-bold uppercase tracking-wide text-blue-600">
            {rehber.kategori}
          </span>
          <h1 className="font-heading text-4xl font-black leading-tight text-neutral-900 md:text-5xl">
            {rehber.baslik}
          </h1>
          {rehber.ozet && (
            <p className="border-l-4 border-blue-600 pl-4 text-xl text-neutral-600">{rehber.ozet}</p>
          )}
          {/* Bilinçli olarak haberlerin (kırmızı, "Yayıncı: ...") künye
              stilinden farklı: mavi rozet + "güncelleme" ikonu, bu içeriğin
              tek seferlik bir haber değil, düzenli güncel tutulan bir
              kaynak olduğunu görsel olarak anlatır. */}
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-semibold text-blue-700">
            <FaClockRotateLeft size={14} />
            Son güncelleme: {formatTarih(rehber.son_guncelleme_tarihi)}
          </div>
        </div>

        <PaylasimButonlari url={paylasimUrl} baslik={rehber.baslik} className="mt-4" />

        {rehber.gorsel_url && (
          <figure className="mt-6">
            <div className="relative aspect-16/9 overflow-hidden rounded-lg bg-neutral-100">
              <img
                src={rehber.gorsel_url}
                alt={rehber.baslik}
                loading="eager"
                className="h-full w-full object-cover"
              />
            </div>
            {rehber.ai_gorsel_mi ? (
              <figcaption className="mt-2 text-center text-xs italic text-neutral-500">
                Görsel: KI-generiert · Symbolbild — yapay zekâ ile üretilmiş temsili görsel
              </figcaption>
            ) : (
              rehber.gorsel_kaynak_notu && (
                <figcaption className="mt-2 text-center text-xs italic text-neutral-500">
                  Fotoğraf: {rehber.gorsel_kaynak_notu}
                </figcaption>
              )
            )}
          </figure>
        )}

        <article className="prose prose-lg prose-headings:font-heading prose-a:text-blue-600 hover:prose-a:text-blue-700 mx-auto mt-8 max-w-2xl">
          <Markdown remarkPlugins={[remarkBreaks]}>{rehber.govde}</Markdown>
        </article>

        <RehberSSS sss={sss} />

        <div className="mx-auto mt-8 max-w-2xl border-t border-neutral-200 pt-6">
          <PaylasimButonlari url={paylasimUrl} baslik={rehber.baslik} />
        </div>
      </article>
    </main>
  )
}
