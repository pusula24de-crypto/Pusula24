import Link from 'next/link'
import { FaMagnifyingGlass } from 'react-icons/fa6'
import { createClient } from '@/lib/supabase/server'
import HaberKart from '@/components/HaberKart'

// Aramalar cache'lenmesin, her istek taze sonuç dönsün.
export const dynamic = 'force-dynamic'

// PostgREST'in .or() filtre sözdiziminde virgül/parantez özel anlam taşır,
// % ve _ ise ilike joker karakterleridir — arama metnini bunlardan arındırıyoruz.
function sorguTemizle(metin) {
  return metin.replace(/[%_,()]/g, ' ').trim()
}

export async function generateMetadata({ searchParams }) {
  const { q } = await searchParams
  return {
    title: q ? `Arama: ${q} | Haberopa` : 'Arama | Haberopa',
    robots: { index: false, follow: false },
  }
}

export default async function AramaSayfasi({ searchParams }) {
  const { q: rawQ } = await searchParams
  const q = (rawQ || '').trim()
  const temizQ = sorguTemizle(q)

  let haberler = []
  if (temizQ) {
    const supabase = await createClient()
    const simdi = new Date().toISOString()

    // Şimdilik baslik/ozet üzerinde basit alt-metin (ilike) araması yapılıyor.
    // İleride Türkçe tam metin arama için idx_haberler_arama GIN indeksi +
    // .textSearch('baslik_ozet_arama', temizQ, { type: 'websearch', config: 'turkish' })
    // benzeri bir sorguya geçilebilir (daha alakalı sıralama, eş anlamlı kök eşleşmesi).
    const { data } = await supabase
      .from('haberler')
      .select('id, baslik, ozet, slug, gorsel_url, ai_gorsel_mi, yayin_tarihi, kategoriler(ad, slug)')
      .eq('durum', 'published')
      .lte('yayin_tarihi', simdi)
      .or(`baslik.ilike.%${temizQ}%,ozet.ilike.%${temizQ}%`)
      .order('yayin_tarihi', { ascending: false })
      .limit(30)

    haberler = data || []
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-heading text-2xl font-black tracking-tight text-neutral-900 md:text-3xl">
        {q ? `"${q}" için ${haberler.length} sonuç bulundu` : 'Arama'}
      </h1>

      {q && haberler.length > 0 && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {haberler.map((h) => (
            <HaberKart key={h.id} haber={h} />
          ))}
        </div>
      )}

      {q && haberler.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <FaMagnifyingGlass size={40} className="text-neutral-300" />
          <p className="text-lg font-bold text-neutral-900">Aradığınızı bulamadık</p>
          <p className="text-sm text-neutral-500">Farklı bir kelimeyle deneyin.</p>
          <Link href="/" className="mt-2 text-sm font-medium text-red-600 hover:underline">
            Anasayfaya dön →
          </Link>
        </div>
      )}

      {!q && (
        <div className="flex flex-col items-center gap-3 py-20 text-center">
          <FaMagnifyingGlass size={40} className="text-neutral-300" />
          <p className="text-lg font-bold text-neutral-900">Aramak için bir kelime girin</p>
          <Link href="/" className="mt-2 text-sm font-medium text-red-600 hover:underline">
            Anasayfaya dön →
          </Link>
        </div>
      )}
    </main>
  )
}
