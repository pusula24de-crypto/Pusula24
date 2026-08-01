'use client'

import { useState } from 'react'

export default function KopyalaButonu({ metin }) {
  const [kopyalandi, setKopyalandi] = useState(false)

  const handleKopyala = async () => {
    if (!metin) return
    try {
      await navigator.clipboard.writeText(metin)
      setKopyalandi(true)
      setTimeout(() => setKopyalandi(false), 1500)
    } catch {
      // Clipboard erişimi engellenmişse (izin/HTTPS vb.) sessizce yoksay.
    }
  }

  return (
    <button
      type="button"
      onClick={handleKopyala}
      className="whitespace-nowrap rounded border border-gray-800 bg-gray-950 px-2 py-1 text-xs text-gray-300 hover:border-red-600 hover:text-white transition"
    >
      {kopyalandi ? 'Kopyalandı ✓' : '📋 Kopyala'}
    </button>
  )
}
