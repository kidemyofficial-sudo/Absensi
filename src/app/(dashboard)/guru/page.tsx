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
          <h1 className="text-2xl font-bold text-gray-900">Guru</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola data guru pengampu</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormData({ name: '', phone: '', password: '' }) }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {showForm ? 'Batal' : 'Tambah Guru'}
        </button>
      </div>

      {message && (
        <div className={`mb-5 p-3.5 rounded-xl text-sm font-medium ${
          message.includes('berhasil')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Tambah Guru Baru</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                  placeholder="Nama guru" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nomor Telepon</label>
                <input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                  placeholder="08xxxxxxxxxx" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <input type="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required minLength={6}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                  placeholder="Minimal 6 karakter" />
              </div>
            </div>
            <button type="submit" className="bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 text-sm font-medium transition-colors">
              Simpan
            </button>
          </form>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama atau telepon guru..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : teachers.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Tidak ada guru ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telepon</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cabang Daerah Diampu</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Terdaftar</th>
                  <th className="px-5 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900 whitespace-nowrap">{teacher.name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600 whitespace-nowrap">{teacher.phone}</td>
                    <td className="px-5 py-3.5 text-sm whitespace-nowrap">
                      {teacher.branchTeachers && teacher.branchTeachers.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {teacher.branchTeachers.map((bt) => (
                            <span key={bt.cabangDaerah} className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium">
                              {bt.cabangDaerah}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300">-</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                      {new Date(teacher.createdAt).toLocaleDateString('id-ID')}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-right whitespace-nowrap">
                      <button
                        onClick={() => setDeleteConfirm({ id: teacher.id, name: teacher.name })}
                        className="text-red-500 hover:text-red-700 font-medium text-xs"
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
