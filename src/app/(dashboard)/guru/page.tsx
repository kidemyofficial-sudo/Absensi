'use client'

import { useState, useEffect, useCallback } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Teacher {
  id: string
  name: string
  phone: string
  createdAt: string
  branchTeachers: {
    cabangDaerah: string
  }[]
}

export default function GuruPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', password: '' })
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  const fetchTeachers = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/users?role=GURU&${params.toString()}`)
    const data = await res.json()
    setTeachers(data.users || [])
    setLoading(false)
  }, [search])

  useEffect(() => {
    fetchTeachers()
  }, [fetchTeachers])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'GURU' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal tambah guru')
      setMessage('Guru berhasil ditambahkan!')
      setFormData({ name: '', phone: '', password: '' })
      setShowForm(false)
      fetchTeachers()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return
    setDeleteConfirm(null)
    try {
      const res = await fetch(`/api/users/${deleteConfirm.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal hapus guru')
      }
      fetchTeachers()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const isSuccess = message.includes('berhasil')

  return (
    <div>
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Guru"
        message={`Yakin ingin menghapus guru ${deleteConfirm?.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(null)}
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Guru</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Kelola data guru pengampu</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormData({ name: '', phone: '', password: '' }) }}
          className="btn-primary"
        >
          {showForm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Batal
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tambah Guru
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className="mb-5 p-3.5 rounded-xl text-sm font-medium"
          style={{
            background: isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            color: isSuccess ? '#065f46' : '#991b1b',
            border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          {message}
        </div>
      )}

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h3 className="text-base font-bold mb-4" style={{ color: '#1e1b4b' }}>Tambah Guru Baru</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Nama</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="glass-input"
                  placeholder="Nama guru"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Nomor Telepon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                  className="glass-input"
                  placeholder="08xxxxxxxxxx"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Password</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  minLength={6}
                  className="glass-input"
                  placeholder="Minimal 6 karakter"
                />
              </div>
            </div>
            <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.25)' }}>
              Simpan
            </button>
          </form>
        </div>
      )}

      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama atau telepon guru..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-9"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Loading...</div>
        ) : teachers.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Tidak ada guru ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="glass-table w-full">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Telepon</th>
                  <th>Cabang Daerah Diampu</th>
                  <th>Terdaftar</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => (
                  <tr key={teacher.id}>
                    <td className="font-bold whitespace-nowrap" style={{ color: '#1e1b4b' }}>{teacher.name}</td>
                    <td className="whitespace-nowrap" style={{ color: '#4b5563' }}>{teacher.phone}</td>
                    <td className="whitespace-nowrap">
                      {teacher.branchTeachers && teacher.branchTeachers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.branchTeachers.map((bt) => (
                            <span key={bt.cabangDaerah} className="px-2.5 py-0.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                              {bt.cabangDaerah}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap" style={{ color: '#4b5563' }}>
                      {new Date(teacher.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        onClick={() => setDeleteConfirm({ id: teacher.id, name: teacher.name })}
                        className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-xs transition-colors"
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
