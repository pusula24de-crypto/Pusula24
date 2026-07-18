import Link from 'next/link'
import { formatTarih } from '@/lib/format'
import KategoriIkon from '@/lib/kategoriIkonlari'

export default function KategoriBlokuKompakt({ kategori, haberler }) {
  const [ilkHaber, ...digerHaberler] = haberler
  if (!ilkHaber) return null

  return (
    <section>
      <div className="mb-3 flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="h-5 w-1 bg-red-600" />
          <h2 className="font-heading text-lg font-extrabold text-neutral-900">
            <Link
              href={`/kategori/${kategori.slug}`}
              className="flex items-center gap-1.5 transition hover:text-red-600"
            >
              {kategori.ad}
              <KategoriIkon slug={kategori.slug} size={16} />
            </Link>
          </h2>
        </div>
        <span className="h-px flex-1 bg-neutral-200" />
        <Link
          href={`/kategori/${kategori.slug}`}
          className="shrink-0 text-xs font-medium text-neutral-600 transition hover:text-red-600"
        >
          Tümü →
        </Link>
      </div>

      <Link
        href={`/haber/${ilkHaber.slug}`}
        className="group flex gap-3 rounded-lg border border-neutral-200 p-2.5 transition hover:shadow-md"
      >
        <div className="relative aspect-4/3 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100">
          <img
            src={ilkHaber.gorsel_url}
            alt={ilkHaber.gorsel_alt || ilkHaber.baslik}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center gap-1">
          <h3 className="font-heading text-sm font-bold leading-snug text-neutral-900 line-clamp-2 transition group-hover:text-red-600">
            {ilkHaber.baslik}
          </h3>
          <span className="text-xs text-neutral-500">{formatTarih(ilkHaber.yayin_tarihi)}</span>
        </div>
      </Link>

      {digerHaberler.length > 0 && (
        <div className="mt-0.5 divide-y divide-neutral-200 border-t border-neutral-200">
          {digerHaberler.map((h, i) => (
            <Link
              key={h.id}
              href={`/haber/${h.slug}`}
              className="flex items-center justify-between gap-3 py-2 text-sm transition hover:text-red-600"
            >
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-600 animate-canli-nabiz"
                  style={{ animationDelay: `${i * 300}ms` }}
                />
                <span className="line-clamp-1 font-medium text-neutral-800">{h.baslik}</span>
              </span>
              <span className="shrink-0 text-xs text-neutral-400">{formatTarih(h.yayin_tarihi)}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}
