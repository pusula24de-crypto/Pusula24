import { NextResponse } from 'next/server'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'

// lib/gorselOptimizasyon.js'teki MAKS_KENAR/KALITE ile senkron tutulmalı —
// o dosya tarayıcıya özgü kod (browser-image-compression, canvas) içerdiği
// için buraya doğrudan import edilmiyor, sabitler bilinçli olarak
// yinelendi.
const MAKS_KENAR = 1600
const SUNUCU_KALITE = 90 // gorselOptimizasyon.js'teki KALITE=0.9 ile aynı ölçek

// iOS Safari/WebKit gibi <canvas>.toBlob() ile WebP ÇIKIŞI üretemeyen
// tarayıcılardan gelen görseller için: istemci hiçbir kayıplı sıkıştırma
// yapmadan (bkz. gorselSikistir'deki yorum — çifte kayıplı geçiş JPEG'e
// özgü gren/blok artefaktlarını sabitlerdi) HAM dosyayı buraya yollar,
// burada sharp ile TEK seferde 1600px + gerçek WebP'ye çevrilir — masaüstü
// (tarayıcı-webp) yoluyla aynı kalitede sonuç verir.
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user }, error: yetkiHatasi } = await supabase.auth.getUser()
  if (yetkiHatasi || !user) {
    return NextResponse.json({ error: 'Yetkisiz işlem girişimi!' }, { status: 401 })
  }

  let formData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 })
  }

  const dosya = formData.get('dosya')
  if (!dosya || typeof dosya === 'string') {
    return NextResponse.json({ error: 'Görsel dosyası bulunamadı.' }, { status: 400 })
  }

  try {
    const arrayBuffer = await dosya.arrayBuffer()
    const webpBuffer = await sharp(Buffer.from(arrayBuffer))
      .rotate() // EXIF Orientation'ı uygulayıp EXIF'i temizler
      .resize({ width: MAKS_KENAR, height: MAKS_KENAR, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: SUNUCU_KALITE })
      .toBuffer()

    // KANITLANMIŞ HATA (bkz. proje geçmişi): Vercel'de ham bir Node Buffer
    // doğrudan NextResponse'a verilince ikili veri bozuluyor — indirilen
    // dosyalarda tekrarlayan "ef bf bd" (U+FFFD) baytları görülüyor, yani
    // içerik bir yerlerde UTF-8 metin gibi decode edilip yeniden encode
    // ediliyor. Aynı sharp çıktısını Uint8Array'e sarıp vermek (yerelde VE
    // canlıda ayrı ayrı doğrulandı) sorunu tamamen ortadan kaldırıyor.
    return new NextResponse(new Uint8Array(webpBuffer), {
      status: 200,
      headers: { 'Content-Type': 'image/webp' },
    })
  } catch (err) {
    return NextResponse.json(
      { error: 'Görsel sunucuda işlenemedi: ' + err.message },
      { status: 500 }
    )
  }
}
