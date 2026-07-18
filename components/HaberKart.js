import Link from 'next/link'
import { formatTarih } from '@/lib/format'

export default function HaberKart({ haber }) {
  return (
    <Link
      href={`/haber/${haber.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-16/10 w-full overflow-hidden bg-neutral-100">
        <img
          src={haber.gorsel_url}
          alt={haber.gorsel_alt || haber.baslik}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {haber.ai_gorsel_mi && (
          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white backdrop-blur">
            KI-generiert · Symbolbild
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-bold uppercase tracking-wide text-red-600">
          {haber.kategoriler?.ad || 'Gündem'}
        </span>
        <h3 className="font-heading font-bold leading-snug text-neutral-900 line-clamp-3 transition group-hover:text-red-600">
          {haber.baslik}
        </h3>
        <span className="mt-auto text-xs text-neutral-500">
          {formatTarih(haber.yayin_tarihi)}
        </span>
      </div>
    </Link>
  )
}
