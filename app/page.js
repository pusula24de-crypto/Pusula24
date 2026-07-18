import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatTarih } from '@/lib/format'
import HaberKart from '@/components/HaberKart'
import BilgiKarti from '@/components/BilgiKarti'
import CokOkunanlar from '@/components/CokOkunanlar'
import KategoriBlokuKompakt from '@/components/KategoriBlokuKompakt'
import KategoriIkon from '@/lib/kategoriIkonlari'

export const revalidate = 60

export default async function Anasayfa() {
  const supabase = await createClient()
  const simdi = new Date().toISOString()

  const { data: kategoriler } = await supabase
    .from('kategoriler')
    .select('id, ad, slug')
    .order('sira')

  // Manşet + sağdaki 4 haber: kategori fark etmeksizin en son yayınlanan 5
  // haber — ilki manşet, sonraki 4'ü yan liste. Zamanlanmış (ileri tarihli)
  // haberler yayin_tarihi <= şimdi filtresiyle saati gelene kadar görünmez.
  const { data: sonHaberler } = await supabase
    .from('haberler')
    .select('id, baslik, ozet, slug, gorsel_url, ai_gorsel_mi, yayin_tarihi, kategoriler(ad, slug)')
    .eq('durum', 'published')
    .lte('yayin_tarihi', simdi)
    .order('yayin_tarihi', { ascending: false })
    .limit(5)

  const manseyHaber = sonHaberler?.[0]
  const yanHaberler = sonHaberler?.slice(1) || []

  const { data: cokOkunanlar } = await supabase
    .from('haberler')
    .select('id, baslik, slug, gorsel_url, kategoriler(ad, slug)')
    .eq('durum', 'published')
    .lte('yayin_tarihi', simdi)
    .order('okuma_sayisi', { ascending: false })
    .order('yayin_tarihi', { ascending: false })
    .limit(10)

  const kategoriBloklari = kategoriler
    ? await Promise.all(
        kategoriler.map(async (kategori) => {
          const { data } = await supabase
            .from('haberler')
            .select('id, baslik, slug, gorsel_url, ai_gorsel_mi, yayin_tarihi, kategoriler(ad, slug)')
            .eq('durum', 'published')
            .lte('yayin_tarihi', simdi)
            .eq('kategori_id', kategori.id)
            .order('yayin_tarihi', { ascending: false })
            .limit(6)
          return { kategori, haberler: data || [] }
        })
      )
    : []

  // Hibrit anasayfa düzeni: haberi olan kategorilerin "sira" sırasına göre
  // İLK 3'ü tam genişlik büyük bölüm, kalanı 2'li kompakt sütunlara iner.
  const doluBloklar = kategoriBloklari.filter((blok) => blok.haberler.length > 0)
  const tamGenislikBloklar = doluBloklar.slice(0, 3)
  const kompaktBloklar = doluBloklar.slice(3)

  return (
    <main className="mx-auto max-w-6xl space-y-10 px-4 py-8">
      {manseyHaber ? (
        <section className="grid grid-cols-1 gap-5 md:grid-cols-12">
          <Link
            href={`/haber/${manseyHaber.slug}`}
            className="group relative col-span-1 block aspect-16/9 overflow-hidden rounded-lg md:col-span-7"
          >
            <img
              src={manseyHaber.gorsel_url}
              alt={manseyHaber.gorsel_alt || manseyHaber.baslik}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            {manseyHaber.ai_gorsel_mi && (
              <span className="absolute right-3 top-3 rounded bg-black/70 px-2 py-1 text-[10px] text-white backdrop-blur">
                KI-generiert · Symbolbild
              </span>
            )}
            <div className="absolute inset-x-0 bottom-0 space-y-2 p-6">
              <span className="inline-block rounded bg-red-600 px-2 py-1 text-xs font-bold uppercase tracking-wide text-white">
                {manseyHaber.kategoriler?.ad || 'Gündem'}
              </span>
              <h1 className="font-heading text-2xl font-black leading-tight text-white md:text-4xl">
                {manseyHaber.baslik}
              </h1>
              <span className="block text-sm text-neutral-300">
                {formatTarih(manseyHaber.yayin_tarihi)}
              </span>
            </div>
          </Link>

          <div className="col-span-1 flex flex-col divide-y divide-neutral-200 md:col-span-5">
            {yanHaberler.map((h) => (
              <Link
                key={h.id}
                href={`/haber/${h.slug}`}
                className="group flex gap-4 py-4 first:pt-0"
              >
                <div className="relative aspect-4/3 w-28 shrink-0 overflow-hidden rounded-lg">
                  <img
                    src={h.gorsel_url}
                    alt={h.gorsel_alt || h.baslik}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="flex flex-col justify-center gap-1">
                  <span className="text-[11px] font-bold uppercase tracking-wide text-red-600">
                    {h.kategoriler?.ad || 'Gündem'}
                  </span>
                  <h3 className="font-heading font-bold leading-snug text-neutral-900 line-clamp-2 transition group-hover:text-red-600">
                    {h.baslik}
                  </h3>
                  <span className="text-xs text-neutral-500">{formatTarih(h.yayin_tarihi)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : (
        <div className="py-20 text-center text-neutral-500">
          Henüz yayınlanmış bir haber bulunmuyor. Admin panelinden ilk haberinizi ekleyin!
        </div>
      )}

      <BilgiKarti />

      {/* lg altı: yatay kaydırmalı şerit. lg+: aşağıdaki sağ sütuna taşınır. */}
      <CokOkunanlar haberler={cokOkunanlar} variant="serit" />

      <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-10">
        <div className="space-y-10">
          {tamGenislikBloklar.map(({ kategori, haberler }) => (
            <section key={kategori.id}>
              <div className="mb-5 flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <span className="h-6 w-1 bg-red-600" />
                  <h2 className="font-heading text-xl font-extrabold text-neutral-900 md:text-2xl">
                    <Link
                      href={`/kategori/${kategori.slug}`}
                      className="flex items-center gap-2 transition hover:text-red-600"
                    >
                      {kategori.ad}
                      <KategoriIkon slug={kategori.slug} size={18} />
                    </Link>
                  </h2>
                </div>
                <span className="h-px flex-1 bg-neutral-200" />
                <Link
                  href={`/kategori/${kategori.slug}`}
                  className="shrink-0 text-sm font-medium text-neutral-600 transition hover:text-red-600"
                >
                  Tümü →
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {haberler.map((h) => (
                  <HaberKart key={h.id} haber={h} />
                ))}
              </div>
            </section>
          ))}

          {kompaktBloklar.length > 0 && (
            <div className="grid grid-cols-1 gap-x-8 gap-y-7 md:grid-cols-2">
              {kompaktBloklar.map(({ kategori, haberler }) => (
                <KategoriBlokuKompakt key={kategori.id} kategori={kategori} haberler={haberler.slice(0, 4)} />
              ))}
            </div>
          )}
        </div>

        {/* lg+ sağ sütun: aynı veriden dikey "Çok Okunanlar" listesi */}
        <CokOkunanlar haberler={cokOkunanlar} variant="sidebar" />
      </div>
    </main>
  )
}
