'use client'

import { useState } from 'react'
import { FaPlay } from 'react-icons/fa6'

// Haber detayında opsiyonel YouTube videosu — "tıkla-yükle" deseni.
// Başlangıçta yalnızca YouTube'un statik önizleme görseli (çerez oluşturmaz)
// + oynat overlay'i gösterilir; iframe (ve dolayısıyla YouTube'un kendi
// script'leri/çerezleri) yalnızca kullanıcı TIKLADIKTAN sonra DOM'a eklenir.
// Bu davranış sitenin çerezsiz statüsünün korunması için gereklidir.
export default function HaberVideo({ videoId }) {
  const [yuklendiMi, setYuklendiMi] = useState(false)

  if (!videoId) return null

  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-neutral-500">Video</h2>
      <div className="relative aspect-16/9 overflow-hidden rounded-lg bg-neutral-900">
        {yuklendiMi ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
            title="YouTube video oynatıcı"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 h-full w-full"
          />
        ) : (
          <button
            type="button"
            onClick={() => setYuklendiMi(true)}
            aria-label="Videoyu oynat"
            className="group absolute inset-0 h-full w-full"
          >
            <img
              src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/45">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-black/60 transition group-hover:scale-110">
                <FaPlay className="ml-1 text-white" size={22} />
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  )
}
