'use client'

import { useState, useEffect } from 'react'

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

export default function CabangDaerahPage() {
  const [branchTeachers, setBranchTeachers] = useState<BranchTeacher[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    cabangDaerah: '',
    teacherId: '',
  })
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [search])

  const fetchData = async () => {
    setLoading(true)
    const [btRes, tRes] = await Promise.all([
      fetch('/api/branch-teachers'),
      fetch('/api/users?role=GURU'),
    ])
    const btData = await btRes.json()
    const tData = await tRes.json()
    setBranchTeachers(btData.branchTeachers || [])
    setTeachers(tData.users || [])
    setLoading(false)
  }

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

      if (!res.ok) {
        throw new Error(data.error || 'Gagal tambah cabang daerah')
      }

      setMessage('Cabang Daerah berhasil ditambahkan!')
      setFormData({ cabangDaerah: '', teacherId: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus mapping cabang daerah ini?')) return

    try {
      const res = await fetch(`/api/branch-teachers/${id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal hapus')
      }

      fetchData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  // Group by cabangDaerah
  const groupedByCabang = branchTeachers.reduce((acc, bt) => {
    if (!acc[bt.cabangDaerah]) {
      acc[bt.cabangDaerah] = []
    }
    acc[bt.cabangDaerah].push(bt)
    return acc
  }, {} as Record<string, BranchTeacher[]>)

  // Filter by search
  const filteredCabangs = Object.entries(groupedByCabang).filter(([cabangDaerah]) =>
    cabangDaerah.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Kelola Cabang Daerah</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setFormData({ cabangDaerah: '', teacherId: '' })
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Batal' : 'Tambah Cabang Daerah'}
        </button>
      </div>

      {message && (
        <div className={`mb-4 p-3 rounded text-sm ${
          message.includes('berhasil')
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {message}
        </div>
      )}

      {/* Form Tambah Cabang Daerah */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Cabang Daerah Baru</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Cabang Daerah</label>
                <input
                  type="text"
                  value={formData.cabangDaerah}
                  onChange={(e) => setFormData({ ...formData, cabangDaerah: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="contoh: Jakarta Pusat, Bandung Utara"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Guru Pengampu</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
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
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Simpan
            </button>
          </form>
        </div>
      )}

      {/* Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <input
          type="text"
          placeholder="Cari nama cabang daerah..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-black"
        />
      </div>

      {/* Daftar Cabang Daerah */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">Loading...</div>
        ) : filteredCabangs.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">Tidak ada cabang daerah ditemukan</div>
        ) : (
          filteredCabangs.map(([cabangDaerah, bts]) => (
            <div key={cabangDaerah} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-medium">Cabang Daerah {cabangDaerah}</h4>
                <span className="text-sm">{bts.length} guru</span>
              </div>
              <div className="space-y-2">
                {bts.map((bt) => (
                  <div key={bt.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <div>
                      <p className="font-medium">{bt.user.name}</p>
                      <p className="text-sm">{bt.student.length} siswa terdaftar</p>
                    </div>
                    <button
                      onClick={() => handleDelete(bt.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
