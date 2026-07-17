'use client'

import { useState, useEffect } from 'react'

interface RevenueSetting {
  id: string
  biayaPerSiswaPerSesi: number
  persentaseOwner: number
  persentaseGuru: number
}

export default function RevenueSettingsForm() {
  const [setting, setSetting] = useState<RevenueSetting | null>(null)
  const [biayaPerSiswaPerSesi, setBiayaPerSiswaPerSesi] = useState(50000)
  const [persentaseOwner, setPersentaseOwner] = useState(40)
  const [persentaseGuru, setPersentaseGuru] = useState(60)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchSetting()
  }, [])

  const fetchSetting = async () => {
    try {
      const res = await fetch('/api/revenue-settings')
      const data = await res.json()
      if (data.setting) {
        setSetting(data.setting)
        setBiayaPerSiswaPerSesi(data.setting.biayaPerSiswaPerSesi)
        setPersentaseOwner(data.setting.persentaseOwner)
        setPersentaseGuru(data.setting.persentaseGuru)
      }
    } catch {
      console.error('Failed to fetch revenue settings')
    } finally {
      setLoading(false)
    }
  }

  const handleOwnerChange = (value: number) => {
    setPersentaseOwner(value)
    setPersentaseGuru(100 - value)
  }

  const handleGuruChange = (value: number) => {
    setPersentaseGuru(value)
    setPersentaseOwner(100 - value)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/revenue-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          biayaPerSiswaPerSesi: Number(biayaPerSiswaPerSesi),
          persentaseOwner: Number(persentaseOwner),
          persentaseGuru: Number(persentaseGuru),
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Pengaturan berhasil disimpan!')
        setSetting(data.setting)
      } else {
        setMessage(data.error || 'Gagal menyimpan pengaturan')
      }
    } catch {
      setMessage('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Preview calculation
  const previewMurid = 3
  const previewBiayaTotal = previewMurid * biayaPerSiswaPerSesi
  const previewOwner = Math.floor(previewBiayaTotal * persentaseOwner / 100)
  const previewGuru = Math.floor(previewBiayaTotal * persentaseGuru / 100)

  if (loading) {
    return <div className="text-gray-500">Memuat pengaturan...</div>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Biaya Per Siswa Per Sesi (Rp)
        </label>
        <input
          type="number"
          value={biayaPerSiswaPerSesi}
          onChange={(e) => setBiayaPerSiswaPerSesi(Number(e.target.value))}
          min={0}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Persentase Owner (%)
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={persentaseOwner}
            onChange={(e) => handleOwnerChange(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-center text-lg font-bold text-blue-600 mt-1">
            {persentaseOwner}%
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Persentase Guru (%)
          </label>
          <input
            type="range"
            min={0}
            max={100}
            value={persentaseGuru}
            onChange={(e) => handleGuruChange(Number(e.target.value))}
            className="w-full"
          />
          <div className="text-center text-lg font-bold text-green-600 mt-1">
            {persentaseGuru}%
          </div>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Contoh Perhitungan:</h4>
        <p className="text-sm text-gray-600">
          {previewMurid} siswa × {formatRupiah(biayaPerSiswaPerSesi)} = {formatRupiah(previewBiayaTotal)}
        </p>
        <p className="text-sm text-blue-600">
          Owner: {formatRupiah(previewOwner)} ({persentaseOwner}%)
        </p>
        <p className="text-sm text-green-600">
          Guru: {formatRupiah(previewGuru)} ({persentaseGuru}%)
        </p>
      </div>

      {message && (
        <div className={`text-sm ${message.includes('berhasil') ? 'text-green-600' : 'text-red-600'}`}>
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </form>
  )
}
