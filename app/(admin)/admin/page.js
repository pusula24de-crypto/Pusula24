'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { slugUret } from '@/lib/slug'
import {
  haberKaydet,
  haberSil,
  kategoriEkle,
  kategoriSil,
  kategoriSirasiDegistir,
  kategoriGorselGuncelle,
  ayarlariGetir,
  ayarlariKaydet,
} from './actions'

function isoToDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const yerelOfset = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - yerelOfset).toISOString().slice(0, 16)
}

async function dosyaYukle(supabase, dosya, onEk = '') {
  const guvenliAd = dosya.name.replace(/[^a-zA-Z0-9.\-_]/g, '-')
  const dosyaYolu = `${onEk}${Date.now()}-${guvenliAd}`

  const { error } = await supabase.storage.from('haber-gorselleri').upload(dosyaYolu, dosya)
  if (error) {
    const mesaj = error.message?.toLowerCase().includes('bucket not found')
      ? 'Storage bucket bulunamadı. Lütfen Supabase panelinden "haber-gorselleri" adında public bir bucket oluşturun.'
      : 'Görsel yüklenemedi: ' + error.message
    return { url: null, error: mesaj }
  }

  const { data } = supabase.storage.from('haber-gorselleri').getPublicUrl(dosyaYolu)
  return { url: data.publicUrl, error: null }
}

