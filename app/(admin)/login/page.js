'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [hata, setHata] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setHata('')

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // ARTIK GENEL MESAJ DEĞİL, SUPABASE'DEN GELEN GERÇEK HATAYI YAZIYORUZ:
        setHata(`Supabase Hatası: ${error.message} (Kod: ${error.status || 'Bilinmiyor'})`)
        setLoading(false)
      } else {
        router.push('/admin')
        router.refresh()
      }
    } catch (catchedError) {
      setHata(`Bağlantı Hatası: ${catchedError.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-lg p-8 space-y-6 shadow-xl">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-red-500">PUSULA24</h1>
          <p className="text-sm text-gray-400">Yazı İşleri Giriş Paneli</p>
        </div>

        {hata && (
          <div className="bg-red-950/50 border border-red-800 text-red-400 p-3 rounded text-sm text-center font-mono">
            {hata}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">E-Posta Adresi</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600 transition"
              placeholder="isim@pusula24.de"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Şifre</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-950 border border-gray-800 rounded px-3 py-2 text-white focus:outline-none focus:border-red-600 transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded transition disabled:opacity-50"
          >
            {loading ? 'Giriş Yapılıyor...' : 'Sisteme Bağlan'}
          </button>
        </form>
      </div>
    </div>
  )
}