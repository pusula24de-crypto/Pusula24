// "Tutulma" sembolü + HabEropa yazısı, inline SVG olarak render edilir.
// <img src="...svg"> KULLANILMAZ: dışarıdan referanslanan SVG'ler ayrı bir
// belge bağlamında açılır ve sayfanın next/font ile yüklediği Space
// Grotesk'i göremez, bu yüzden metin sistem fontuna düşer. Inline SVG,
// sayfanın CSS kaskadına dahil olduğu için --font-logo değişkenini doğru
// şekilde miras alır.

const VARYANTLAR = {
  renkli: { hilal: '#1E3A6E', harfE: '#1E3A6E', metin: '#101828', maskId: 'hab-logo-mask-renkli' },
  beyaz: { hilal: '#ffffff', harfE: '#7e9bd4', metin: '#ffffff', maskId: 'hab-logo-mask-beyaz' },
}

export default function HaberopaLogo({ varyant = 'renkli', className = '' }) {
  const renk = VARYANTLAR[varyant] || VARYANTLAR.renkli

  return (
    <svg
      viewBox="0 0 330 72"
      className={className}
      role="img"
      aria-label="Haberopa"
      style={{ fontFamily: 'var(--font-logo), sans-serif' }}
    >
      <g transform="translate(0,6) scale(1.6667)">
        <mask id={renk.maskId}>
          <rect width="36" height="36" fill="#fff" />
          <circle cx="24" cy="12" r="13" fill="#000" />
        </mask>
        <circle cx="17" cy="19" r="13.5" fill={renk.hilal} mask={`url(#${renk.maskId})`} />
        <circle cx="27" cy="9" r="5" fill="#DC2626" />
      </g>
      <text x="74" y="53" fontSize="50" fontWeight="700" letterSpacing="-1.6" fill={renk.metin}>
        Hab<tspan fill={renk.harfE}>E</tspan>ropa
      </text>
    </svg>
  )
}
