import { createBrowserClient } from '@supabase/ssr'

// @supabase/ssr, oturumu (localStorage değil) ÇEREZDE saklar — bu zaten
// Next.js SSR için önerilen yöntem. Ancak varsayılan olarak `domain`
// belirtmez: çerez HOST-ONLY olur, yani yalnızca yazıldığı TAM host'ta
// (örn. pusula24.de) görünür — www.pusula24.de'de GÖRÜNMEZ ve tersi de
// öyle. Kullanıcı girişi bir host'ta yapıp (ör. apex) sonraki gezinme
// hosting/DNS katmanında diğerine (www) düşerse, oturum çerezi orada hiç
// bulunamaz — kimlik doğrulama başarılı olur ama "oturum yok" gibi görünür.
// Çözüm: gerçek prod host'unda (*.pusula24.de) `.pusula24.de` ile başlayan
// (üst) bir domain vererek çerezi apex+www arasında paylaştırıyoruz.
// window.location.hostname ÇALIŞMA ANINDA okunur (statik bir sabit değil),
// bu yüzden localhost/önizleme ortamlarında bu ayar devreye GİRMEZ ve
// geliştirici makinesindeki mevcut çalışan giriş etkilenmez.
function uretimCerezAyarlari() {
  if (typeof window === 'undefined') return {}
  if (!window.location.hostname.endsWith('pusula24.de')) return {}
  return { domain: '.pusula24.de', secure: true, sameSite: 'lax', path: '/' }
}

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookieOptions: uretimCerezAyarlari() }
  )
}

// Girişten hemen sonra "oturum gerçekten çereze yazıldı mı" diye doğrulamak
// için kullanılır. createClient()'in singleton'ı kullanmaz — isSingleton:
// false ile HER ZAMAN taze bir istemci oluşturur, böylece giriş sırasında
// bellek-içi (in-memory) kalan eski oturum durumuna değil, gerçekten
// depolamadan (çerezden) okunan veriye bakılmış olur. Bu, bir sonraki sayfa
// yüklemesinin/proxy.js'nin göreceğiyle birebir aynı kaynaktır.
export function createDogrulamaClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    { cookieOptions: uretimCerezAyarlari(), isSingleton: false }
  )
}
