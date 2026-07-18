import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import HaberKart from '@/components/HaberKart'
import KategoriIkon from '@/lib/kategoriIkonlari'

export const revalidate = 300

const SITE_URL = 'https://haberopa.com'

// Kategori hero görselleri — slug bazlı sabit temsili görseller.
// Gerçek görseller elde edilince buradaki URL'ler değiştirilebilir.
const KATEGORI_GORSELLERI = {
  almanya: 'https://picsum.photos/seed/haberopa-almanya/1600/500',
  avrupa: 'https://picsum.photos/seed/haberopa-avrupa/1600/500',
  dunya: 'https://picsum.photos/seed/haberopa-dunya/1600/500',
  'kultur-sanat': 'https://picsum.photos/seed/haberopa-kultur-sanat/1600/500',
  spor: 'https://picsum.photos/seed/haberopa-spor/1600/500',
  turkiye: 'https://picsum.photos/seed/haberopa-turkiye/1600/500',
  yasam: 'https://picsum.photos/seed/haberopa-yasam/1600/500',
}

function kategoriGorseliGetir(slug) {
  return KATEGORI_GORSELLERI[slug] || `https://picsum.photos/seed/haberopa-${slug}/1600/500`
}

async function kategoriGetir(slug) {
  const supabase = await createClient()
  const { data: kategori, error } = await supabase
    .from('kategoriler')
    .select('id, ad, slug, gorsel_url')
    .eq('slug', slug)
    .single()

  if (error) {
    // gorsel_url kolonu henüz eklenmemişse (SQL çalıştırılmadan önce) sayfa
    // 404'e düşmesin — geriye dönük uyumlu sorguya düş.
    const { data: yedek } = await supabase
      .from('kategoriler')
      .select('id, ad, slug')
      .eq('slug', slug)
      .single()
    return yedek
  }

  return kategori
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const kategori = await kategoriGetir(slug)
  if (!kategori) return {}

  return {
    title: `${kategori.ad} Haberleri | Haberopa`,
    description: `${kategori.ad} kategorisindeki en güncel haberler.`,
    alternates: {
      canonical: `${SITE_URL}/kategori/${kategori.slug}`,
    },
  }
}

export default async function KategoriSayfasi({ params }) {
  const { slug } = await params
  const kategori = await kategoriGetir(slug)
  if (!kategori) notFound()

  const supabase = await createClient()
  const simdi = new Date().toISOString()
  const { data: haberler } = await supabase
    .from('haberler')
    .select('id, baslik, slug, gorsel_url, ai_gorsel_mi, yayin_tarihi, kategoriler(ad, slug)')
    .eq('durum', 'published')
    .lte('yayin_tarihi', simdi)
    .eq('kategori_id', kategori.id)
    .order('yayin_tarihi', { ascending: false })
    .limit(60)

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="relative mb-8 flex h-48 items-end overflow-hidden rounded-lg md:h-64">
        <img
          src={kategori.gorsel_url || kategoriGorseliGetir(kategori.slug)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/50" />
        <h1 className="relative flex items-center gap-3 p-6 font-heading text-3xl font-black tracking-tight text-white md:text-5xl">
          <KategoriIkon slug={kategori.slug} size={36} className="text-red-500" />
          {kategori.ad}
        </h1>
      </div>

      {haberler && haberler.length > 0 ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {haberler.map((h) => (
            <HaberKart key={h.id} haber={h} />
          ))}
        </div>
      ) : (
        <p className="py-16 text-center text-neutral-500">
          Bu kategoride henüz yayınlanmış haber bulunmuyor.
        </p>
      )}
    </main>
  )
}
