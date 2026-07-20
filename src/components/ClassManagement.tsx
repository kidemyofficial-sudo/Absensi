'use client'

import { useState, useEffect, useCallback } from 'react'
import ConfirmDialog from './ConfirmDialog'

interface Teacher {
  id: string
  name: string
  phone: string
}

interface BranchTeacher {
  id: string
  cabangDaerah: string
  user: Teacher
  student: { id: string; name: string }[]
}

export default function ClassManagement() {
  const [branchTeachers, setBranchTeachers] = useState<BranchTeacher[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ teacherId: '', cabangDaerah: '' })
  const [message, setMessage] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const [btRes, tRes] = await Promise.all([
      fetch('/api/branch-teachers'),
      fetch('/api/users?role=GURU'),
    ])
    const btData = await btRes.json()
    const tData = await tRes.json()
    setBranchTeachers(btData.branchTeachers || [])
    setTeachers(tData.users || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')
    try {
      const res = await fetch('/api/branch-teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Gagal tambah cabang daerah')
      setMessage('Cabang Daerah berhasil ditambahkan!')
      setFormData({ teacherId: '', cabangDaerah: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmId) return
    setDeleteConfirmId(null)
    try {
      const res = await fetch(`/api/branch-teachers/${deleteConfirmId}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal hapus')
      }
      fetchData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const groupedByCabang = branchTeachers.reduce((acc, bt) => {
    if (!acc[bt.cabangDaerah]) acc[bt.cabangDaerah] = []
    acc[bt.cabangDaerah].push(bt)
    return acc
  }, {} as Record<string, BranchTeacher[]>)

  const isSuccess = message.includes('berhasil')

  return (
    <>
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Hapus Mapping Cabang Daerah"
        message="Yakin ingin menghapus mapping cabang daerah ini? Tindakan ini tidak dapat dibatalkan."
        confirmText="Ya, Hapus"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirmId(null)}
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
        <p className="text-xs font-semibold" style={{ color: '#9ca3af' }}>
          Total: <span style={{ color: '#6366f1' }}>{Object.keys(groupedByCabang).length}</span> cabang, <span style={{ color: '#6366f1' }}>{branchTeachers.length}</span> guru
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary py-2 text-xs"
          style={{ borderRadius: '12px' }}
        >
          {showForm ? 'Batal' : 'Tambah Cabang Daerah'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 rounded-xl border border-white/50 mb-4" style={{ background: 'rgba(255,255,255,0.4)' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Nama Cabang Daerah</label>
              <input
                type="text"
                value={formData.cabangDaerah}
                onChange={(e) => setFormData({ ...formData, cabangDaerah: e.target.value })}
                required
                className="glass-input"
                placeholder="contoh: Jakarta Pusat, Bandung Utara"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Guru Pengampu</label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                required
                className="glass-input"
              >
                <option value="">Pilih Guru</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
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
      ) : Object.keys(groupedByCabang).length === 0 ? (
        <p className="text-center py-6 text-sm" style={{ color: '#9ca3af' }}>Belum ada cabang daerah yang dibuat</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByCabang).map(([cabangDaerah, bts]) => (
            <div key={cabangDaerah} className="border border-white/50 rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.3)' }}>
              <h4 className="font-bold mb-3 text-sm" style={{ color: '#1e1b4b' }}>Cabang Daerah {cabangDaerah}</h4>
              <div className="space-y-2">
                {bts.map((bt) => (
                  <div key={bt.id} className="flex justify-between items-center p-3 rounded-xl border border-white/40" style={{ background: 'rgba(255,255,255,0.5)' }}>
                    <div>
                      <p className="font-semibold text-sm" style={{ color: '#1e1b4b' }}>{bt.user.name}</p>
                      <p className="text-xs mt-0.5" style={{ color: '#8b5cf6' }}>{bt.student.length} siswa terdaftar</p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirmId(bt.id)}
                      className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-xs transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}
