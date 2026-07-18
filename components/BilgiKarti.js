'use client'

import { useEffect, useState } from 'react'
import { FaEuroSign, FaDollarSign } from 'react-icons/fa6'
import { GiGoldBar } from 'react-icons/gi'
import {
  WiDaySunny,
  WiDayCloudy,
  WiCloudy,
  WiFog,
  WiDayRain,
  WiDayShowers,
  WiDaySnow,
  WiDayThunderstorm,
} from 'react-icons/wi'

const KUR_CACHE_SURESI = 10 * 60 * 1000
const HAVA_CACHE_SURESI = 30 * 60 * 1000
const BERLIN_KONUM = { lat: 52.52, lon: 13.41, sehir: 'Berlin' }

function cacheOku(anahtar, sure) {
  try {
    const ham = localStorage.getItem(anahtar)
    if (!ham) return null
    const { ts, veri } = JSON.parse(ham)
    if (Date.now() - ts > sure) return null
    return veri
  } catch {
    return null
  }
}

function cacheYaz(anahtar, veri) {
  try {
    localStorage.setItem(anahtar, JSON.stringify({ ts: Date.now(), veri }))
  } catch {
    // localStorage kullanılamıyorsa (gizli sekme vb.) sessizce geç
  }
}

function formatTL(sayi) {
  return sayi.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function yediGunOnce() {
  const d = new Date()
  d.setUTCDate(d.getUTCDate() - 7)
  return d.toISOString().slice(0, 10)
}

// Frankfurter time-series: son ~7 günün kurlarını döndürür, böylece
// "bugün" ve "önceki iş günü" kesin olarak iki FARKLI tarihten gelir
// (latest + latest-1 endpoint'lerini ayrı ayrı çekmenin hafta sonu/tatilde
// aynı değere denk gelme riskini ortadan kaldırır). sonTarih/oncekiTarih
// döndürülen objede saklanır ki cache'e yazılırken hangi tarihin hangi
// değere ait olduğu karışmasın ve konsolda doğrulanabilsin.
async function paraBirimiSerisiGetir(base) {
  const res = await fetch(
    `https://api.frankfurter.dev/v1/${yediGunOnce()}..?base=${base}&symbols=TRY`
  )
  if (!res.ok) return null
  const data = await res.json()
  const tarihler = Object.keys(data?.rates || {}).sort()
  if (tarihler.length === 0) return null

  const sonTarih = tarihler[tarihler.length - 1]
  const son = data.rates[sonTarih]?.TRY
  if (!son) return null

  if (tarihler.length < 2) return { son, sonTarih, onceki: null, oncekiTarih: null, yuzde: null }

  const oncekiTarih = tarihler[tarihler.length - 2]
  const onceki = data.rates[oncekiTarih]?.TRY
  if (!onceki) return { son, sonTarih, onceki: null, oncekiTarih: null, yuzde: null }

  return { son, sonTarih, onceki, oncekiTarih, yuzde: ((son - onceki) / onceki) * 100 }
}

function kurTarihleriniLogla(etiket, sonuc) {
  if (!sonuc) return
  if (sonuc.oncekiTarih && sonuc.sonTarih === sonuc.oncekiTarih) {
    console.warn(
      `[BilgiKarti] UYARI: ${etiket} için bugün ve önceki tarih AYNI (${sonuc.sonTarih}) — yüzde hesaplaması hatalı olabilir.`
    )
    return
  }
  console.log(
    `[BilgiKarti] ${etiket}: ${sonuc.oncekiTarih ?? '?'} (${sonuc.onceki ?? '?'}) -> ${sonuc.sonTarih} (${sonuc.son}), değişim: ${sonuc.yuzde?.toFixed(4) ?? 'yok'}%`
  )
}

// Open-Meteo weather_code -> ikon + gerçekçi renk
function havaGorseli(kod) {
  if (kod === 0 || kod === 1) return { Icon: WiDaySunny, renk: 'text-amber-500' }
  if (kod === 2) return { Icon: WiDayCloudy, renk: 'text-neutral-400' }
  if (kod === 3) return { Icon: WiCloudy, renk: 'text-neutral-400' }
  if (kod === 45 || kod === 48) return { Icon: WiFog, renk: 'text-neutral-400' }
  if (kod >= 51 && kod <= 67) return { Icon: WiDayRain, renk: 'text-sky-500' }
  if (kod >= 80 && kod <= 82) return { Icon: WiDayShowers, renk: 'text-sky-500' }
  if ((kod >= 71 && kod <= 77) || (kod >= 85 && kod <= 86)) return { Icon: WiDaySnow, renk: 'text-sky-300' }
  if (kod >= 95 && kod <= 99) return { Icon: WiDayThunderstorm, renk: 'text-indigo-500' }
  return { Icon: WiDayCloudy, renk: 'text-neutral-400' }
}

function konumAl() {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ...BERLIN_KONUM })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, sehir: null }),
      () => resolve({ ...BERLIN_KONUM }),
      { timeout: 5000, maximumAge: HAVA_CACHE_SURESI }
    )
  })
}

