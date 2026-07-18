'use client'

import Link from 'next/link'

export default function SonDakikaBar({ haberler }) {
  if (!haberler || haberler.length === 0) return null

  const kayanListe = haberler.length > 1 ? [...haberler, ...haberler] : haberler
  const sureSaniye = Math.max(15, haberler.length * 6)

  return (
    <div className="flex items-center gap-3 overflow-hidden bg-red-600 px-4 py-2 text-white">
      <span className="flex shrink-0 items-center gap-1.5 rounded bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
        <span className="h-[7px] w-[7px] shrink-0 rounded-full bg-white animate-canli-nabiz" />
        Son Dakika
      </span>
      <div className="relative flex-1 overflow-hidden">
        <div
          className={`flex w-max items-center gap-12 whitespace-nowrap ${
            haberler.length > 1 ? 'animate-marquee' : ''
          }`}
          style={{ animationDuration: `${sureSaniye}s` }}
        >
          {kayanListe.map((haber, i) => (
            <Link
              key={`${haber.slug}-${i}`}
              href={`/haber/${haber.slug}`}
              className="text-sm font-medium hover:underline"
            >
              {haber.baslik}
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
