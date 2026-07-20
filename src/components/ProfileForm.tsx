'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface User {
  id: string
  name: string
  phone: string
  role: string
}

export default function ProfileForm({ user }: { user: User }) {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal update profil')
      setMessage('Profil berhasil diupdate!')
      router.refresh()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const isSuccess = message.includes('berhasil')

  return (
    <>
      {message && (
        <div
          className="mb-4 p-3.5 rounded-xl text-sm font-medium"
          style={{
            background: isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            color: isSuccess ? '#065f46' : '#991b1b',
            border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="glass-input"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Nomor Telepon</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="glass-input"
              placeholder="08xxxxxxxxxx"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-semibold mb-1.5" style={{ color: '#374151' }}>Role</label>
          <input
            type="text"
            value={user.role}
            disabled
            className="glass-input"
            style={{ opacity: 0.6, cursor: 'not-allowed' }}
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="btn-primary mt-5"
        >
          {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
        </button>
      </form>
    </>
  )
}
