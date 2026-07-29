import { NextResponse } from 'next/server'
import sharp from 'sharp'

// GEÇİCİ — Vercel'de "new NextResponse(buffer,...)" yanıtının ikili veriyi
// bozduğu doğrulandı (ef bf bd / U+FFFD tekrarları — bkz. proje geçmişi).
// Bu route, farklı response oluşturma desenlerini ?v= parametresiyle canlıda
// tek tek test etmek için. Doğru desen bulununca kaldırılacak.
export async function GET(request) {
  const varyant = new URL(request.url).searchParams.get('v') || '1'

  const webpBuffer = await sharp({
    create: { width: 200, height: 200, channels: 3, background: { r: 255, g: 100, b: 50 } },
  })
    .webp({ quality: 90 })
    .toBuffer()

  const baslikBilgisi = { status: 200, headers: { 'Content-Type': 'image/webp' } }

  if (varyant === '1') {
    // Orijinal (bozuk olduğu doğrulanan) desen — kontrol amaçlı.
    return new NextResponse(webpBuffer, baslikBilgisi)
  }

  if (varyant === '2') {
    // Ham Buffer yerine açıkça Uint8Array.
    return new NextResponse(new Uint8Array(webpBuffer), baslikBilgisi)
  }

  if (varyant === '3') {
    // Alttaki ArrayBuffer'ı dilimleyip ver.
    const arrayBuffer = webpBuffer.buffer.slice(
      webpBuffer.byteOffset,
      webpBuffer.byteOffset + webpBuffer.byteLength
    )
    return new NextResponse(arrayBuffer, baslikBilgisi)
  }

  if (varyant === '4') {
    // NextResponse yerine web-standart Response.
    return new Response(new Uint8Array(webpBuffer), baslikBilgisi)
  }

  if (varyant === '5') {
    // ReadableStream olarak.
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(new Uint8Array(webpBuffer))
        controller.close()
      },
    })
    return new NextResponse(stream, baslikBilgisi)
  }

  if (varyant === '6') {
    // Content-Length'i açıkça belirt.
    return new NextResponse(new Uint8Array(webpBuffer), {
      status: 200,
      headers: { 'Content-Type': 'image/webp', 'Content-Length': String(webpBuffer.length) },
    })
  }

  return NextResponse.json({ error: 'bilinmeyen varyant' }, { status: 400 })
}
