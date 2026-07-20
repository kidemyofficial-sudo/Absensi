'use client'

import { useState, useEffect, useCallback } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'

interface Parent {
  id: string
  name: string
  phone: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  createdAt: string
  students: {
    id: string
    name: string
  }[]
}

export default function WaliMuridPage() {
  const [parents, setParents] = useState<Parent[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', password: '' })
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  const fetchParents = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/users?role=ORANG_TUA&${params.toString()}`)
    const data = await res.json()
    setParents(data.users || [])
    setLoading(false)
  }, [search])

  useEffect(() => {
    fetchParents()
  }, [fetchParents])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'ORANG_TUA' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal tambah wali murid')
      setMessage('Wali Murid berhasil ditambahkan!')
      setFormData({ name: '', phone: '', password: '' })
      setShowForm(false)
      fetchParents()
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
        throw new Error(data.error || 'Gagal hapus wali murid')
      }
      setMessage('Wali Murid berhasil dihapus!')
      fetchParents()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleApprove = async (id: string) => {
    setMessage('')
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal menyetujui akun')
      setMessage('Akun wali murid berhasil disetujui!')
      fetchParents()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const isSuccess = message.includes('berhasil')

  return (
    <div>
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Wali Murid"
        message={`Yakin ingin menghapus wali murid ${deleteConfirm?.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(null)}
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Wali Murid</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Kelola data wali murid (orang tua siswa)</p>
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
              Tambah Wali Murid
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
          <h3 className="text-base font-bold mb-4" style={{ color: '#1e1b4b' }}>Tambah Wali Murid Baru</h3>
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
                  placeholder="Nama wali murid"
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
            placeholder="Cari nama atau telepon wali murid..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-9"
          />
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Loading...</div>
        ) : parents.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Tidak ada wali murid ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="glass-table w-full">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>Telepon</th>
                  <th>Status</th>
                  <th>Siswa Terkait</th>
                  <th>Terdaftar</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {parents.map((parent) => (
                  <tr key={parent.id}>
                    <td className="font-bold whitespace-nowrap" style={{ color: '#1e1b4b' }}>{parent.name}</td>
                    <td className="whitespace-nowrap" style={{ color: '#4b5563' }}>{parent.phone}</td>
                    <td className="whitespace-nowrap">
                      {parent.status === 'PENDING' ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          Menunggu ACC
                        </span>
                      ) : parent.status === 'APPROVED' ? (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Aktif
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                          Ditolak
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap">
                      {parent.students && parent.students.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {parent.students.map((student) => (
                            <span key={student.id} className="px-2.5 py-0.5 rounded-lg text-xs font-semibold" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                              {student.name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span style={{ color: '#9ca3af' }}>-</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap" style={{ color: '#4b5563' }}>
                      {new Date(parent.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="text-right whitespace-nowrap gap-2 flex items-center justify-end">
                      {parent.status === 'PENDING' && (
                        <button
                          onClick={() => handleApprove(parent.id)}
                          className="px-2.5 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-lg font-bold text-xs transition-colors"
                        >
                          ACC
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteConfirm({ id: parent.id, name: parent.name })}
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
