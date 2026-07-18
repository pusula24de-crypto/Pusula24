export function formatTarih(tarih) {
  if (!tarih) return ''
  return new Date(tarih).toLocaleDateString('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

export function formatTL(sayi) {
  return sayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
