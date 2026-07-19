'use client'

import { useEffect } from 'react'

// AdSense kodunu (yönetici panelinden yapıştırılan ham <script> parçacığı)
// yalnızca AdSense AÇIKKEN head'e enjekte eder. innerHTML ile eklenen script'ler
// tarayıcıda çalışmadığı için, parçacık ayrıştırılıp gerçek <script> düğümleri
// yeniden oluşturulur ve head'e eklenir. AdSense kapalıyken bu bileşen hiç
// render edilmez; dolayısıyla hiçbir üçüncü taraf script'i yüklenmez.
export default function AdSenseYukleyici({ kod }) {
  useEffect(() => {
    if (!kod) return

    const kap = document.createElement('div')
    kap.innerHTML = kod
    const scriptler = kap.querySelectorAll('script')
    const eklenenler = []

    scriptler.forEach((eski) => {
      const yeni = document.createElement('script')
      for (const attr of eski.attributes) {
        yeni.setAttribute(attr.name, attr.value)
      }
      if (eski.textContent) yeni.textContent = eski.textContent
      yeni.setAttribute('data-adsense-pusula24', 'true')
      document.head.appendChild(yeni)
      eklenenler.push(yeni)
    })

    return () => {
      eklenenler.forEach((s) => s.remove())
    }
  }, [kod])

  return null
}
