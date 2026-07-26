import Link from 'next/link'
import RehberKart from './RehberKart'

// Anasayfada "Çok Okunanlar" şeridinin yakınında, en yeni/güncellenmiş
// birkaç rehberi tanıtan kısa bir bölüm. Hiç yayında rehber yoksa
// render edilmez.
export default function RehberlerSeridi({ rehberler }) {
  if (!rehberler || rehberler.length === 0) return null

  return (
    <section>
      <div className="mb-5 flex items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="h-6 w-1 bg-blue-600" />
          <h2 className="font-heading text-xl font-extrabold text-neutral-900 md:text-2xl">
            📖 Faydalı Rehberler
          </h2>
        </div>
        <span className="h-px flex-1 bg-neutral-200" />
        <Link
          href="/rehberler"
          className="shrink-0 text-sm font-medium text-neutral-600 transition hover:text-blue-600"
        >
          Tümü →
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {rehberler.map((r) => (
          <RehberKart key={r.id} rehber={r} />
        ))}
      </div>
    </section>
  )
}
