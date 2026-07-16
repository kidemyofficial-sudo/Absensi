'use client'

import { useState } from 'react'

export default function RegisterStudentForm() {
  const [name, setName] = useState('')
  const [nis, setNis] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ type: '', text: '' })

    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, nis }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal mendaftarkan siswa')
      }

      setMessage({ type: 'success', text: 'Siswa berhasil didaftarkan! Menunggu persetujuan admin.' })
      setName('')
      setNis('')
    } catch (err) {
      setMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Terjadi kesalahan',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-2">Daftarkan Siswa Baru</h3>
      <p className="text-gray-500 text-sm mb-4">
        Isi form di bawah untuk mendaftarkan anak Anda. Setelah itu, tunggu persetujuan dari Admin.
      </p>

      {message.text && (
        <div
          className={`mb-4 p-3 rounded text-sm ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Siswa
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Nama lengkap siswa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NIS (Nomor Induk Siswa)
            </label>
            <input
              type="text"
              value={nis}
              onChange={(e) => setNis(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Contoh: 2024001"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Mendaftarkan...' : 'Daftarkan Siswa'}
        </button>
      </form>
    </div>
  )
}
