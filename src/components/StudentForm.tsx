'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function StudentForm({ userId }: { userId: string }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [nis, setNis] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

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

      setMessage('Berhasil! Siswa sudah didaftarkan. Menunggu persetujuan admin.')
      setName('')
      setNis('')
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {message && (
        <div className={`mb-4 p-3 rounded text-sm ${
          message.includes('Berhasil')
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nama Lengkap Siswa
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              placeholder="Masukkan nama siswa"
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
              placeholder="Masukkan NIS"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Mendaftarkan...' : 'Daftarkan Siswa'}
        </button>
      </form>
    </>
  )
}