function KategoriSatiri({ kategori, index, toplam, supabase, onSiraDegistir, onSil, onGorselKaydet }) {
  const [gorselUrl, setGorselUrl] = useState(kategori.gorsel_url || '')
  const [yukleniyor, setYukleniyor] = useState(false)
  const [hata, setHata] = useState('')
  const [kaydediliyor, setKaydediliyor] = useState(false)

  const handleDosyaSecildi = async (e) => {
    const dosya = e.target.files?.[0]
    if (!dosya) return
    setHata('')
    setYukleniyor(true)
    try {
      const sonuc = await dosyaYukle(supabase, dosya, 'kategori-')
      if (sonuc.error) {
        setHata(sonuc.error)
        return
      }
      setGorselUrl(sonuc.url)
    } finally {
      setYukleniyor(false)
      e.target.value = ''
    }
  }

  const handleKaydet = async () => {
    setKaydediliyor(true)
    await onGorselKaydet(kategori.id, gorselUrl)
    setKaydediliyor(false)
  }

  return (
    <li className="space-y-2 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-0.5">
            <button
              onClick={() => onSiraDegistir(kategori.id, 'yukari')}
              disabled={index === 0}
              aria-label="Yukarı taşı"
              className="flex h-5 w-5 items-center justify-center rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 transition text-xs"
            >
              ↑
            </button>
            <button
              onClick={() => onSiraDegistir(kategori.id, 'asagi')}
              disabled={index === toplam - 1}
              aria-label="Aşağı taşı"
              className="flex h-5 w-5 items-center justify-center rounded bg-gray-800 text-gray-300 hover:bg-gray-700 disabled:opacity-30 disabled:hover:bg-gray-800 transition text-xs"
            >
              ↓
            </button>
          </div>
          {gorselUrl ? (
            <img src={gorselUrl} alt="" className="h-10 w-10 rounded object-cover border border-gray-800" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded border border-gray-800 bg-gray-950 text-[9px] text-gray-600">
              Yok
            </div>
          )}
          <div>
            <span className="font-medium text-white">{kategori.ad}</span>
            <span className="text-xs text-gray-500 block">Slug: {kategori.slug}</span>
          </div>
        </div>
        <button onClick={() => onSil(kategori.id)} className="text-red-400 hover:text-red-500 text-sm">Sil</button>
      </div>

      <div className="flex items-center gap-2 pl-[52px]">
        <input
          type="text"
          placeholder="Görsel URL"
          value={gorselUrl}
          onChange={(e) => setGorselUrl(e.target.value)}
          className="flex-1 bg-gray-950 border border-gray-800 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-red-600"
        />
        <label className="cursor-pointer whitespace-nowrap rounded border border-gray-800 bg-gray-950 px-2 py-1 text-xs text-gray-300 hover:border-red-600 hover:text-white transition">
          Yükle
          <input type="file" accept="image/*" onChange={handleDosyaSecildi} className="hidden" disabled={yukleniyor} />
        </label>
        <button
          onClick={handleKaydet}
          disabled={kaydediliyor}
          className="whitespace-nowrap rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:opacity-50 transition"
        >
          {kaydediliyor ? '...' : 'Kaydet'}
        </button>
      </div>
      {yukleniyor && <p className="pl-[52px] text-xs text-gray-500">Yükleniyor...</p>}
      {hata && <p className="pl-[52px] text-xs text-red-400">{hata}</p>}
    </li>
  )
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('haber-ekle')
  const [haberler, setHaberler] = useState([])
  const [kategoriler, setKategoriler] = useState([])
  const [loading, setLoading] = useState(false)
  const [mesaj, setMesaj] = useState({ tip: '', icerik: '' })

  const [secilenHaber, setSecilenHaber] = useState(null)
  const [baslik, setBaslik] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuel, setSlugManuel] = useState(false)
  const [ozet, setOzet] = useState('')
  const [govde, setGovde] = useState('')
  const [kategoriId, setKategoriId] = useState('')
  const [gorselUrl, setGorselUrl] = useState('')
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false)
  const [gorselYuklemeHatasi, setGorselYuklemeHatasi] = useState('')
  const [aiGorsel, setAiGorsel] = useState(true)
  const [durum, setDurum] = useState('draft')
  const [kaynakAdi, setKaynakAdi] = useState('')
  const [kaynakUrl, setKaynakUrl] = useState('')
  const [yayinZamani, setYayinZamani] = useState('')

  const [yeniKatAd, setYeniKatAd] = useState('')
  const [yeniKatSlug, setYeniKatSlug] = useState('')
  const [yeniKatGorselUrl, setYeniKatGorselUrl] = useState('')
  const [yeniKatGorselYukleniyor, setYeniKatGorselYukleniyor] = useState(false)
  const [yeniKatGorselHata, setYeniKatGorselHata] = useState('')

  const [googleDogrulama, setGoogleDogrulama] = useState('')
  const [adsenseKodu, setAdsenseKodu] = useState('')
  const [adsenseAktif, setAdsenseAktif] = useState(false)
  const [ayarKaydediliyor, setAyarKaydediliyor] = useState(false)

  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    veriYukle()
  }, [])

  async function veriYukle() {
    const { data: katData } = await supabase.from('kategoriler').select('*').order('sira')
    if (katData) setKategoriler(katData)

    const { data: habData } = await supabase
      .from('haberler')
      .select('*, kategoriler(ad)')
      .order('created_at', { ascending: false })
      .limit(50)
    if (habData) setHaberler(habData)

    const ayarlar = await ayarlariGetir()
    setGoogleDogrulama(ayarlar.google_site_verification || '')
    setAdsenseKodu(ayarlar.adsense_kodu || '')
    setAdsenseAktif(ayarlar.adsense_aktif === 'true')
  }

  const handleAyarlariKaydet = async (e) => {
    e.preventDefault()
    setAyarKaydediliyor(true)
    setMesaj({ tip: '', icerik: '' })
    const res = await ayarlariKaydet({
      google_site_verification: googleDogrulama.trim(),
      adsense_kodu: adsenseKodu,
      adsense_aktif: adsenseAktif ? 'true' : 'false',
    })
    setAyarKaydediliyor(false)
    if (res.success) {
      setMesaj({ tip: 'success', icerik: 'Site ayarları kaydedildi!' })
    } else {
      setMesaj({ tip: 'error', icerik: res.error })
    }
  }

  useEffect(() => {
    if (!slugManuel && baslik) {
      setSlug(slugUret(baslik))
    }
  }, [baslik, slugManuel])

  const handleHaberKaydet = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMesaj({ tip: '', icerik: '' })

    const formData = new FormData()
    if (secilenHaber?.id) formData.append('id', secilenHaber.id)
    formData.append('baslik', baslik)
    formData.append('slug', slug)
    formData.append('ozet', ozet)
    formData.append('govde', govde)
    formData.append('kategori_id', kategoriId)
    formData.append('gorsel_url', gorselUrl)
    formData.append('ai_gorsel_mi', aiGorsel.toString())
    formData.append('durum', durum)
    formData.append('kaynak_adi', kaynakAdi)
    formData.append('kaynak_url', kaynakUrl)
    formData.append('yayin_zamani', yayinZamani)

    const response = await haberKaydet(formData)
    setLoading(false)

    if (response.success) {
      setMesaj({ tip: 'success', icerik: 'Haber başarıyla kaydedildi!' })
      formuTemizle()
      veriYukle()
    } else {
      setMesaj({ tip: 'error', icerik: response.error })
    }
  }

  const handleGorselDosyaSecildi = async (e) => {
    const dosya = e.target.files?.[0]
    if (!dosya) return

    setGorselYuklemeHatasi('')
    setGorselYukleniyor(true)

    try {
      const sonuc = await dosyaYukle(supabase, dosya)
      if (sonuc.error) {
        setGorselYuklemeHatasi(sonuc.error)
        return
      }
      setGorselUrl(sonuc.url)
    } finally {
      setGorselYukleniyor(false)
      e.target.value = ''
    }
  }

  const handleYeniKatGorselSecildi = async (e) => {
    const dosya = e.target.files?.[0]
    if (!dosya) return

    setYeniKatGorselHata('')
    setYeniKatGorselYukleniyor(true)

    try {
      const sonuc = await dosyaYukle(supabase, dosya, 'kategori-')
      if (sonuc.error) {
        setYeniKatGorselHata(sonuc.error)
        return
      }
      setYeniKatGorselUrl(sonuc.url)
    } finally {
      setYeniKatGorselYukleniyor(false)
      e.target.value = ''
    }
  }

  const handleHaberDuzenle = (h) => {
    setSecilenHaber(h)
    setBaslik(h.baslik)
    setSlug(h.slug)
    setSlugManuel(true)
    setOzet(h.ozet)
    setGovde(h.govde)
    setKategoriId(h.kategori_id || '')
    setGorselUrl(h.gorsel_url || '')
    setAiGorsel(h.ai_gorsel_mi)
    setDurum(h.durum)
    setKaynakAdi(h.kaynak_adi || '')
    setKaynakUrl(h.kaynak_url || '')
    setYayinZamani(h.durum === 'published' ? isoToDatetimeLocal(h.yayin_tarihi) : '')
    setActiveTab('haber-ekle')
  }

  const handleHaberSil = async (id, slug) => {
    if (confirm('Bu haberi silmek istediğinize emin misiniz?')) {
      const res = await haberSil(id, slug)
      if (res.success) {
        veriYukle()
        alert('Haber silindi.')
      }
    }
  }

  const handleKategoriEkle = async (e) => {
    e.preventDefault()
    const res = await kategoriEkle(yeniKatAd, yeniKatSlug, yeniKatGorselUrl)
    if (res.success) {
      setYeniKatAd('')
      setYeniKatSlug('')
      setYeniKatGorselUrl('')
      veriYukle()
      setMesaj({ tip: 'success', icerik: 'Kategori başarıyla eklendi!' })
    } else {
      alert(res.error)
    }
  }

  const handleKategoriGorselKaydet = async (id, gorselUrl) => {
    const res = await kategoriGorselGuncelle(id, gorselUrl)
    if (res.success) {
      veriYukle()
      setMesaj({ tip: 'success', icerik: 'Kategori görseli güncellendi!' })
    } else {
      alert(res.error)
    }
  }

  const handleKategoriSiraDegistir = async (id, yon) => {
    const res = await kategoriSirasiDegistir(id, yon)
    if (res.success) {
      veriYukle()
    } else {
      alert(res.error)
    }
  }

  const handleKategoriSil = async (id) => {
    if (confirm('Bu kategoriyi silmek istiyor musunuz? Bağlı haberler kategorisiz kalacaktır.')) {
      const res = await kategoriSil(id)
      if (res.success) {
        veriYukle()
      } else {
        alert('Kategori silinemedi: ' + res.error)
      }
    }
  }

  const formuTemizle = () => {
    setSecilenHaber(null)
    setBaslik('')
    setSlug('')
    setSlugManuel(false)
    setOzet('')
    setGovde('')
    setKategoriId('')
    setGorselUrl('')
    setAiGorsel(true)
    setDurum('draft')
    setKaynakAdi('')
    setKaynakUrl('')
    setYayinZamani('')
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold tracking-tight text-red-500">PUSULA24 <span className="text-white text-sm font-normal">Yazı İşleri Portalı</span></h1>
          <button onClick={handleSignOut} className="bg-red-950 text-red-400 border border-red-800 px-4 py-2 rounded-md hover:bg-red-900 transition text-sm">Güvenli Çıkış</button>
        </div>

        <div className="flex space-x-4 mb-6">
          <button onClick={() => { setActiveTab('haber-ekle'); formuTemizle(); }} className={`px-4 py-2 rounded-md text-sm transition ${activeTab === 'haber-ekle' ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}>Haber Ekle</button>
          <button onClick={() => setActiveTab('haberleri-yonet')} className={`px-4 py-2 rounded-md text-sm transition ${activeTab === 'haberleri-yonet' ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}>Haberleri Yönet ({haberler.length})</button>
          <button onClick={() => setActiveTab('kategoriler')} className={`px-4 py-2 rounded-md text-sm transition ${activeTab === 'kategoriler' ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}>Kategorileri Yönet</button>
          <button onClick={() => setActiveTab('site-ayarlari')} className={`px-4 py-2 rounded-md text-sm transition ${activeTab === 'site-ayarlari' ? 'bg-red-600 text-white' : 'bg-gray-900 text-gray-400 hover:text-white'}`}>Site Ayarları</button>
        </div>

        {mesaj.icerik && (
          <div className={`p-4 rounded-md mb-6 border ${mesaj.tip === 'success' ? 'bg-green-950 border-green-800 text-green-400' : 'bg-red-950 border-red-800 text-red-400'}`}>
            {mesaj.icerik}
          </div>
        )}

        {activeTab === 'haber-ekle' && (
          <form onSubmit={handleHaberKaydet} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">{secilenHaber ? 'Haberi Düzenle' : 'Yeni Haber Girişi'}</h2>
              {secilenHaber && (
                <a
                  href={`/api/sosyal-gorsel/${secilenHaber.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-gray-800 text-gray-200 rounded text-sm hover:bg-gray-700 transition"
                >
                  📸 Sosyal Görsel İndir
                </a>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Haber Başlığı</label>
                  <input type="text" required value={baslik} onChange={(e) => setBaslik(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">URL Slug (Otomatik Oluşur)</label>
                  <input type="text" required value={slug} onChange={(e) => { setSlug(e.target.value); setSlugManuel(true); }} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600" />
                  <p className="text-xs text-gray-500 mt-1">Önizleme: https://www.pusula24.de/haber/<span className="text-red-400">{slug}</span></p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Kategori</label>
                  <select required value={kategoriId} onChange={(e) => setKategoriId(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600">
                    <option value="">Kategori Seçin...</option>
                    {kategoriler.map(k => <option key={k.id} value={k.id}>{k.ad}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Görsel URL (Gemini/Unsplash vb.)</label>
                  <input type="text" required value={gorselUrl} onChange={(e) => setGorselUrl(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600" />
                  <div className="mt-2 flex items-center gap-3">
                    <label className="cursor-pointer rounded border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 hover:border-red-600 hover:text-white transition">
                      Bilgisayardan Yükle
                      <input type="file" accept="image/*" onChange={handleGorselDosyaSecildi} className="hidden" disabled={gorselYukleniyor} />
                    </label>
                    {gorselYukleniyor && <span className="text-sm text-gray-400">Yükleniyor...</span>}
                  </div>
                  {gorselYuklemeHatasi && (
                    <p className="mt-1 text-xs text-red-400">{gorselYuklemeHatasi}</p>
                  )}
                  {gorselUrl && !gorselYukleniyor && (
                    <img src={gorselUrl} alt="Önizleme" className="mt-2 h-32 w-full rounded object-cover border border-gray-800" />
                  )}
                </div>
                <div className="flex items-center space-x-2 bg-gray-950 p-3 rounded border border-gray-800">
                  <input type="checkbox" id="aiGorsel" checked={aiGorsel} onChange={(e) => setAiGorsel(e.target.checked)} className="h-4 w-4 text-red-600 bg-gray-900 border-gray-800 rounded focus:ring-0" />
                  <label htmlFor="aiGorsel" className="text-sm cursor-pointer select-none">Bu görsel Yapay Zekâ ile üretildi (Sitede Symbolbild rozeti basar).</label>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Haber Özeti (Meta Description - Max 155 Karakter)</label>
                  <textarea rows={2} required value={ozet} onChange={(e) => setOzet(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600 resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Haber Gövdesi</label>
                  <textarea rows={10} required value={govde} onChange={(e) => setGovde(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600 font-mono text-sm" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Kaynak Adı (Örn: Polizei Duisburg)</label>
                    <input type="text" required value={kaynakAdi} onChange={(e) => setKaynakAdi(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Kaynak URL</label>
                    <input type="url" required value={kaynakUrl} onChange={(e) => setKaynakUrl(e.target.value)} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Yayın Durumu</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="durum" value="draft" checked={durum === 'draft'} onChange={() => setDurum('draft')} className="text-red-600" />
                      <span>Taslak (Draft)</span>
                    </label>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input type="radio" name="durum" value="published" checked={durum === 'published'} onChange={() => setDurum('published')} className="text-red-600" />
                      <span className="text-green-400 font-bold">Yayına Ver (Published)</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Yayın Zamanı (opsiyonel — ileri tarih seçilirse haber o zamana kadar sitede görünmez)</label>
                  <input
                    type="datetime-local"
                    value={yayinZamani}
                    onChange={(e) => setYayinZamani(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Boş bırakılırsa yukarıdaki Yayın Durumu&apos;na göre davranır (taslak veya hemen yayında). Bir zaman seçilirse haber otomatik &quot;Yayına Ver&quot; olur ve o saatte belirir.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4 border-t border-gray-800 pt-4">
              {secilenHaber && (
                <button type="button" onClick={formuTemizle} className="px-5 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition">İptal Et</button>
              )}
              <button type="submit" disabled={loading} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium disabled:opacity-50 transition">{loading ? 'Kaydediliyor...' : 'Haber Kaydet'}</button>
            </div>
          </form>
        )}

        {activeTab === 'haberleri-yonet' && (
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-white">Haber Listesi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400 text-sm">
                    <th className="pb-3">Başlık</th>
                    <th className="pb-3">Kategori</th>
                    <th className="pb-3">Durum</th>
                    <th className="pb-3 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {haberler.map(h => {
                    const zamanlanmisMi = h.durum === 'published' && h.yayin_tarihi && new Date(h.yayin_tarihi) > new Date()
                    return (
                      <tr key={h.id} className="hover:bg-gray-950/50">
                        <td className="py-4 font-medium text-white max-w-xs truncate">{h.baslik}</td>
                        <td className="py-4 text-sm text-gray-400">{h.kategoriler?.ad || 'Kategorisiz'}</td>
                        <td className="py-4 text-sm">
                          {zamanlanmisMi ? (
                            <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-950 text-blue-300">
                              ⏰ Zamanlanmış: {new Date(h.yayin_tarihi).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          ) : (
                            <span className={`px-2 py-1 rounded text-xs font-semibold ${h.durum === 'published' ? 'bg-green-950 text-green-400' : 'bg-yellow-950 text-yellow-400'}`}>{h.durum === 'published' ? 'YAYINDA' : 'TASLAK'}</span>
                          )}
                        </td>
                        <td className="py-4 text-right space-x-2">
                          <a
                            href={`/api/sosyal-gorsel/${h.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-1 bg-gray-800 text-gray-200 rounded text-xs hover:bg-gray-700 transition"
                          >
                            📸 Sosyal
                          </a>
                          <button onClick={() => handleHaberDuzenle(h)} className="px-3 py-1 bg-blue-900 text-blue-300 rounded text-xs hover:bg-blue-800 transition">Düzenle</button>
                          <button onClick={() => handleHaberSil(h.id, h.slug)} className="px-3 py-1 bg-red-950 text-red-400 rounded text-xs hover:bg-red-900 transition">Sil</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'kategoriler' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <form onSubmit={handleKategoriEkle} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-4">
              <h3 className="text-lg font-semibold text-white">Yeni Kategori Oluştur</h3>
              <div>
                <label className="block text-sm font-medium mb-1">Kategori Adı</label>
                <input type="text" required value={yeniKatAd} onChange={(e) => {
                  setYeniKatAd(e.target.value)
                  setYeniKatSlug(slugUret(e.target.value))
                }} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategori Slug</label>
                <input type="text" required value={yeniKatSlug} className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Görsel URL (opsiyonel)</label>
                <input
                  type="text"
                  value={yeniKatGorselUrl}
                  onChange={(e) => setYeniKatGorselUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
                <div className="mt-2 flex items-center gap-3">
                  <label className="cursor-pointer rounded border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 hover:border-red-600 hover:text-white transition">
                    Bilgisayardan Yükle
                    <input type="file" accept="image/*" onChange={handleYeniKatGorselSecildi} className="hidden" disabled={yeniKatGorselYukleniyor} />
                  </label>
                  {yeniKatGorselYukleniyor && <span className="text-sm text-gray-400">Yükleniyor...</span>}
                </div>
                {yeniKatGorselHata && <p className="mt-1 text-xs text-red-400">{yeniKatGorselHata}</p>}
                {yeniKatGorselUrl && !yeniKatGorselYukleniyor && (
                  <img src={yeniKatGorselUrl} alt="Önizleme" className="mt-2 h-24 w-full rounded object-cover border border-gray-800" />
                )}
              </div>
              <button type="submit" className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition">Kategori Ekle</button>
            </form>

            <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Mevcut Kategoriler</h3>
              <ul className="divide-y divide-gray-800">
                {kategoriler.map((k, i) => (
                  <KategoriSatiri
                    key={k.id}
                    kategori={k}
                    index={i}
                    toplam={kategoriler.length}
                    supabase={supabase}
                    onSiraDegistir={handleKategoriSiraDegistir}
                    onSil={handleKategoriSil}
                    onGorselKaydet={handleKategoriGorselKaydet}
                  />
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'site-ayarlari' && (
          <form onSubmit={handleAyarlariKaydet} className="max-w-2xl bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-white">Site Ayarları</h2>
              <p className="text-sm text-gray-400 mt-1">Google Search Console doğrulaması ve AdSense hazırlığı.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Google Site Doğrulama Kodu</label>
              <input
                type="text"
                value={googleDogrulama}
                onChange={(e) => setGoogleDogrulama(e.target.value)}
                placeholder="Yalnızca content değeri (ör. AbCdEf123...)"
                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
              />
              <p className="text-xs text-gray-500 mt-1">
                Search Console&apos;un verdiği <code className="text-gray-400">&lt;meta name=&quot;google-site-verification&quot; content=&quot;...&quot;&gt;</code> etiketindeki yalnızca content değerini yapıştırın.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">AdSense Kodu</label>
              <textarea
                rows={5}
                value={adsenseKodu}
                onChange={(e) => setAdsenseKodu(e.target.value)}
                placeholder="AdSense <script> kod parçacığını buraya yapıştırın (ileride)."
                className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600 font-mono text-xs resize-none"
              />
            </div>

            <div className="flex items-center justify-between bg-gray-950 p-3 rounded border border-gray-800">
              <div>
                <span className="text-sm font-medium text-white">AdSense Aktif</span>
                <p className="text-xs text-gray-500">Kapalıyken siteye hiçbir reklam script&apos;i eklenmez.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={adsenseAktif}
                onClick={() => setAdsenseAktif((a) => !a)}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition ${adsenseAktif ? 'bg-red-600' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${adsenseAktif ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            <div className="rounded-md border border-yellow-800 bg-yellow-950/50 p-3 text-xs text-yellow-300">
              ⚠️ AdSense aktif edildiğinde çerez onay sistemi (CMP) kurulumu yasal zorunluluktur.
            </div>

            <div className="flex justify-end border-t border-gray-800 pt-4">
              <button
                type="submit"
                disabled={ayarKaydediliyor}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium disabled:opacity-50 transition"
              >
                {ayarKaydediliyor ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
