'use client'

import { useEffect, useState } from 'react'
import {
  FaWhatsapp,
  FaFacebookF,
  FaXTwitter,
  FaTelegram,
  FaLink,
  FaShareNodes,
} from 'react-icons/fa6'

// Saf "intent" linkleriyle çalışan, hiçbir üçüncü taraf SDK/script yüklemeyen
// paylaşım çubuğu. Çerezsiz statü korunur. Butonlar yuvarlak; hover'da her
// platform kendi marka rengini alır. Mobilde navigator.share destekleniyorsa
// öne çıkan tek "Paylaş" butonu (native menü) eklenir, diğerleri yanında kalır.
export default function PaylasimButonlari({ url, baslik, className = '' }) {
  const [kopyalandi, setKopyalandi] = useState(false)
  const [nativeVar, setNativeVar] = useState(false)

  useEffect(() => {
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      setNativeVar(true)
    }
  }, [])

  const encBaslik = encodeURIComponent(baslik || '')
  const encUrl = encodeURIComponent(url || '')

  const linkler = [
    {
      ad: 'WhatsApp',
      href: `https://wa.me/?text=${encBaslik}%20${encUrl}`,
      Icon: FaWhatsapp,
      hover: 'hover:border-[#25D366] hover:bg-[#25D366]',
    },
    {
      ad: 'Facebook',
      href: `https://www.facebook.com/sharer.php?u=${encUrl}`,
      Icon: FaFacebookF,
      hover: 'hover:border-[#1877F2] hover:bg-[#1877F2]',
    },
    {
      ad: 'X',
      href: `https://twitter.com/intent/tweet?url=${encUrl}&text=${encBaslik}`,
      Icon: FaXTwitter,
      hover: 'hover:border-black hover:bg-black',
    },
    {
      ad: 'Telegram',
      href: `https://t.me/share/url?url=${encUrl}&text=${encBaslik}`,
      Icon: FaTelegram,
      hover: 'hover:border-[#229ED9] hover:bg-[#229ED9]',
    },
  ]

  async function panoyaYaz(metin) {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(metin)
        return true
      }
    } catch {
      // Güvenli olmayan bağlam / izin reddi → execCommand yedeğine düş
    }
    try {
      const ta = document.createElement('textarea')
      ta.value = metin
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.focus()
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }

  async function linkKopyala() {
    const basarili = await panoyaYaz(url)
    if (basarili) {
      setKopyalandi(true)
      setTimeout(() => setKopyalandi(false), 2000)
    }
  }

  async function nativePaylas() {
    try {
      await navigator.share({ title: baslik, url })
    } catch {
      // Kullanıcı iptal ederse yoksay
    }
  }

  const yuvarlak =
    'flex h-10 w-10 items-center justify-center rounded-full border border-neutral-200 text-neutral-600 transition hover:text-white'

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-neutral-400">
        Paylaş
      </span>

      {nativeVar && (
        <button
          type="button"
          onClick={nativePaylas}
          aria-label="Paylaş"
          className="flex h-10 items-center gap-2 rounded-full bg-red-600 px-4 text-sm font-semibold text-white transition hover:bg-red-700 sm:hidden"
        >
          <FaShareNodes size={15} />
          Paylaş
        </button>
      )}

      {linkler.map(({ ad, href, Icon, hover }) => (
        <a
          key={ad}
          href={href}
          target="_blank"
          rel="noopener"
          aria-label={`${ad}'da paylaş`}
          className={`${yuvarlak} ${hover}`}
        >
          <Icon size={16} />
        </a>
      ))}

      <button
        type="button"
        onClick={linkKopyala}
        aria-label="Linki kopyala"
        className={`${yuvarlak} hover:border-red-600 hover:bg-red-600`}
      >
        <FaLink size={15} />
      </button>

      {kopyalandi && (
        <span className="text-xs font-semibold text-green-600">Kopyalandı ✓</span>
      )}
    </div>
  )
}
