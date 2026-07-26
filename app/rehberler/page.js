import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import RehberKart from '@/components/RehberKart'
import { REHBER_KATEGORILERI } from '@/lib/rehberKategorileri'
import { SITE_URL } from '@/lib/site'

export const revalidate = 300

export const metadata = {
  title: 'Rehberler | Pusula24',
  description:
    'Almanya’da yaşayan Türk topluluğu için oturum, vize, vergi, sosyal haklar, araç, sağlık ve eğitim konularında güncel tutulan pratik rehberler.',
  alternates: {
    canonical: `${SITE_URL}/rehberler`,
  },
}

export default async function RehberlerSayfasi({ searchParams }) {
  const { kategori } = await searchParams
  const secilenKategori = REHBER_KATEGORILERI.includes(kategori) ? kategori : null

  const supabase = await createClient()
  let sorgu = supabase
    .from('rehberler')
    .select('id, baslik, slug, ozet, gorsel_url, ai_gorsel_mi, kategori, son_guncelleme_tarihi')
    .eq('durum', 'published')
    .order('son_guncelleme_tarihi', { ascending: false })

  if (secilenKategori) {
    sorgu = sorgu.eq('kategori', secilenKategori)
  }

  const { data: rehberler } = await sorgu

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div>
        <h1 className="font-heading text-3xl font-black text-neutral-900 md:text-4xl">Rehberler</h1>
        <p className="mt-2 max-w-2xl text-neutral-600">
          Oturum, vize, vergi ve sosyal haklar, araç ve ehliyet, sağlık, eğitim gibi konularda pratik ve güncel tutulan rehberler.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href="/rehberler"
          className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
            !secilenKategori ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
          }`}
        >
          Tümü
        </Link>
        {REHBER_KATEGORILERI.map((k) => (
          <Link
            key={k}
            href={`/rehberler?kategori=${encodeURIComponent(k)}`}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
              secilenKategori === k ? 'bg-blue-600 text-white' : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
            }`}
          >
            {k}
          </Link>
        ))}
      </div>

      {rehberler && rehberler.length > 0 ? (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {rehberler.map((r) => (
            <RehberKart key={r.id} rehber={r} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center text-neutral-500">
          {secilenKategori ? 'Bu kategoride henüz rehber bulunmuyor.' : 'Henüz yayınlanmış bir rehber bulunmuyor.'}
        </div>
      )}
    </main>
  )
}
