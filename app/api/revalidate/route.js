import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

// Otomasyon (pusula24-otomasyon-v6), admin panelinin Server Action'ını
// TARAYICI OLMADAN, doğrudan Supabase servis anahtarıyla yazdığında
// (bkz. haberKaydet Server Action'ındaki AYNI revalidatePath çağrıları)
// Next.js'in ISR önbelleğini TAZELEME imkânına ihtiyaç duyuyor —
// revalidatePath yalnızca Next.js sunucu bağlamından çağrılabiliyor,
// dışarıdan bir DB yazısıyla otomatik tetiklenmiyor. Bu endpoint o tek
// eksik parçayı kapatıyor: basit, paylaşılan-gizli-anahtarla korunan bir
// HTTP çağrısı.
export async function POST(request) {
  const gizliAnahtar = request.headers.get('x-revalidate-secret')
  if (!process.env.REVALIDATE_SECRET || gizliAnahtar !== process.env.REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 401 })
  }

  let govde
  try {
    govde = await request.json()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek gövdesi.' }, { status: 400 })
  }

  const slug = govde?.slug
  if (!slug || typeof slug !== 'string') {
    return NextResponse.json({ error: 'slug zorunlu.' }, { status: 400 })
  }

  revalidatePath('/')
  revalidatePath(`/haber/${slug}`)
  revalidatePath('/kategori/[slug]', 'page')

  return NextResponse.json({ success: true })
}
