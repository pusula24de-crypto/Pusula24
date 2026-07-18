import { Archivo, Inter, Space_Grotesk } from 'next/font/google'
import './globals.css'
import { createClient } from '@/lib/supabase/server'
import Header from '@/components/Header'
import Footer from '@/components/Footer'
import SonDakikaBar from '@/components/SonDakikaBar'
import AdSenseYukleyici from '@/components/AdSenseYukleyici'
import { ayarlariGetir } from './(admin)/admin/actions'

const archivo = Archivo({
  subsets: ['latin', 'latin-ext'],
  weight: ['700', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
})

// Yalnızca logo/marka kilidi için — site başlıkları Archivo, gövde Inter olarak kalır.
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin-ext'],
  weight: ['500', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
})

export async function generateMetadata() {
  const ayarlar = await ayarlariGetir()
  const googleDogrulama = ayarlar.google_site_verification?.trim()

  return {
    metadataBase: new URL('https://haberopa.com'),
    title: 'Haberopa - Almanya Son Dakika Haberleri',
    description: 'Almanya’da yaşayan Türk topluluğu için tarafsız, hızlı ve doğru haber portalı.',
    icons: {
      icon: '/marka/favicon.svg',
      shortcut: '/marka/favicon.svg',
      apple: '/apple-icon.png',
    },
    ...(googleDogrulama
      ? { verification: { google: googleDogrulama } }
      : {}),
    openGraph: {
      title: 'Haberopa - Almanya Son Dakika Haberleri',
      description: 'Almanya’da yaşayan Türk topluluğu için tarafsız, hızlı ve doğru haber portalı.',
      images: [
        {
          url: '/marka/logo-yatay-renkli-2000.png',
          width: 2000,
          height: 436,
          alt: 'Haberopa',
        },
      ],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  }
}

export default async function RootLayout({ children }) {
  const supabase = await createClient()
  const simdi = new Date().toISOString()

  const [{ data: kategoriler }, { data: sonHaberler }, ayarlar] = await Promise.all([
    supabase.from('kategoriler').select('id, ad, slug').order('sira'),
    supabase
      .from('haberler')
      .select('baslik, slug, yayin_tarihi')
      .eq('durum', 'published')
      .lte('yayin_tarihi', simdi)
      .order('yayin_tarihi', { ascending: false })
      .limit(5),
    ayarlariGetir(),
  ])

  // AdSense yalnızca panelden AÇIK edilmiş VE kod girilmişse yüklenir.
  // Kapalıyken hiçbir üçüncü taraf script'i sayfaya girmez (çerezsiz statü).
  const adsenseAktif = ayarlar.adsense_aktif === 'true' && ayarlar.adsense_kodu?.trim()

  return (
    <html lang="tr" className={`${archivo.variable} ${inter.variable} ${spaceGrotesk.variable} antialiased`}>
      <body className="bg-white text-neutral-900">
        {adsenseAktif && <AdSenseYukleyici kod={ayarlar.adsense_kodu} />}
        <SonDakikaBar haberler={sonHaberler || []} />
        <Header kategoriler={kategoriler || []} />
        {children}
        <Footer kategoriler={kategoriler || []} />
      </body>
    </html>
  )
}
