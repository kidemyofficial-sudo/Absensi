'use client'

import { useState, useEffect, useCallback } from 'react'
import ConfirmDialog from './ConfirmDialog'

interface Teacher {
  id: string
  name: string
  phone: string
  status: string
  createdAt: string
}

export default function TeacherManagement() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', phone: '', password: '' })
  const [message, setMessage] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)

  const fetchTeachers = useCallback(async () => {
    const res = await fetch('/api/users?role=GURU')
    const data = await res.json()
    setTeachers(data.users || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchTeachers() }, [fetchTeachers])

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

  const handleToggleStatus = async (teacherId: string, currentStatus: string) => {
    setMessage('')
    const newStatus = currentStatus === 'APPROVED' ? 'REJECTED' : 'APPROVED'
    try {
      const res = await fetch(`/api/users/${teacherId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status guru')
      setMessage(`Status guru berhasil diubah menjadi ${newStatus === 'APPROVED' ? 'Aktif' : 'Non-Aktif'}`)
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
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Gagal hapus guru')
      }
      setMessage(data.message || 'Berhasil diproses')
      fetchTeachers()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const isSuccess = message.includes('berhasil') || message.includes('Berhasil')

  return (
    <>
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus / Nonaktifkan Guru"
        message={`Yakin ingin memproses guru ${deleteConfirm?.name}? Jika guru memiliki riwayat les, akun akan dinonaktifkan agar riwayat laporan keuangan tidak hilang.`}
        confirmText="Ya, Proses"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(null)}
      />

      {message && (
        <div
          className="mb-4 p-3.5 rounded-xl text-sm font-medium border"
          style={{
            background: isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            color: isSuccess ? '#065f46' : '#991b1b',
            borderColor: isSuccess ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
          }}
        >
          {message}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <p className="text-xs font-semibold" style={{ color: '#9ca3af' }}>Total: <span style={{ color: '#6366f1' }}>{teachers.length}</span> guru</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary py-2 text-xs"
          style={{ borderRadius: '12px' }}
        >
          {showForm ? 'Batal' : 'Tambah Guru'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-white/50 mb-4" style={{ background: 'rgba(255,255,255,0.4)' }}>
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
          <button
            type="submit"
            className="btn-primary py-2 text-xs"
            style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.25)', borderRadius: '12px' }}
          >
            Simpan
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-center py-6 text-sm" style={{ color: '#9ca3af' }}>Loading...</p>
      ) : teachers.length === 0 ? (
        <p className="text-center py-6 text-sm" style={{ color: '#9ca3af' }}>Belum ada guru terdaftar</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="glass-table w-full">
            <thead>
              <tr>
                <th>Nama</th>
                <th>Telepon</th>
                <th>Status</th>
                <th>Terdaftar</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {teachers.map((teacher) => (
                <tr key={teacher.id}>
                  <td className="font-bold" style={{ color: '#1e1b4b' }}>{teacher.name}</td>
                  <td style={{ color: '#4b5563' }}>{teacher.phone}</td>
                  <td>
                    <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                      teacher.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {teacher.status === 'APPROVED' ? 'Aktif' : 'Non-Aktif'}
                    </span>
                  </td>
                  <td style={{ color: '#6b7280' }}>
                    {new Date(teacher.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="text-right flex items-center justify-end gap-2">
                    <button
                      onClick={() => handleToggleStatus(teacher.id, teacher.status)}
                      className={`px-2 py-1 rounded-lg font-bold text-xs transition-colors ${
                        teacher.status === 'APPROVED'
                          ? 'bg-amber-100 hover:bg-amber-200 text-amber-800'
                          : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                      }`}
                    >
                      {teacher.status === 'APPROVED' ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: teacher.id, name: teacher.name })}
                      className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-xs transition-colors"
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
    </>
  )
}
