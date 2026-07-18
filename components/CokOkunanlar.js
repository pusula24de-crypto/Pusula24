'use client'

import { useRef } from 'react'
import Link from 'next/link'
import { FaChevronLeft, FaChevronRight, FaArrowTrendUp } from 'react-icons/fa6'

function Baslik({ boyutSinifi }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-6 w-1 bg-red-600" />
      <h2 className={`flex items-center gap-2 font-heading font-extrabold text-neutral-900 ${boyutSinifi}`}>
        Çok Okunanlar
        <FaArrowTrendUp className="text-red-600" size={18} />
      </h2>
    </div>
  )
}

// Tek veri kaynağından (page.js'te bir kez çekilen `haberler`) iki farklı
// yerleşim üretir: mobil/tablette yatay kaydırmalı şerit ("serit"), lg+ te
// kategori bloklarının sağındaki dikey sabit sütun ("sidebar"). Her varyant
// kendi görünürlük sınıfını taşır, çağıran taraf ekstra hidden/lg:block
// sarmalayıcısına ihtiyaç duymaz.
export default function CokOkunanlar({ haberler, variant = 'serit' }) {
  const seritRef = useRef(null)

  if (!haberler || haberler.length === 0) return null

  function kaydir(yon) {
    const el = seritRef.current
    if (!el) return
    const kart = el.querySelector('[data-kart]')
    const adim = kart ? kart.getBoundingClientRect().width + 16 : 240
    el.scrollBy({ left: yon * adim * 2, behavior: 'smooth' })
  }

  if (variant === 'sidebar') {
    return (
      <aside className="hidden lg:block lg:sticky lg:top-[132px]">
        <div className="mb-4">
          <Baslik boyutSinifi="text-xl" />
        </div>
        <ol className="space-y-3">
          {haberler.map((h, i) => (
            <li key={h.id}>
              <Link href={`/haber/${h.slug}`} className="group flex items-center gap-3">
                <span className="w-6 shrink-0 text-center font-heading text-xl font-black leading-none text-neutral-200">
                  {i + 1}
                </span>
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-neutral-100">
                  <img
                    src={h.gorsel_url}
                    alt=""
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[10px] font-bold uppercase tracking-wide text-red-600">
                    {h.kategoriler?.ad || 'Gündem'}
                  </span>
                  <h3 className="font-heading text-sm font-bold leading-snug text-neutral-900 line-clamp-2 transition group-hover:text-red-600">
                    {h.baslik}
                  </h3>
                </div>
              </Link>
            </li>
          ))}
        </ol>
      </aside>
    )
  }

  return (
    <section className="lg:hidden">
      <div className="mb-4 flex items-center justify-between">
        <Baslik boyutSinifi="text-xl md:text-2xl" />
        <div className="hidden items-center gap-2 md:flex">
          <button
            onClick={() => kaydir(-1)}
            aria-label="Geri kaydır"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white"
          >
            <FaChevronLeft size={12} />
          </button>
          <button
            onClick={() => kaydir(1)}
            aria-label="İleri kaydır"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:border-red-600 hover:bg-red-600 hover:text-white"
          >
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>

      <div
        ref={seritRef}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {haberler.map((h, i) => (
          <Link
            key={h.id}
            data-kart
            href={`/haber/${h.slug}`}
            className="group w-[42%] shrink-0 snap-start overflow-hidden rounded-lg border border-neutral-200 transition hover:shadow-md sm:w-[30%] md:w-[19%]"
          >
            <div className="relative aspect-4/3 w-full overflow-hidden bg-neutral-100">
              <img
                src={h.gorsel_url}
                alt={h.baslik}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white">
                {i + 1}
              </span>
            </div>
            <div className="p-3">
              <span className="text-[10px] font-bold uppercase tracking-wide text-red-600">
                {h.kategoriler?.ad || 'Gündem'}
              </span>
              <h3 className="mt-1 font-heading text-sm font-bold leading-snug text-neutral-900 line-clamp-2 transition group-hover:text-red-600">
                {h.baslik}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