async function sehirAdiGetir(lat, lon) {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=tr`
    )
    if (!res.ok) return null
    const data = await res.json()
    return data.city || data.locality || null
  } catch {
    return null
  }
}

const GUNCEL_CACHE_ANAHTARLARI = new Set(['ho_kur_v7', 'ho_altin_v5', 'ho_hava_v5'])

// Önceki sürümlerden kalan (ho_kur_v5, ho_kur_dun_v5, ho_kur_v6, ho_altin_v4 vb.)
// tüm eski "ho_" önekli anahtarları temizler; aksi halde bayat/uyumsuz şekilli
// veri okunabilir (ör. bugün ve dün için ayrı cache'lenip birbirine karışan
// eski format).
function eskiCacheTemizle() {
  try {
    const silinecekler = []
    for (let i = 0; i < localStorage.length; i++) {
      const anahtar = localStorage.key(i)
      if (anahtar && anahtar.startsWith('ho_') && !GUNCEL_CACHE_ANAHTARLARI.has(anahtar)) {
        silinecekler.push(anahtar)
      }
    }
    silinecekler.forEach((anahtar) => localStorage.removeItem(anahtar))
  } catch {
    // localStorage kullanılamıyorsa sessizce geç
  }
}

// undefined = yükleniyor, null = alınamadı (kart/rozet gizlenir), değer = hazır
function useAnasayfaBilgileri() {
  const [kur, setKur] = useState(undefined)
  const [altin, setAltin] = useState(undefined)
  const [hava, setHava] = useState(undefined)

  useEffect(() => {
    let iptalEdildi = false

    eskiCacheTemizle()

    async function kurYukle() {
      const onbellek = cacheOku('ho_kur_v7', KUR_CACHE_SURESI)
      if (onbellek) {
        kurTarihleriniLogla('EUR/TRY (cache)', onbellek.euro)
        kurTarihleriniLogla('USD/TRY (cache)', onbellek.usd)
        if (!iptalEdildi) setKur(onbellek.veri)
        return onbellek.veri
      }
      try {
        const [eur, usd] = await Promise.all([
          paraBirimiSerisiGetir('EUR'),
          paraBirimiSerisiGetir('USD'),
        ])
        kurTarihleriniLogla('EUR/TRY', eur)
        kurTarihleriniLogla('USD/TRY', usd)
        if (eur || usd) {
          const veri = {
            euroTry: eur?.son ?? null,
            euroYuzde: eur?.yuzde ?? null,
            usdTry: usd?.son ?? null,
            usdYuzde: usd?.yuzde ?? null,
          }
          if (!iptalEdildi) setKur(veri)
          cacheYaz('ho_kur_v7', { veri, euro: eur, usd })
          return veri
        }
      } catch {
        // kur alınamazsa aşağıda null'a düşürülür
      }
      if (!iptalEdildi) setKur(null)
      return null
    }

    async function altinYukle(usdTry) {
      const onbellek = cacheOku('ho_altin_v5', KUR_CACHE_SURESI)
      if (onbellek) {
        if (!iptalEdildi) setAltin(onbellek.gram)
        return
      }
      if (!usdTry) {
        if (!iptalEdildi) setAltin(null)
        return
      }
      try {
        const res = await fetch('https://api.gold-api.com/price/XAU')
        if (!res.ok) {
          if (!iptalEdildi) setAltin(null)
          return
        }
        const data = await res.json()
        const onsUsd = data?.price
        if (onsUsd) {
          const gramTl = (onsUsd / 31.1035) * usdTry
          if (!iptalEdildi) setAltin(gramTl)
          cacheYaz('ho_altin_v5', { gram: gramTl })
          return
        }
        if (!iptalEdildi) setAltin(null)
      } catch {
        if (!iptalEdildi) setAltin(null)
      }
      // Not: gold-api ücretsiz uçta geçmiş tarih desteklemiyor (denendi, 404 döndü),
      // bu yüzden altın için % değişim rozeti kasıtlı olarak hesaplanmıyor.
    }

    async function havaYukle() {
      const onbellek = cacheOku('ho_hava_v5', HAVA_CACHE_SURESI)
      if (onbellek) {
        if (!iptalEdildi) setHava(onbellek)
        return
      }
      try {
        const konum = await konumAl()
        const res = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${konum.lat}&longitude=${konum.lon}&current=temperature_2m,weather_code`
        )
        const data = await res.json()
        const sicaklik = data?.current?.temperature_2m
        const kod = data?.current?.weather_code
        if (sicaklik === undefined) {
          if (!iptalEdildi) setHava(null)
          return
        }
        const sehir = konum.sehir || (await sehirAdiGetir(konum.lat, konum.lon)) || 'Konumunuz'
        const veri = { sicaklik, kod, sehir }
        if (!iptalEdildi) setHava(veri)
        cacheYaz('ho_hava_v5', veri)
      } catch {
        if (!iptalEdildi) setHava(null)
      }
    }

    kurYukle().then((veri) => altinYukle(veri?.usdTry))
    havaYukle()

    return () => {
      iptalEdildi = true
    }
  }, [])

  return { kur, altin, hava }
}

