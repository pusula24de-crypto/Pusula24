import {
  FaLandmark,
  FaEarthEurope,
  FaStarAndCrescent,
  FaHeartPulse,
  FaGlobe,
  FaFutbol,
  FaMasksTheater,
} from 'react-icons/fa6'

// Kategori slug -> react-icons/fa6 ikonu. Bilinmeyen bir slug için ikonsuz
// düşülür (fallback null), telif sorunu olan emoji/marka/bayrak kullanılmaz.
const KATEGORI_IKONLARI = {
  almanya: FaLandmark,
  avrupa: FaEarthEurope,
  turkiye: FaStarAndCrescent,
  yasam: FaHeartPulse,
  dunya: FaGlobe,
  spor: FaFutbol,
  'kultur-sanat': FaMasksTheater,
}

// Render sırasında değişken bir bileşen referansına atayıp <Değişken />
// olarak kullanmak yerine (react-hooks/static-components kuralı bunu
// yasaklıyor — her render'da "yeni" bir bileşen türü oluşmuş sayılır),
// eşlemeyi burada, modül kapsamında sabit bir bileşende çözüyoruz.
export default function KategoriIkon({ slug, size = 18, className = 'text-red-600' }) {
  const Icon = KATEGORI_IKONLARI[slug]
  if (!Icon) return null
  return <Icon size={size} className={className} />
}
