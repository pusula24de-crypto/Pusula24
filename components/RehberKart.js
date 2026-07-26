import Link from 'next/link'
import { FaClockRotateLeft } from 'react-icons/fa6'
import { formatTarih } from '@/lib/format'

// Haberlerdeki HaberKart ile aynı görsel dil (kart, hover, satır sınırlama)
// ama mavi vurgu rengiyle bilinçli olarak ayrışır — "rehber" içeriğinin
// "haber" değil, süresiz/güncel-tutulan bir kaynak olduğu hissini verir.
export default function RehberKart({ rehber }) {
  return (
    <Link
      href={`/rehber/${rehber.slug}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-neutral-200 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
    >
      <div className="relative aspect-16/10 w-full overflow-hidden bg-neutral-100">
        <img
          src={rehber.gorsel_url}
          alt={rehber.baslik}
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        {rehber.ai_gorsel_mi && (
          <span className="absolute bottom-2 left-2 rounded bg-black/70 px-2 py-1 text-[10px] text-white backdrop-blur">
            KI-generiert · Symbolbild
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="text-xs font-bold uppercase tracking-wide text-blue-600">
          {rehber.kategori}
        </span>
        <h3 className="font-heading font-bold leading-snug text-neutral-900 line-clamp-2 transition group-hover:text-blue-600">
          {rehber.baslik}
        </h3>
        {rehber.ozet && (
          <p className="text-sm text-neutral-600 line-clamp-2">{rehber.ozet}</p>
        )}
        <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-semibold text-blue-700">
          <FaClockRotateLeft size={11} />
          Son güncelleme: {formatTarih(rehber.son_guncelleme_tarihi)}
        </span>
      </div>
    </Link>
  )
}