function Kart({ children }) {
  return (
    <div className="flex h-20 items-center gap-3 rounded-lg border border-neutral-200 bg-white px-4 shadow-sm">
      {children}
    </div>
  )
}

function IkonDaire({ children, className = '' }) {
  return (
    <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${className}`}>
      {children}
    </div>
  )
}

function YuzdeRozet({ yuzde }) {
  if (yuzde === null || yuzde === undefined) return null

  const yukselis = yuzde > 0
  const dusus = yuzde < 0
  const renk = yukselis ? 'text-emerald-600' : dusus ? 'text-red-600' : 'text-neutral-400'
  const ok = yukselis ? '▲' : dusus ? '▼' : '–'
  const mutlakYuzde = Math.abs(yuzde).toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  return (
    <span className={`text-xs font-semibold ${renk}`}>
      {ok} %{mutlakYuzde}
    </span>
  )
}

export default function BilgiKarti() {
  const { kur, altin, hava } = useAnasayfaBilgileri()

  const havaData = hava && hava !== null ? havaGorseli(hava.kod) : null
  const euroVar = kur === undefined || kur?.euroTry != null
  const usdVar = kur === undefined || kur?.usdTry != null

  return (
    <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {hava !== null && (
        <Kart>
          <IkonDaire className="bg-amber-50">
            {havaData ? (
              <havaData.Icon size={30} className={havaData.renk} />
            ) : (
              <WiDaySunny size={30} className="text-neutral-200" />
            )}
          </IkonDaire>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-neutral-500">
              {hava ? hava.sehir : 'Hava Durumu'}
            </p>
            <p className="text-lg font-bold text-neutral-900">
              {hava ? `${Math.round(hava.sicaklik)}°C` : '···'}
            </p>
          </div>
        </Kart>
      )}

      {kur !== null && euroVar && (
        <Kart>
          <IkonDaire className="bg-red-50">
            <FaEuroSign size={20} className="text-red-600" />
          </IkonDaire>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-500">Euro / TL</p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold text-neutral-900">
                {kur?.euroTry != null ? formatTL(kur.euroTry) : '···'}
              </p>
              <YuzdeRozet yuzde={kur?.euroYuzde} />
            </div>
          </div>
        </Kart>
      )}

      {kur !== null && usdVar && (
        <Kart>
          <IkonDaire className="bg-emerald-50">
            <FaDollarSign size={20} className="text-emerald-600" />
          </IkonDaire>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-500">Dolar / TL</p>
            <div className="flex items-baseline gap-2">
              <p className="text-lg font-bold text-neutral-900">
                {kur?.usdTry != null ? formatTL(kur.usdTry) : '···'}
              </p>
              <YuzdeRozet yuzde={kur?.usdYuzde} />
            </div>
          </div>
        </Kart>
      )}

      {altin !== null && (
        <Kart>
          <IkonDaire className="bg-yellow-50">
            <GiGoldBar size={22} className="text-yellow-600" />
          </IkonDaire>
          <div className="min-w-0">
            <p className="text-xs font-medium text-neutral-500">Altın / TL (gr)</p>
            <p className="text-lg font-bold text-neutral-900">{altin ? formatTL(altin) : '···'}</p>
          </div>
        </Kart>
      )}
    </section>
  )
}
