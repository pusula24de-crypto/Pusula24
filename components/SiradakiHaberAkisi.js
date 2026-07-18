'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import HaberIcerik from './HaberIcerik'

const OTO_SINIR = 3 // En fazla 3 haber otomatik yüklenir, sonrası butonla.

function Ayrac() {
  return (
    <div className="mx-auto my-12 flex max-w-3xl items-center gap-4 px-4">
      <span className="h-px flex-1 bg-neutral-200" />
      <span className="shrink-0 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-400">
        Sıradaki Haber
      </span>
      <span className="h-px flex-1 bg-neutral-200" />
    </div>
  )
}

// Haber detayında "sıradaki haber" akışı. Okur yazının sonuna yaklaşınca
// (IntersectionObserver) bir sonraki haber /api/siradaki-haber'den çekilip
// dikişsiz eklenir. Görünümdeki haber değiştikçe URL history.replaceState ile
// ve document.title güncellenir. En fazla OTO_SINIR haber otomatik yüklenir;
// sonrasında "Sıradaki Haber →" butonu gelir ki footer'a erişim korunsun.
export default function SiradakiHaberAkisi({ ilkId, ilkSlug, ilkBaslik }) {
  const [yuklenenler, setYuklenenler] = useState([])
  const [otoSayac, setOtoSayac] = useState(0)
  const [yukleniyor, setYukleniyor] = useState(false)
  const [bitti, setBitti] = useState(false)

  const sentinelRef = useRef(null)
  const yuklenenlerRef = useRef([])
  const yukleniyorRef = useRef(false)
  const bittiRef = useRef(false)

  useEffect(() => {
    yuklenenlerRef.current = yuklenenler
  }, [yuklenenler])

  const otomatikBitti = otoSayac >= OTO_SINIR

  const haberYukle = useCallback(
    async (otomatikMi) => {
      if (yukleniyorRef.current || bittiRef.current) return
      yukleniyorRef.current = true
      setYukleniyor(true)
      try {
        const mevcutlar = yuklenenlerRef.current
        const son = mevcutlar[mevcutlar.length - 1]
        const cursorSlug = son ? son.slug : ilkSlug
        const haricIdler = [ilkId, ...mevcutlar.map((h) => h.id)].join(',')
        const res = await fetch(
          `/api/siradaki-haber?slug=${encodeURIComponent(cursorSlug)}&exclude=${haricIdler}`
        )
        const json = await res.json()
        if (json.haber) {
          setYuklenenler((prev) => [...prev, json.haber])
          if (otomatikMi) setOtoSayac((c) => c + 1)
        } else {
          bittiRef.current = true
          setBitti(true)
        }
      } catch {
        // Ağ hatasında sessizce geç; kullanıcı tekrar deneyebilir
      } finally {
        yukleniyorRef.current = false
        setYukleniyor(false)
      }
    },
    [ilkId, ilkSlug]
  )

  // Otomatik yükleme: okur yazının sonuna yaklaşınca sıradaki haber çekilir.
  // Birincil tetikleyici IntersectionObserver; yanında, IO'nun kısıtlı olduğu
  // ortamlar için scroll/resize tabanlı bir yedek kontrol de çalışır. İkisi de
  // aynı korumalı haberYukle'yi çağırır (eşzamanlı yükleme engellenir).
  useEffect(() => {
    if (otomatikBitti || bitti) return
    const hedef = sentinelRef.current
    if (!hedef) return

    const kontrolEt = () => {
      const rect = hedef.getBoundingClientRect()
      if (rect.top <= window.innerHeight + 400) haberYukle(true)
    }

    const gozcu = new IntersectionObserver(
      (girisler) => {
        if (girisler[0].isIntersecting) haberYukle(true)
      },
      { rootMargin: '400px 0px' }
    )
    gozcu.observe(hedef)
    window.addEventListener('scroll', kontrolEt, { passive: true })
    window.addEventListener('resize', kontrolEt)
    kontrolEt()

    return () => {
      gozcu.disconnect()
      window.removeEventListener('scroll', kontrolEt)
      window.removeEventListener('resize', kontrolEt)
    }
  }, [otomatikBitti, bitti, haberYukle])

  // Görünürdeki habere göre URL + başlık güncelleme. Viewport'un üst kısmını
  // geçmiş en son makale "aktif" sayılır; URL history.replaceState ile onun
  // slug'ına, document.title de başlığına güncellenir.
  useEffect(() => {
    let raf = 0
    const guncelle = () => {
      raf = 0
      const dugumler = document.querySelectorAll('[data-haber-slug]')
      let aktif = null
      dugumler.forEach((d) => {
        if (d.getBoundingClientRect().top <= window.innerHeight * 0.35) aktif = d
      })
      if (!aktif) return
      const slug = aktif.getAttribute('data-haber-slug')
      const baslik = aktif.getAttribute('data-haber-baslik')
      const hedefYol = `/haber/${slug}`
      if (window.location.pathname !== hedefYol) {
        window.history.replaceState(null, '', hedefYol)
        if (baslik) document.title = baslik
      }
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(guncelle)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    guncelle()
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [yuklenenler.length])

  return (
    <>
      {yuklenenler.map((haber) => (
        <div key={haber.id}>
          <Ayrac />
          <article
            className="mx-auto max-w-3xl px-4"
            data-haber-slug={haber.slug}
            data-haber-baslik={haber.baslik}
          >
            <HaberIcerik haber={haber} />
          </article>
        </div>
      ))}

      {!bitti &&
        (otomatikBitti ? (
          <div className="mx-auto mt-14 max-w-3xl px-4 text-center">
            <button
              type="button"
              onClick={() => haberYukle(false)}
              disabled={yukleniyor}
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-8 py-3.5 font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
            >
              {yukleniyor ? 'Yükleniyor…' : 'Sıradaki Haber →'}
            </button>
          </div>
        ) : (
          <>
            <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
            {yukleniyor && (
              <p className="py-10 text-center text-sm text-neutral-400">
                Sıradaki haber yükleniyor…
              </p>
            )}
          </>
        ))}
    </>
  )
}
