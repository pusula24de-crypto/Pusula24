'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import RehberKart from './RehberKart'

const GOSTERILECEK_ADET = 4

// Fisher-Yates karıştırma — orijinal diziyi bozmadan yeni, rastgele
// sıralanmış bir dizi döner.
function karistir(dizi) {
  const kopya = [...dizi]
  for (let i = kopya.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[kopya[i], kopya[j]] = [kopya[j], kopya[i]]
  }
  return kopya
}

// Mümkün olduğunca farklı kategorilerden seçim yapar (aynı kategoriden
// `adet` kadar rehber gelme ihtimalini azaltır); kategori çeşidi
// yetersizse kalan kontenjanı karışık diziden sırayla doldurur.
function cesitlilikliSecim(karisikDizi, adet) {
  const secilenler = []
  const kullanilanKategoriler = new Set()

  for (const item of karisikDizi) {
    if (secilenler.length >= adet) break
    if (!kullanilanKategoriler.has(item.kategori)) {
      secilenler.push(item)
      kullanilanKategoriler.add(item.kategori)
    }
  }

  if (secilenler.length < adet) {
    for (const item of karisikDizi) {
      if (secilenler.length >= adet) break
      if (!secilenler.some((s) => s.id === item.id)) {
        secilenler.push(item)
      }
    }
  }

  return secilenler
}

function RehberKartIskeleti() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-neutral-200">
      <div className="aspect-16/10 w-full animate-pulse bg-neutral-200" />
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
        <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
        <div className="mt-auto h-5 w-2/5 animate-pulse rounded-full bg-neutral-200" />
      </div>
    </div>
  )
}

// Anasayfada "Çok Okunanlar" şeridinin yakınında, HER SAYFA YÜKLEMESİNDE
// rastgele seçilen birkaç rehberi tanıtan kısa bir bölüm. Seçim BİLİNÇLİ
// olarak tarayıcıda yapılır (sunucu/ISR önbelleklemesinden bağımsız) —
// böylece her ziyarette/yenilemede gerçekten farklı rehberler gösterilir.
// Hiç yayında rehber yoksa (yükleme bittikten sonra) render edilmez.
export default function RehberlerSeridi() {
  const [yukleniyor, setYukleniyor] = useState(true)
  const [gosterilecekler, setGosterilecekler] = useState([])

  useEffect(() => {
    let iptalEdildi = false
    const supabase = createClient()

    supabase
      .from('rehberler')
      .select('id, baslik, slug, ozet, gorsel_url, ai_gorsel_mi, kategori, son_guncelleme_tarihi')
      .eq('durum', 'published')
      .then(({ data }) => {
        if (iptalEdildi) return
        const karisik = karistir(data || [])
        setGosterilecekler(cesitlilikliSecim(karisik, GOSTERILECEK_ADET))
        setYukleniyor(false)
      })

    return () => {
      iptalEdildi = true
    }
  }, [])

  if (!yukleniyor && gosterilecekler.length === 0) return null

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
        {yukleniyor
          ? Array.from({ length: GOSTERILECEK_ADET }, (_, i) => <RehberKartIskeleti key={i} />)
          : gosterilecekler.map((r) => <RehberKart key={r.id} rehber={r} />)}
      </div>
    </section>
  )
}
