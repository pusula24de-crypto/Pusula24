import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { createClient } from '@/lib/supabase/server'

// Marka lacivert — arka plan görseli hiç hazırlanamazsa (indirilemez/
// dönüştürülemezse) düz zemin olarak kullanılır; "boş" değil "sade" görünür.
const YEDEK_ZEMIN_RENGI = '#1E3A6E'

// Satori (ImageResponse'un render motoru) yalnızca PNG/JPEG render edebilir,
// WebP'yi arka plan <img> olarak GÖSTEREMEZ (sessizce boş kalır). Haber
// görselleri artık admin panelde WebP'ye sıkıştırılarak kaydedildiği için,
// arka plana koymadan önce haberin görselini burada sharp ile indirip
// JPEG'e çeviriyoruz — kaynak formatı ne olursa olsun (WebP/PNG/AVIF/JPEG)
// Satori'nin her zaman render edebileceği tek bir formata normalize eder.
// Büyük dış URL'lere (admin'den elle yapıştırılan, sıkıştırmadan geçmemiş
// görseller) karşı da resize ile üst sınır konur, hem hız hem bellek için.
async function gorselHazirla(url) {
  const yanit = await fetch(url)
  if (!yanit.ok) {
    throw new Error(`Görsel indirilemedi (HTTP ${yanit.status}): ${url}`)
  }
  const arrayBuffer = await yanit.arrayBuffer()
  const jpegBuffer = await sharp(Buffer.from(arrayBuffer))
    .resize({ width: 1920, height: 1920, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()
  return `data:image/jpeg;base64,${jpegBuffer.toString('base64')}`
}

// Font dosyaları Google Fonts CDN'den (eski/legacy tarayıcı isteği ile)
// latin-ext kapsayan tam TTF olarak indirilip assets/fonts/ altına konuldu.
// ImageResponse (Satori) Google Fonts'u otomatik yüklemez, ArrayBuffer ister.
async function fontlariYukle() {
  const [black, regular] = await Promise.all([
    readFile(join(process.cwd(), 'assets/fonts/Archivo-Black.ttf')),
    readFile(join(process.cwd(), 'assets/fonts/Archivo-Regular.ttf')),
  ])
  return { black, regular }
}

// Sol üst damga: Pusula24 beyaz amblemi (pusula sembolü). SVG metin içermediği
// için Satori'de data URI olarak güvenle render edilir (font bağımsız).
async function logoYukle() {
  const buffer = await readFile(join(process.cwd(), 'public/marka/sembol-beyaz.svg'))
  return `data:image/svg+xml;base64,${buffer.toString('base64')}`
}

function mansetBoyutuHesapla(baslik) {
  const uzunluk = baslik.length
  if (uzunluk <= 60) return 60
  if (uzunluk <= 95) return 50
  return 42
}

// Son bir güvenlik ağı: yukarıdaki 3 kademe zaten çoğu başlığı kapsıyor,
// ama olağanüstü uzun bir başlıkta 4 satırı taşmaması için sert bir üst sınır.
function baslikKisalt(baslik, limit = 190) {
  if (baslik.length <= limit) return baslik
  return baslik.slice(0, limit - 1).trimEnd() + '…'
}

// İki renk kuralı: başlıkta ilk ":" varsa öncesi (":" dahil) beyaz, sonrası
// sarı. Yoksa tamamı beyaz tek blok olarak döner.
function baslikRenkliBol(baslik) {
  const index = baslik.indexOf(':')
  if (index === -1) return { oncesi: baslik, sonrasi: '' }
  return {
    oncesi: baslik.slice(0, index + 1),
    sonrasi: baslik.slice(index + 1).trim(),
  }
}

export async function GET(request, { params }) {
  const { id } = await params
  const { searchParams } = new URL(request.url)
  const storyFormat = searchParams.get('format') === 'story'

  if (!id || Number.isNaN(Number(id))) {
    return new Response('Geçersiz haber id.', { status: 400 })
  }

  const supabase = await createClient()
  const { data: haber, error } = await supabase
    .from('haberler')
    .select('id, baslik, slug, gorsel_url, ai_gorsel_mi, yayin_tarihi, kategoriler!haberler_kategori_id_fkey(ad)')
    .eq('id', id)
    .single()

  if (error || !haber) {
    return new Response('Haber bulunamadı.', { status: 404 })
  }

  if (!haber.gorsel_url) {
    return new Response('Bu haberde görsel olmadığı için sosyal görsel üretilemiyor.', {
      status: 400,
    })
  }

  const GENISLIK = 1080
  const YUKSEKLIK = storyFormat ? 1920 : 1350
  // Story formatında üst %14, platformun kendi arayüzü (profil/ilerleme
  // çubuğu) için boş bırakılır — logo bu payın altından başlar.
  const UST_GUVENLI_ALAN = storyFormat ? Math.round(YUKSEKLIK * 0.14) : 0
  const METIN_GENISLIK = Math.round(GENISLIK * 0.78)

  const baslik = baslikKisalt(haber.baslik)
  const mansetBoyutu = mansetBoyutuHesapla(baslik)
  const { oncesi, sonrasi } = baslikRenkliBol(baslik)
  const kategoriAdi = haber.kategoriler?.ad || 'Gündem'

  try {
    const [{ black, regular }, logoDataUri] = await Promise.all([fontlariYukle(), logoYukle()])

    // Arka plan görseli hazırlığı ayrı bir try/catch'te: başarısız olursa
    // (görsel indirilemez/dönüştürülemez) tüm üretim 500 ile çökmek yerine
    // düz lacivert zemine düşer.
    let arkaPlanDataUri = null
    try {
      arkaPlanDataUri = await gorselHazirla(haber.gorsel_url)
    } catch (gorselHatasi) {
      console.error('[sosyal-gorsel] Arka plan görseli hazırlanamadı, düz zemine düşülüyor:', gorselHatasi)
    }

    const gorsel = new ImageResponse(
      (
        <div
          style={{
            position: 'relative',
            width: GENISLIK,
            height: YUKSEKLIK,
            display: 'flex',
            fontFamily: 'Archivo',
          }}
        >
          {/* TAM EKRAN GÖRSEL — yatayda ortalı, dikeyde alt kenardan
              kırpılır (Gemini'nin sağ alt köşedeki standart AI etiketi
              her zaman görünür kalsın diye üstten kırpma yapılır).
              Görsel hazırlanamadıysa (indirme/dönüştürme hatası) düz
              lacivert zemine düşülür — "boş" değil "sade" görünür. */}
          {arkaPlanDataUri ? (
            <img
              src={arkaPlanDataUri}
              alt=""
              width={GENISLIK}
              height={YUKSEKLIK}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                objectFit: 'cover',
                objectPosition: 'center bottom',
              }}
            />
          ) : (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                display: 'flex',
                width: GENISLIK,
                height: YUKSEKLIK,
                backgroundColor: YEDEK_ZEMIN_RENGI,
              }}
            />
          )}

          {/* Üstte hafif karartma — logo her zeminde okunaklı kalsın. */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              display: 'flex',
              width: GENISLIK,
              height: Math.round(YUKSEKLIK * 0.15),
              background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, rgba(0,0,0,0) 100%)',
            }}
          />

          {/* Alt %50'den başlayan lacivert-siyah gradyan — düz siyah değil,
              marka lacivertinin koyultulmuş tonu (#0B142D). */}
          <div
            style={{
              position: 'absolute',
              top: Math.round(YUKSEKLIK * 0.5),
              left: 0,
              display: 'flex',
              width: GENISLIK,
              height: Math.round(YUKSEKLIK * 0.5),
              background:
                'linear-gradient(180deg, rgba(11,20,45,0) 0%, rgba(11,20,45,0.55) 45%, rgba(11,20,45,0.96) 100%)',
            }}
          />

          {/* SOL ÜST — beyaz Pusula24 amblemi (kare). Sağ üst/sağ alt köşelere
              hiçbir öğe konulmuyor. */}
          <img
            src={logoDataUri}
            alt=""
            width={72}
            height={72}
            style={{
              position: 'absolute',
              top: 44 + UST_GUVENLI_ALAN,
              left: 48,
              objectFit: 'contain',
            }}
          />

          {/* SOL ALT — kategori çipi + manşet, alt kenardan 140px yukarıda
              biter, genişliği kanvasın ~%78'i ile sınırlı (sağ alt Gemini
              etiket bölgesine taşmasın). */}
          <div
            style={{
              position: 'absolute',
              left: 64,
              bottom: 140,
              width: METIN_GENISLIK,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignSelf: 'flex-start',
                backgroundColor: '#DC2626',
                color: '#FFFFFF',
                fontSize: 24,
                fontWeight: 900,
                letterSpacing: 1,
                textTransform: 'uppercase',
                padding: '10px 22px',
                borderRadius: 999,
              }}
            >
              {kategoriAdi}
            </div>

            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: 20 }}>
              <div style={{ display: 'flex', width: 8, backgroundColor: '#DC2626' }} />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: METIN_GENISLIK - 28,
                  maxHeight: mansetBoyutu * 1.12 * 4,
                  overflow: 'hidden',
                  fontSize: mansetBoyutu,
                  fontWeight: 900,
                  lineHeight: 1.12,
                }}
              >
                <div style={{ display: 'flex', color: '#FFFFFF' }}>{oncesi}</div>
                {sonrasi && <div style={{ display: 'flex', color: '#FACC15' }}>{sonrasi}</div>}
              </div>
            </div>
          </div>

          {/* EN ALT ORTA — pusula24.de + koşullu Symbolbild. */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 0,
              width: GENISLIK,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <div
              style={{
                display: 'flex',
                fontFamily: 'Archivo-Regular',
                fontSize: 26,
                letterSpacing: 1,
                color: '#FFFFFF',
              }}
            >
              pusula24.de
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: 'Archivo-Regular',
                fontSize: 16,
                color: 'rgba(255,255,255,0.55)',
                opacity: haber.ai_gorsel_mi ? 1 : 0,
              }}
            >
              Symbolbild
            </div>
          </div>
        </div>
      ),
      {
        width: GENISLIK,
        height: YUKSEKLIK,
        fonts: [
          { name: 'Archivo', data: black, weight: 900, style: 'normal' },
          { name: 'Archivo-Regular', data: regular, weight: 400, style: 'normal' },
        ],
      }
    )

    const dosyaAdi = `${haber.slug}-sosyal${storyFormat ? '-story' : ''}.png`
    const headers = new Headers(gorsel.headers)
    headers.set('Content-Disposition', `attachment; filename="${dosyaAdi}"`)

    return new Response(gorsel.body, { status: gorsel.status, headers })
  } catch (err) {
    console.error('[sosyal-gorsel] Görsel üretilemedi:', err)
    return new Response(
      'Sosyal görsel üretilemedi. Haberin görsel URL\'i erişilebilir olmayabilir veya font/logo dosyaları eksik olabilir.',
      { status: 500 }
    )
  }
}
