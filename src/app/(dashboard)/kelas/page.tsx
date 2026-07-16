'use client'

import { useState, useEffect } from 'react'

interface Teacher {
  id: string
  name: string
  email: string
}

interface ClassroomTeacher {
  id: string
  className: string
  user: Teacher
  student: { id: string; name: string }[]
}

export default function KelasPage() {
  const [classroomTeachers, setClassroomTeachers] = useState<ClassroomTeacher[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    className: '',
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
    const [ctRes, tRes] = await Promise.all([
      fetch('/api/classroom-teachers'),
      fetch('/api/users?role=GURU'),
    ])
    const ctData = await ctRes.json()
    const tData = await tRes.json()
    setClassroomTeachers(ctData.classroomTeachers || [])
    setTeachers(tData.users || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    try {
      const res = await fetch('/api/classroom-teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal tambah kelas')
      }

      setMessage('Kelas berhasil ditambahkan!')
      setFormData({ className: '', teacherId: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus mapping kelas ini?')) return

    try {
      const res = await fetch(`/api/classroom-teachers/${id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal hapus')
      }

      fetchData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  // Group by class
  const groupedByClass = classroomTeachers.reduce((acc, ct) => {
    if (!acc[ct.className]) {
      acc[ct.className] = []
    }
    acc[ct.className].push(ct)
    return acc
  }, {} as Record<string, ClassroomTeacher[]>)

  // Filter by search
  const filteredClasses = Object.entries(groupedByClass).filter(([className]) =>
    className.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Kelola Kelas</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setFormData({ className: '', teacherId: '' })
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Batal' : 'Tambah Kelas'}
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

      {/* Form Tambah Kelas */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Kelas Baru</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Kelas</label>
                <input
                  type="text"
                  value={formData.className}
                  onChange={(e) => setFormData({ ...formData, className: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="contoh: 1A, 2B, 3A"
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
          placeholder="Cari nama kelas..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-black"
        />
      </div>

      {/* Daftar Kelas */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">Loading...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">Tidak ada kelas ditemukan</div>
        ) : (
          filteredClasses.map(([className, cts]) => (
            <div key={className} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-medium">Kelas {className}</h4>
                <span className="text-sm">{cts.length} guru</span>
              </div>
              <div className="space-y-2">
                {cts.map((ct) => (
                  <div key={ct.id} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                    <div>
                      <p className="font-medium">{ct.user.name}</p>
                      <p className="text-sm">{ct.student.length} siswa terdaftar</p>
                    </div>
                    <button
                      onClick={() => handleDelete(ct.id)}
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
