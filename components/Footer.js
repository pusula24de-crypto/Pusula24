import Link from 'next/link'
import { FaFacebookF, FaInstagram, FaXTwitter, FaYoutube, FaTiktok } from 'react-icons/fa6'
import Pusula24Logo from './Pusula24Logo'

const SOSYAL_LINKLER = [
  { Icon: FaFacebookF, label: 'Facebook', href: 'https://facebook.com/pusula24de' },
  { Icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com/pusula24de' },
  { Icon: FaXTwitter, label: 'X', href: 'https://x.com/pusula24de' },
  { Icon: FaYoutube, label: 'YouTube', href: 'https://www.youtube.com/channel/UCT9mC98WdJMWdpTZefDegkQ' },
  { Icon: FaTiktok, label: 'TikTok', href: 'https://tiktok.com/@pusula24de' },
]

export default function Footer({ kategoriler }) {
  return (
    <footer className="mt-16 bg-neutral-900 text-neutral-300">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-12 md:grid-cols-3">
        <div>
          <Link href="/" className="inline-block">
            <Pusula24Logo varyant="beyaz" className="h-9 w-auto" />
          </Link>
          <p className="mt-3 max-w-xs text-sm text-neutral-400">
            Almanya&apos;da yaşayan Türk topluluğu için tarafsız, hızlı ve doğru haber portalı.
          </p>
          <div className="mt-5 flex items-center gap-3">
            {SOSYAL_LINKLER.map(({ Icon, label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-neutral-800 text-neutral-300 transition hover:bg-red-600 hover:text-white"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">Kategoriler</h4>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            {kategoriler.map((k) => (
              <li key={k.id}>
                <Link href={`/kategori/${k.slug}`} className="transition hover:text-red-500">
                  {k.ad}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-white">Kurumsal</h4>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="/impressum" className="transition hover:text-red-500">Impressum</Link>
            </li>
            <li>
              <Link href="/datenschutz" className="transition hover:text-red-500">Datenschutz</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-neutral-800 py-6 text-center text-xs text-neutral-500">
        <p>© {new Date().getFullYear()} Pusula24. Tüm hakları saklıdır.</p>
        <p className="mt-1 text-neutral-600">KI-destekli içerik</p>
      </div>
    </footer>
  )
}
