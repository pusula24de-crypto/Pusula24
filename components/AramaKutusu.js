'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FaMagnifyingGlass, FaXmark } from 'react-icons/fa6'

export default function AramaKutusu({ variant = 'masaustu' }) {
  const [sorgu, setSorgu] = useState('')
  const [mobilAcik, setMobilAcik] = useState(false)
  const router = useRouter()

  const araVeGit = () => {
    const temiz = sorgu.trim()
    if (!temiz) return
    router.push(`/arama?q=${encodeURIComponent(temiz)}`)
    setSorgu('')
    setMobilAcik(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') araVeGit()
  }

  if (variant === 'mobil') {
    return (
      <>
        <button
          onClick={() => setMobilAcik((acik) => !acik)}
          aria-label="Arama"
          aria-expanded={mobilAcik}
          className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-600 transition hover:bg-red-600 hover:text-white md:hidden"
        >
          {mobilAcik ? <FaXmark size={16} /> : <FaMagnifyingGlass size={16} />}
        </button>

        {mobilAcik && (
          <div className="absolute inset-x-0 top-full z-10 border-t border-neutral-200 bg-white px-4 py-3 shadow-sm md:hidden">
            <div className="flex items-center gap-2 rounded-full border border-neutral-300 px-3 py-2 focus-within:border-red-600">
              <FaMagnifyingGlass size={14} className="shrink-0 text-neutral-400" />
              <input
                autoFocus
                type="text"
                value={sorgu}
                onChange={(e) => setSorgu(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Haber ara..."
                className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
              />
              <button onClick={araVeGit} aria-label="Ara" className="shrink-0 text-neutral-400 transition hover:text-red-600">
                <FaMagnifyingGlass size={14} />
              </button>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <div className="group flex w-[200px] items-center gap-2 rounded-full border border-neutral-300 bg-white px-3 py-1.5 transition-all duration-300 focus-within:w-[280px] focus-within:border-red-600">
      <button
        onClick={araVeGit}
        aria-label="Ara"
        className="shrink-0 text-neutral-400 transition group-focus-within:text-red-600"
      >
        <FaMagnifyingGlass size={14} />
      </button>
      <input
        type="text"
        value={sorgu}
        onChange={(e) => setSorgu(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Haber ara..."
        className="w-full bg-transparent text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none"
      />
    </div>
  )
}
