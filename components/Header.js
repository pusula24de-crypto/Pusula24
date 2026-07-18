'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube, FaTiktok } from 'react-icons/fa6'
import HaberopaLogo from './HaberopaLogo'
import AramaKutusu from './AramaKutusu'

const SOSYAL_LINKLER = [
  { Icon: FaFacebookF, label: 'Facebook', href: '#' },
  { Icon: FaInstagram, label: 'Instagram', href: '#' },
  { Icon: FaXTwitter, label: 'X', href: '#' },
  { Icon: FaYoutube, label: 'YouTube', href: '#' },
  { Icon: FaTiktok, label: 'TikTok', href: '#' },
]

export default function Header({ kategoriler }) {
  const [menuAcik, setMenuAcik] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40">
      <div className="bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="shrink-0">
            <HaberopaLogo varyant="renkli" className="h-10 w-auto md:h-11" />
          </Link>

          <div className="flex items-center gap-4">
            <div className="hidden items-center gap-2 md:flex">
              {SOSYAL_LINKLER.map(({ Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-red-600 hover:text-white"
                >
                  <Icon size={14} />
                </a>
              ))}
            </div>

            <AramaKutusu variant="mobil" />

            <button
              onClick={() => setMenuAcik((acik) => !acik)}
              className="p-2 text-neutral-700 md:hidden"
              aria-label="Menüyü aç/kapat"
              aria-expanded={menuAcik}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {menuAcik ? (
                  <path d="M6 6l12 12M18 6l-12 12" strokeLinecap="round" />
                ) : (
                  <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="hidden border-y border-neutral-200 bg-neutral-50/90 backdrop-blur md:block">
        <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-2">
          <div className="flex items-center gap-1">
            {kategoriler.map((k) => {
              const aktif = pathname === `/kategori/${k.slug}`
              return (
                <Link
                  key={k.id}
                  href={`/kategori/${k.slug}`}
                  className={`rounded-md px-3 py-1.5 text-[15px] font-semibold transition ${
                    aktif
                      ? 'bg-red-600 text-white'
                      : 'text-neutral-900 hover:bg-red-600 hover:text-white'
                  }`}
                >
                  {k.ad}
                </Link>
              )
            })}
          </div>

          <AramaKutusu variant="masaustu" />
        </nav>
      </div>

      {menuAcik && (
        <nav className="flex flex-col gap-1 border-t border-neutral-200 bg-white px-4 py-3 md:hidden">
          <div className="mb-2 flex items-center gap-2 pb-2">
            <img src="/marka/sembol-renkli.svg" alt="" aria-hidden="true" className="h-6 w-6" />
            <span className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Menü</span>
          </div>
          {kategoriler.map((k) => (
            <Link
              key={k.id}
              href={`/kategori/${k.slug}`}
              onClick={() => setMenuAcik(false)}
              className="rounded-md px-3 py-2 text-[15px] font-semibold text-neutral-900 transition hover:bg-red-600 hover:text-white"
            >
              {k.ad}
            </Link>
          ))}
          <div className="mt-2 flex items-center gap-3 border-t border-neutral-200 pt-3">
            {SOSYAL_LINKLER.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                aria-label={label}
                className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-500 transition hover:bg-red-600 hover:text-white"
              >
                <Icon size={14} />
              </a>
            ))}
          </div>
        </nav>
      )}
    </header>
  )
}
