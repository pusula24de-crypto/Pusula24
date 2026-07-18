import { SITE_URL } from '@/lib/site'

// Tüm botlara izin; yönetim, giriş, arama ve API yolları taranmaz.
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/login', '/arama', '/api'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
