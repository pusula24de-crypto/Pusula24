// Pusula24 logosu — pusula (ibre) sembolü + "Pusula24" yazısı, inline SVG.
// <img src="...svg"> KULLANILMAZ: dışarıdan referanslanan SVG'ler ayrı bir
// belge bağlamında açılır ve sayfanın next/font ile yüklediği Space Grotesk'i
// göremez, metin sistem fontuna düşer. Inline SVG sayfanın CSS kaskadına dahil
// olduğu için --font-logo (Space Grotesk) değişkenini doğru miras alır.

const VARYANTLAR = {
  // Açık zemin (header): lacivert halka + kırmızı ibre + lacivert kuyruk,
  // koyu metin, "24" kırmızı.
  renkli: { halka: '#1E3A6E', kuyruk: '#1E3A6E', metin: '#101828', vurgu: '#DC2626' },
  // Koyu zemin (footer): beyaz halka + kırmızı ibre + beyaz kuyruk, beyaz
  // metin, "24" açık kırmızı.
  beyaz: { halka: '#ffffff', kuyruk: '#ffffff', metin: '#ffffff', vurgu: '#f0716b' },
}

export default function Pusula24Logo({ varyant = 'renkli', className = '' }) {
  const renk = VARYANTLAR[varyant] || VARYANTLAR.renkli

  return (
    <svg
      viewBox="0 0 300 72"
      className={className}
      role="img"
      aria-label="Pusula24"
      style={{ fontFamily: 'var(--font-logo), sans-serif' }}
    >
      <g transform="translate(0,6) scale(1.6667)">
        <circle cx="18" cy="18" r="16" fill="none" stroke={renk.halka} strokeWidth="3.5" />
        <path d="M18 18 L24.5 11.5 L20.5 20.5 Z" fill="#DC2626" />
        <path d="M18 18 L11.5 24.5 L15.5 15.5 Z" fill={renk.kuyruk} />
      </g>
      <text x="74" y="53" fontSize="50" fontWeight="700" letterSpacing="-1.6" fill={renk.metin}>
        Pusula<tspan fill={renk.vurgu}>24</tspan>
      </text>
    </svg>
  )
}
