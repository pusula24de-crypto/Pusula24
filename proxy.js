import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function proxy(request) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (!user && request.nextUrl.pathname.startsWith('/admin')) {
    // "Oturum yok" ile "oturum okunamadı" ayrımı: error doluysa bu gerçek bir
    // API/ağ hatası ya da bozuk çerez demektir, sadece çerez eksikliği değil.
    // Davranış aynı kalır (güvenlik gereği yine /login'e yönlendirilir) ama
    // sunucu loguna düşer, böylece ileride "herkes login'e atılıyor" gibi
    // toplu bir sorun yaşanırsa ayrımı yapmak mümkün olur.
    if (error) {
      console.warn('[proxy] /admin için oturum okunamadı (çerez eksik değil, hata var):', error.message)
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (user && request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
}
