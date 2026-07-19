'use client'

import { useState, useEffect, useCallback } from 'react'
import ConfirmDialog from './ConfirmDialog'

interface Teacher {
  id: string
  name: string
  phone: string
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

  return (
    <>
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Guru"
        message={`Yakin ingin menghapus guru ${deleteConfirm?.name}? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Ya, Hapus"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(null)}
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
        <p className="text-sm text-gray-500">Total: {teachers.length} guru</p>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          {showForm ? 'Batal' : 'Tambah Guru'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 mb-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white transition-all"
                placeholder="Nama guru"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white transition-all"
                placeholder="08xxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
                className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-black bg-white transition-all"
                placeholder="Minimal 6 karakter"
              />
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
      ) : teachers.length === 0 ? (
        <p className="text-gray-400 text-sm">Belum ada guru terdaftar</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telepon</th>
                <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terdaftar</th>
                <th className="px-4 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {teachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3.5 text-sm text-gray-900 font-medium">{teacher.name}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-600">{teacher.phone}</td>
                  <td className="px-4 py-3.5 text-sm text-gray-500">
                    {new Date(teacher.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-4 py-3.5 text-right">
                    <button
                      onClick={() => setDeleteConfirm({ id: teacher.id, name: teacher.name })}
                      className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors"
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
