import { NextResponse } from 'next/server'
import sharp from 'sharp'

// GEÇİCİ — /api/gorsel-webp'teki "new NextResponse(buffer, ...)" response
// oluşturma deseninin, kimlik doğrulamadan bağımsız olarak, ikili veriyi
// bozup bozmadığını izole test etmek için. Doğrulama bitince silinecek.
export async function GET() {
  const webpBuffer = await sharp({
    create: { width: 200, height: 200, channels: 3, background: { r: 255, g: 100, b: 50 } },
  })
    .webp({ quality: 90 })
    .toBuffer()

  return new NextResponse(webpBuffer, {
    status: 200,
    headers: { 'Content-Type': 'image/webp' },
  })
}
