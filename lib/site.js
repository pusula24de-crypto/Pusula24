// Site kök adresi tek yerden yönetilir. Ortam değişkeni varsa onu, yoksa
// üretim alan adını kullanır. Sondaki eğik çizgi (varsa) temizlenir.
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://pusula24.de'
).replace(/\/$/, '')
