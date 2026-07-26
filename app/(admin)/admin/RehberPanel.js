'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { slugUret } from '@/lib/slug'
import { boyutFormatla } from '@/lib/gorselOptimizasyon'
import { isoToDatetimeLocal, dosyaYukle } from '@/lib/adminYardimcilari'
import { REHBER_KATEGORILERI } from '@/lib/rehberKategorileri'
import { rehberKaydet, rehberSil } from './rehberActions'

const REHBER_SAYFA_BASI = 50

function SssSatiri({ item, index, onAlanGuncelle, onKaldir }) {
  return (
    <div className="space-y-2 rounded border border-gray-800 bg-gray-950 p-3">
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Soru"
          value={item.soru}
          onChange={(e) => onAlanGuncelle(index, 'soru', e.target.value)}
          className="flex-1 bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-red-600"
        />
        <button
          type="button"
          onClick={() => onKaldir(index)}
          className="shrink-0 text-xs text-red-400 hover:text-red-500"
        >
          Kaldır
        </button>
      </div>
      <textarea
        rows={3}
        placeholder="Cevap"
        value={item.cevap}
        onChange={(e) => onAlanGuncelle(index, 'cevap', e.target.value)}
        className="w-full bg-gray-900 border border-gray-800 rounded px-2 py-1.5 text-sm text-white focus:outline-none focus:border-red-600"
      />
    </div>
  )
}

