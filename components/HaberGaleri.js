'use client'

import { useEffect, useState } from 'react'
import { FaChevronLeft, FaChevronRight, FaXmark } from 'react-icons/fa6'

// Haber detayında gövde metninin altında gösterilen yatay galeri şeridi.
// CokOkunanlar'daki "serit" varyantıyla aynı scroll-snap deseni kullanır.
// Bir küçük görsele tıklanınca aynı bileşen içindeki tam ekran lightbox açılır.
export default function HaberGaleri({ galeri }) {
  const [acikIndex, setAcikIndex] = useState(null)
  const acik = acikIndex !== null

  useEffect(() => {
    if (!acik) return

    function handleKeyDown(e) {
      if (e.key === 'Escape') setAcikIndex(null)
      else if (e.key === 'ArrowLeft') setAcikIndex((i) => (i - 1 + galeri.length) % galeri.length)
      else if (e.key === 'ArrowRight') setAcikIndex((i) => (i + 1) % galeri.length)
    }

    const oncekiOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.body.style.overflow = oncekiOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [acik, galeri?.length])

  if (!galeri || galeri.length === 0) return null

  const guncelGorsel = acik ? galeri[acikIndex] : null

  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-neutral-500">Galeri</h2>

      <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {galeri.map((g, i) => (
          <button
            key={g.id ?? i}
            type="button"
            onClick={() => setAcikIndex(i)}
            aria-label={`Galeri görseli ${i + 1}`}
            className="group relative aspect-4/3 w-[38%] shrink-0 snap-start overflow-hidden rounded-lg border border-neutral-200 sm:w-[28%] md:w-[22%]"
          >
            <img
              src={g.gorsel_url}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </button>
        ))}
      </div>

      {acik && guncelGorsel && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setAcikIndex(null)}
        >
          <button
            type="button"
            onClick={() => setAcikIndex(null)}
            aria-label="Kapat"
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
          >
            <FaXmark size={18} />
          </button>

          {galeri.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setAcikIndex((i) => (i - 1 + galeri.length) % galeri.length)
              }}
              aria-label="Önceki görsel"
              className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:left-4"
            >
              <FaChevronLeft size={18} />
            </button>
          )}

          <div
            className="flex max-h-full max-w-full flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={guncelGorsel.gorsel_url}
              alt=""
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />
            {(guncelGorsel.ai_gorsel_mi || guncelGorsel.gorsel_kaynak_notu) && (
              <p className="mt-3 max-w-xl text-center text-xs italic text-neutral-400">
                {guncelGorsel.ai_gorsel_mi
                  ? 'Görsel: KI-generiert · Symbolbild — yapay zekâ ile üretilmiş temsili görsel'
                  : `Fotoğraf: ${guncelGorsel.gorsel_kaynak_notu}`}
              </p>
            )}
            <span className="mt-2 text-xs text-neutral-500">
              {acikIndex + 1} / {galeri.length}
            </span>
          </div>

          {galeri.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setAcikIndex((i) => (i + 1) % galeri.length)
              }}
              aria-label="Sonraki görsel"
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 sm:right-4"
            >
              <FaChevronRight size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
