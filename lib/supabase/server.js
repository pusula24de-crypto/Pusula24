import { createServerClient } from '@supabase/ssr'
import { cookies, headers } from 'next/headers'

// Tarayıcı istemcisiyle (lib/supabase/client.js) AYNI mantık: prod host'ta
// (*.pusula24.de) çerezi apex+www arasında paylaşan .pusula24.de domain'i
// ver; başka bir host'ta (localhost, önizleme) hiç dokunma. Gerçek istekteki
// Host başlığı headers() ile OKUNUR (statik bir SITE_URL sabitine göre değil)
// — böylece localhost'ta yanlışlıkla prod domain'i uygulanıp geliştirici
// makinesindeki çalışan girişi bozma riski olmaz.
async function uretimCerezAyarlari() {
  try {
    const headerList = await headers()
    const host = headerList.get('host') || ''
    if (!host.endsWith('pusula24.de')) return {}
    return { domain: '.pusula24.de', secure: true, sameSite: 'lax', path: '/' }
  } catch {
    return {}
  }
}

export async function createClient() {
  const cookieStore = await cookies()
  const cookieOptions = await uretimCerezAyarlari()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookieOptions,
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Sunucu bileşenlerinde çerez hatası yoksayılabilir
          }
        },
      },
    }
  )
}