// Haberlerden tamamen bağımsız bir sistem — kendi state'ini, kendi
// veriYukle/sayfalama mantığını ve kendi Supabase istemcisini taşır. Hem
// "Rehber Ekle" formunu hem "Rehberleri Yönet" listesini üretir; hangisinin
// görüneceğine üst bileşenden gelen `activeTab` karar verir. Bileşen kendisi
// HER ZAMAN mount edilmiş kalır (AdminPortal koşulsuz render eder) — aksi
// halde diğer sekmelere geçilip geri dönüldüğünde form/liste state'i
// sıfırlanırdı (haberlerdeki "kaydet sonrası form korunsun" dersiyle aynı
// mantık).
export default function RehberPanel({ activeTab, onActiveTabDegistir, mesaj, setMesaj }) {
  const [rehberler, setRehberler] = useState([])
  const [rehberSayisi, setRehberSayisi] = useState(0)
  const [sayfa, setSayfa] = useState(1)
  const [loading, setLoading] = useState(false)

  const [secilenRehber, setSecilenRehber] = useState(null)
  const [baslik, setBaslik] = useState('')
  const [slug, setSlug] = useState('')
  const [slugManuel, setSlugManuel] = useState(false)
  const [kategori, setKategori] = useState(REHBER_KATEGORILERI[0])
  const [ozet, setOzet] = useState('')
  const [govde, setGovde] = useState('')
  const [gorselUrl, setGorselUrl] = useState('')
  const [gorselYukleniyor, setGorselYukleniyor] = useState(false)
  const [gorselYuklemeHatasi, setGorselYuklemeHatasi] = useState('')
  const [gorselBoyutBilgisi, setGorselBoyutBilgisi] = useState(null)
  const [aiGorsel, setAiGorsel] = useState(true)
  const [gorselKaynakNotu, setGorselKaynakNotu] = useState('')
  const [sss, setSss] = useState([])
  const [sonGuncellemeTarihi, setSonGuncellemeTarihi] = useState(() =>
    isoToDatetimeLocal(new Date().toISOString())
  )
  const [durum, setDurum] = useState('draft')
  const [seoEtiketleri, setSeoEtiketleri] = useState('')

  const supabase = createClient()

  useEffect(() => {
    veriYukle()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!slugManuel && baslik) {
      setSlug(slugUret(baslik))
    }
  }, [baslik, slugManuel])

  async function veriYukle(hedefSayfa = sayfa) {
    const { count } = await supabase
      .from('rehberler')
      .select('*', { count: 'exact', head: true })
    const toplam = count || 0
    setRehberSayisi(toplam)

    const toplamSayfaSayisi = Math.max(1, Math.ceil(toplam / REHBER_SAYFA_BASI))
    const gecerliSayfa = Math.min(Math.max(1, hedefSayfa), toplamSayfaSayisi)
    if (gecerliSayfa !== sayfa) setSayfa(gecerliSayfa)

    const baslangic = (gecerliSayfa - 1) * REHBER_SAYFA_BASI
    const { data } = await supabase
      .from('rehberler')
      .select('*')
      .order('created_at', { ascending: false })
      .range(baslangic, baslangic + REHBER_SAYFA_BASI - 1)
    if (data) setRehberler(data)
  }

  const handleSayfaDegistir = (yon) => {
    const yeniSayfa = yon === 'sonraki' ? sayfa + 1 : sayfa - 1
    setSayfa(yeniSayfa)
    veriYukle(yeniSayfa)
  }

  const formuTemizle = () => {
    setSecilenRehber(null)
    setBaslik('')
    setSlug('')
    setSlugManuel(false)
    setKategori(REHBER_KATEGORILERI[0])
    setOzet('')
    setGovde('')
    setGorselUrl('')
    setGorselBoyutBilgisi(null)
    setAiGorsel(true)
    setGorselKaynakNotu('')
    setSss([])
    setSonGuncellemeTarihi(isoToDatetimeLocal(new Date().toISOString()))
    setDurum('draft')
    setSeoEtiketleri('')
  }

  const handleRehberDuzenle = (r) => {
    setSecilenRehber(r)
    setBaslik(r.baslik)
    setSlug(r.slug)
    setSlugManuel(true)
    setKategori(r.kategori || REHBER_KATEGORILERI[0])
    setOzet(r.ozet || '')
    setGovde(r.govde || '')
    setGorselUrl(r.gorsel_url || '')
    setGorselBoyutBilgisi(null)
    setAiGorsel(r.ai_gorsel_mi)
    setGorselKaynakNotu(r.gorsel_kaynak_notu || '')
    setSss(Array.isArray(r.sss) ? r.sss.map((s) => ({ soru: s.soru || '', cevap: s.cevap || '' })) : [])
    setSonGuncellemeTarihi(isoToDatetimeLocal(r.son_guncelleme_tarihi))
    setDurum(r.durum)
    setSeoEtiketleri(r.seo_etiketleri || '')
    onActiveTabDegistir('rehber-ekle')
  }

  const handleGorselDosyaSecildi = async (e) => {
    const dosya = e.target.files?.[0]
    if (!dosya) return

    setGorselYuklemeHatasi('')
    setGorselBoyutBilgisi(null)
    setGorselYukleniyor(true)

    try {
      const sonuc = await dosyaYukle(supabase, dosya, 'rehber-')
      if (sonuc.error) {
        setGorselYuklemeHatasi(sonuc.error)
        return
      }
      setGorselUrl(sonuc.url)
      setGorselBoyutBilgisi(sonuc.boyutBilgisi)
    } finally {
      setGorselYukleniyor(false)
      e.target.value = ''
    }
  }

  const handleSssEkle = () => {
    setSss((onceki) => [...onceki, { soru: '', cevap: '' }])
  }

  const handleSssAlanGuncelle = (index, alan, deger) => {
    setSss((onceki) => onceki.map((s, i) => (i === index ? { ...s, [alan]: deger } : s)))
  }

  const handleSssKaldir = (index) => {
    setSss((onceki) => onceki.filter((_, i) => i !== index))
  }

  const handleRehberKaydet = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMesaj({ tip: '', icerik: '' })

    const formData = new FormData()
    if (secilenRehber?.id) formData.append('id', secilenRehber.id)
    formData.append('baslik', baslik)
    formData.append('slug', slug)
    formData.append('kategori', kategori)
    formData.append('ozet', ozet)
    formData.append('govde', govde)
    formData.append('gorsel_url', gorselUrl)
    formData.append('ai_gorsel_mi', aiGorsel.toString())
    formData.append('gorsel_kaynak_notu', gorselKaynakNotu)
    formData.append('seo_etiketleri', seoEtiketleri)
    formData.append('durum', durum)
    formData.append(
      'sss_json',
      JSON.stringify(sss.map(({ soru, cevap }) => ({ soru, cevap })))
    )
    // datetime-local değeri tarayıcının YEREL saatini temsil eder — haberlerin
    // yayin_zamani mantığıyla aynı sebepten burada UTC ISO'ya çevrilir.
    const sonGuncellemeISO = sonGuncellemeTarihi ? new Date(sonGuncellemeTarihi).toISOString() : ''
    formData.append('son_guncelleme_tarihi', sonGuncellemeISO)

    const response = await rehberKaydet(formData)
    setLoading(false)

    if (response.success) {
      setMesaj({ tip: 'success', icerik: '✓ Rehber kaydedildi.' })
      // Haberlerdeki düzeltmeyle aynı davranış: form temizlenmez, kaydedilen
      // rehber DB'den taze haliyle çekilip düzenleme görünümünde tutulur.
      const kaydedilenId = secilenRehber?.id ? parseInt(secilenRehber.id) : response.id
      const [, kaydedilenSonuc] = await Promise.all([
        veriYukle(),
        kaydedilenId
          ? supabase.from('rehberler').select('*').eq('id', kaydedilenId).single()
          : Promise.resolve({ data: null }),
      ])
      if (kaydedilenSonuc?.data) handleRehberDuzenle(kaydedilenSonuc.data)
    } else {
      setMesaj({ tip: 'error', icerik: response.error })
    }
  }

  const handleRehberSil = async (id, rehberSlug) => {
    if (confirm('Bu rehberi silmek istediğinize emin misiniz?')) {
      const res = await rehberSil(id, rehberSlug)
      if (res.success) {
        veriYukle()
        alert('Rehber silindi.')
      }
    }
  }

  if (activeTab !== 'rehber-ekle' && activeTab !== 'rehberleri-yonet') return null

  const toplamSayfaSayisi = Math.max(1, Math.ceil(rehberSayisi / REHBER_SAYFA_BASI))

  return (
    <>
      {activeTab === 'rehber-ekle' && (
        <form onSubmit={handleRehberKaydet} className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white">
            {secilenRehber ? 'Rehberi Düzenle' : 'Yeni Rehber Girişi'}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Başlık</label>
                <input
                  type="text"
                  required
                  value={baslik}
                  onChange={(e) => setBaslik(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">URL Slug (Otomatik Oluşur)</label>
                <input
                  type="text"
                  required
                  value={slug}
                  onChange={(e) => { setSlug(e.target.value); setSlugManuel(true) }}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Önizleme: https://www.pusula24.de/rehber/<span className="text-red-400">{slug}</span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kategori</label>
                <select
                  required
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                >
                  {REHBER_KATEGORILERI.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Görsel URL</label>
                <input
                  type="text"
                  required
                  value={gorselUrl}
                  onChange={(e) => setGorselUrl(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
                <div className="mt-2 flex items-center gap-3">
                  <label className="cursor-pointer rounded border border-gray-800 bg-gray-950 px-3 py-2 text-sm text-gray-300 hover:border-red-600 hover:text-white transition">
                    Bilgisayardan Yükle
                    <input type="file" accept="image/*" onChange={handleGorselDosyaSecildi} className="hidden" disabled={gorselYukleniyor} />
                  </label>
                  {gorselYukleniyor && <span className="text-sm text-gray-400">Sıkıştırılıyor ve yükleniyor...</span>}
                </div>
                {gorselYuklemeHatasi && (
                  <p className="mt-1 text-xs text-red-400">{gorselYuklemeHatasi}</p>
                )}
                {gorselBoyutBilgisi && !gorselYukleniyor && (
                  <p className="mt-1 text-xs text-green-500">
                    {boyutFormatla(gorselBoyutBilgisi.orijinalBoyut)} → {boyutFormatla(gorselBoyutBilgisi.yeniBoyut)} (WebP)
                  </p>
                )}
                {gorselUrl && !gorselYukleniyor && (
                  <img src={gorselUrl} alt="Önizleme" className="mt-2 h-32 w-full rounded object-cover border border-gray-800" />
                )}
              </div>
              <div className="flex items-center space-x-2 bg-gray-950 p-3 rounded border border-gray-800">
                <input
                  type="checkbox"
                  id="rehberAiGorsel"
                  checked={aiGorsel}
                  onChange={(e) => setAiGorsel(e.target.checked)}
                  className="h-4 w-4 text-red-600 bg-gray-900 border-gray-800 rounded focus:ring-0"
                />
                <label htmlFor="rehberAiGorsel" className="text-sm cursor-pointer select-none">
                  Bu görsel Yapay Zekâ ile üretildi (Sitede Symbolbild rozeti basar).
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Görsel Kaynağı (opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Wikimedia Commons / Jane Doe, CC BY 4.0"
                  value={gorselKaynakNotu}
                  onChange={(e) => setGorselKaynakNotu(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Özet (Meta Description)</label>
                <textarea
                  rows={2}
                  required
                  value={ozet}
                  onChange={(e) => setOzet(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600 resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Gövde (Markdown)</label>
                <textarea
                  rows={10}
                  required
                  value={govde}
                  onChange={(e) => setGovde(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600 font-mono text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SEO Etiketleri (virgülle ayırın, opsiyonel)</label>
                <input
                  type="text"
                  placeholder="Oturum izni, Aufenthaltstitel, ikamet izni"
                  value={seoEtiketleri}
                  onChange={(e) => setSeoEtiketleri(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Son Güncelleme Tarihi</label>
                <input
                  type="datetime-local"
                  required
                  value={sonGuncellemeTarihi}
                  onChange={(e) => setSonGuncellemeTarihi(e.target.value)}
                  className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Otomatik &quot;şimdi&quot; ile dolar; içeriği gerçekten güncellediyseniz elle de değiştirebilirsiniz.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Yayın Durumu</label>
                <div className="flex space-x-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="rehberDurum" value="draft" checked={durum === 'draft'} onChange={() => setDurum('draft')} className="text-red-600" />
                    <span>Taslak (Draft)</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="radio" name="rehberDurum" value="published" checked={durum === 'published'} onChange={() => setDurum('published')} className="text-red-600" />
                    <span className="text-green-400 font-bold">Yayına Ver (Published)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Sık Sorulan Sorular (opsiyonel)</h3>
              <button
                type="button"
                onClick={handleSssEkle}
                className="px-3 py-1.5 bg-blue-700 hover:bg-blue-600 text-white rounded text-sm font-medium transition"
              >
                + Soru Ekle
              </button>
            </div>
            {sss.length > 0 && (
              <div className="space-y-3">
                {sss.map((item, i) => (
                  <SssSatiri
                    key={i}
                    item={item}
                    index={i}
                    onAlanGuncelle={handleSssAlanGuncelle}
                    onKaldir={handleSssKaldir}
                  />
                ))}
              </div>
            )}
            <p className="text-xs text-gray-500">
              Rehber detay sayfasında akordeon (tıklayınca açılan) liste olarak gösterilir; Google&apos;a FAQPage şeması olarak da bildirilir.
            </p>
          </div>

          <div className="flex justify-end space-x-4 border-t border-gray-800 pt-4">
            {secilenRehber && (
              <button type="button" onClick={formuTemizle} className="px-5 py-2 bg-gray-800 text-gray-300 rounded hover:bg-gray-700 transition">
                + Yeni Rehber Ekle
              </button>
            )}
            <button type="submit" disabled={loading} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium disabled:opacity-50 transition">
              {loading ? 'Kaydediliyor...' : 'Rehber Kaydet'}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'rehberleri-yonet' && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-white">Rehber Listesi</h2>
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
                {rehberler.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-950/50">
                    <td className="py-4 font-medium text-white max-w-xs truncate">{r.baslik}</td>
                    <td className="py-4 text-sm text-gray-400">{r.kategori}</td>
                    <td className="py-4 text-sm">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${r.durum === 'published' ? 'bg-green-950 text-green-400' : 'bg-yellow-950 text-yellow-400'}`}>
                        {r.durum === 'published' ? 'YAYINDA' : 'TASLAK'}
                      </span>
                    </td>
                    <td className="py-4 text-right space-x-2">
                      <button onClick={() => handleRehberDuzenle(r)} className="px-3 py-1 bg-blue-900 text-blue-300 rounded text-xs hover:bg-blue-800 transition">Düzenle</button>
                      <button onClick={() => handleRehberSil(r.id, r.slug)} className="px-3 py-1 bg-red-950 text-red-400 rounded text-xs hover:bg-red-900 transition">Sil</button>
                    </td>
                  </tr>
                ))}
                {rehberler.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-sm text-gray-500">Henüz rehber eklenmedi.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
            <button
              type="button"
              onClick={() => handleSayfaDegistir('onceki')}
              disabled={sayfa <= 1}
              className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition disabled:opacity-30 disabled:hover:bg-gray-800 disabled:cursor-not-allowed"
            >
              ◀ Önceki
            </button>
            <span>
              Sayfa {sayfa} / {toplamSayfaSayisi}
              <span className="text-gray-600"> — toplam {rehberSayisi} rehber</span>
            </span>
            <button
              type="button"
              onClick={() => handleSayfaDegistir('sonraki')}
              disabled={sayfa >= toplamSayfaSayisi}
              className="px-3 py-1.5 rounded bg-gray-800 hover:bg-gray-700 transition disabled:opacity-30 disabled:hover:bg-gray-800 disabled:cursor-not-allowed"
            >
              Sonraki ▶
            </button>
          </div>
        </div>
      )}
    </>
  )
}
