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
        <div className={`mb-4 p-3 rounded-xl text-sm font-medium border ${
          message.includes('berhasil')
            ? 'bg-green-50 text-green-700 border-green-200'
            : 'bg-red-50 text-red-700 border-red-200'
        }`}>
          {message}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-500">
          Total: {Object.keys(groupedByCabang).length} cabang, {branchTeachers.length} mapping guru
        </p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          {showForm ? 'Batal' : 'Tambah Cabang Daerah'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Cabang Daerah</label>
              <input
                type="text"
                value={formData.cabangDaerah}
                onChange={(e) => setFormData({ ...formData, cabangDaerah: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white transition-all"
                placeholder="contoh: Jakarta Pusat, Bandung Utara"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Guru Pengampu</label>
              <select
                value={formData.teacherId}
                onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white transition-all"
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
            className="bg-green-600 text-white px-4 py-2 rounded-xl hover:bg-green-700 text-sm font-medium transition-colors"
          >
            Simpan
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-gray-400 text-sm">Loading...</p>
      ) : Object.keys(groupedByCabang).length === 0 ? (
        <p className="text-gray-400 text-sm">Belum ada cabang daerah yang dibuat</p>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedByCabang).map(([cabangDaerah, bts]) => (
            <div key={cabangDaerah} className="border border-gray-100 rounded-2xl p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Cabang Daerah {cabangDaerah}</h4>
              <div className="space-y-2">
                {bts.map((bt) => (
                  <div key={bt.id} className="flex justify-between items-center bg-gray-50 p-3 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 text-sm">{bt.user.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{bt.student.length} siswa terdaftar</p>
                    </div>
                    <button
                      onClick={() => setDeleteConfirmId(bt.id)}
                      className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
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
