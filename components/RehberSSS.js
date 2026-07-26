'use client'

import { useState } from 'react'
import { FaChevronDown } from 'react-icons/fa6'

// Rehber detayındaki SSS bölümü — tıklayınca açılan sade bir accordion.
// FAQPage JSON-LD şeması AYRI olarak app/rehber/[slug]/page.js'te aynı
// `sss` verisinden üretilir; bu bileşen yalnızca görsel sunumdan sorumlu.
export default function RehberSSS({ sss }) {
  const [acikIndex, setAcikIndex] = useState(null)

  if (!sss || sss.length === 0) return null

  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <h2 className="mb-3 font-heading text-sm font-bold uppercase tracking-wide text-neutral-500">
        Sık Sorulan Sorular
      </h2>
      <div className="divide-y divide-neutral-200 rounded-lg border border-neutral-200">
        {sss.map((item, i) => {
          const acik = acikIndex === i
          return (
            <div key={i}>
              <button
                type="button"
                onClick={() => setAcikIndex(acik ? null : i)}
                aria-expanded={acik}
                className="flex w-full items-center justify-between gap-4 p-4 text-left"
              >
                <span className="font-heading font-bold text-neutral-900">{item.soru}</span>
                <FaChevronDown
                  size={14}
                  className={`shrink-0 text-neutral-400 transition-transform ${acik ? 'rotate-180' : ''}`}
                />
              </button>
              {acik && (
                <div className="whitespace-pre-line px-4 pb-4 text-sm leading-relaxed text-neutral-600">
                  {item.cevap}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
