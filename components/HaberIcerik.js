import Link from 'next/link'
import Markdown from 'react-markdown'
import remarkBreaks from 'remark-breaks'
import { formatTarih } from '@/lib/format'
import PaylasimButonlari from './PaylasimButonlari'

const SITE_URL = 'https://www.pusula24.de'

// Hem sunucu (ilk haber, SEO) hem de istemci (SiradakiHaberAkisi ile akışa
// eklenen haberler) tarafında kullanılabilen saf sunum bileşeni. Tam haber
// şablonunu üretir: künye, başlık, spot, üst paylaşım çubuğu, görsel, gövde,
// kaynak kutusu ve alt paylaşım çubuğu. Kendi dış <main>/padding'ini içermez;
// çağıran taraf max-w-3xl bir kapsayıcıya sarar.
export default function HaberIcerik({ haber, oncelikli = false }) {
  const paylasimUrl = `${SITE_URL}/haber/${haber.slug}`

  return (
    <>
      <nav className="mb-4 text-sm text-neutral-500">
        <Link href="/" className="hover:text-red-600">Anasayfa</Link>
        {haber.kategoriler && (
          <>
            <span className="mx-2">›</span>
            <Link href={`/kategori/${haber.kategoriler.slug}`} className="hover:text-red-600">
              {haber.kategoriler.ad}
            </Link>
          </>
        )}
      </nav>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="inline-block text-xs font-bold uppercase tracking-wide text-red-600">
            {haber.kategoriler?.ad || 'Gündem'}
          </span>
          {haber.ek_kategoriler && haber.ek_kategoriler.length > 0 && (
            <span className="text-xs text-neutral-400">
              + {haber.ek_kategoriler.map((k) => k.ad).join(', ')}
            </span>
          )}
        </div>
        <h1 className="font-heading text-4xl font-black leading-tight text-neutral-900 md:text-5xl">
          {haber.baslik}
        </h1>
        {haber.ozet && (
          <p className="border-l-4 border-red-600 pl-4 text-xl text-neutral-600">{haber.ozet}</p>
        )}
        <div className="flex items-center gap-3 border-b border-neutral-200 pb-4 text-xs text-neutral-500">
          <span>Yayıncı: <b className="text-neutral-700">Pusula24 Redaksiyon</b></span>
          <span>•</span>
          <span>{formatTarih(haber.yayin_tarihi)}</span>
        </div>
      </div>

      {/* Başlığın/spotun altındaki paylaşım çubuğu */}
      <PaylasimButonlari url={paylasimUrl} baslik={haber.baslik} className="mt-4" />

      {haber.gorsel_url && (
        <figure className="mt-6">
          <div className="relative aspect-16/9 overflow-hidden rounded-lg bg-neutral-100">
            <img
              src={haber.gorsel_url}
              alt={haber.gorsel_alt || haber.baslik}
              loading={oncelikli ? 'eager' : 'lazy'}
              className="h-full w-full object-cover"
            />
          </div>
          {haber.ai_gorsel_mi ? (
            <figcaption className="mt-2 text-center text-xs italic text-neutral-500">
              Görsel: KI-generiert · Symbolbild — yapay zekâ ile üretilmiş temsili görsel
            </figcaption>
          ) : (
            haber.gorsel_kaynak_notu && (
              <figcaption className="mt-2 text-center text-xs italic text-neutral-500">
                Fotoğraf: {haber.gorsel_kaynak_notu}
              </figcaption>
            )
          )}
        </figure>
      )}

      <article className="prose prose-lg prose-headings:font-heading prose-a:text-red-600 hover:prose-a:text-red-700 mx-auto mt-8 max-w-2xl">
        {/* remark-breaks: tek \n satır sonlarını da <br> olarak render eder.
            Admin panelden yapıştırılan metinlerde paragraflar arası çift
            boşluk kaybolsa bile satırlar birbirine "dümdüz" akmaz, en azından
            alt alta düzgün ayrışır. */}
        <Markdown remarkPlugins={[remarkBreaks]}>{haber.govde}</Markdown>
      </article>

      {haber.kaynak_adi && (
        <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-600">
          Bu haber{' '}
          {haber.kaynak_url ? (
            <a
              href={haber.kaynak_url}
              target="_blank"
              rel="nofollow noopener"
              className="font-semibold text-red-600 hover:underline"
            >
              {haber.kaynak_adi}
            </a>
          ) : (
            <span className="font-semibold text-neutral-700">{haber.kaynak_adi}</span>
          )}{' '}
          resmi açıklaması temel alınarak hazırlanmıştır.
        </div>
      )}

      {/* Yazının sonundaki paylaşım çubuğu */}
      <div className="mx-auto mt-8 max-w-2xl border-t border-neutral-200 pt-6">
        <PaylasimButonlari url={paylasimUrl} baslik={haber.baslik} />
      </div>
    </>
  )
}
