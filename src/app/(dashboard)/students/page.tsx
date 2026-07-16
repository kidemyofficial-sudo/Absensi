'use client'

import { useState, useEffect } from 'react'

interface Student {
  id: string
  name: string
  nis: string
  class: string
  parent: {
    id: string
    name: string
    email: string
  } | null
}

interface User {
  id: string
  name: string
  role: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStudent, setEditingStudent] = useState<Student | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    nis: '',
    class: '',
    parentId: '',
  })
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')

  useEffect(() => {
    fetchUser()
    fetchStudents()
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [search, classFilter])

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    setUser(data.user)
  }

  const fetchStudents = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (classFilter) params.set('class', classFilter)

    const res = await fetch(`/api/students?${params.toString()}`)
    const data = await res.json()
    setStudents(data.students || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const url = editingStudent
      ? `/api/students/${editingStudent.id}`
      : '/api/students'

    const method = editingStudent ? 'PUT' : 'POST'

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Terjadi kesalahan')
      return
    }

    setShowForm(false)
    setEditingStudent(null)
    setFormData({ name: '', nis: '', class: '', parentId: '' })
    fetchStudents()
  }

  const handleEdit = (student: Student) => {
    setEditingStudent(student)
    setFormData({
      name: student.name,
      nis: student.nis,
      class: student.class,
      parentId: student.parent?.id || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus siswa ini?')) return

    const res = await fetch(`/api/students/${id}`, { method: 'DELETE' })

    if (res.ok) {
      fetchStudents()
    }
  }

  const classes = [...new Set(students.map((s) => s.class))].sort()

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Manajemen Siswa</h2>
        {user?.role === 'OWNER' && (
          <button
            onClick={() => {
              setEditingStudent(null)
              setFormData({ name: '', nis: '', class: '', parentId: '' })
              setShowForm(true)
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Tambah Siswa
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border rounded-md"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editingStudent ? 'Edit Siswa' : 'Tambah Siswa'}
            </h3>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
            )}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">NIS</label>
                <input
                  type="text"
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kelas</label>
                <input
                  type="text"
                  value={formData.class}
                  onChange={(e) => setFormData({ ...formData, class: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="contoh: 1A"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ID Orang Tua</label>
                <input
                  type="text"
                  value={formData.parentId}
                  onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="User ID orang tua"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  {editingStudent ? 'Simpan' : 'Tambah'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditingStudent(null)
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table - Desktop */}
      <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Tidak ada siswa ditemukan</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orang Tua</th>
                {user?.role === 'OWNER' && (
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">{student.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.nis}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{student.class}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {student.parent?.name || '-'}
                  </td>
                  {user?.role === 'OWNER' && (
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleEdit(student)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(student.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hapus
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cards - Mobile */}
      <div className="sm:hidden space-y-4">
        {loading ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">
            Loading...
          </div>
        ) : students.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">
            Tidak ada siswa ditemukan
          </div>
        ) : (
          students.map((student) => (
            <div key={student.id} className="bg-white p-4 rounded-lg shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{student.name}</h4>
                  <p className="text-sm text-gray-500">NIS: {student.nis}</p>
                  <p className="text-sm text-gray-500">Kelas: {student.class}</p>
                  <p className="text-sm text-gray-500">
                    Orang Tua: {student.parent?.name || '-'}
                  </p>
                </div>
                {user?.role === 'OWNER' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-blue-600 hover:text-blue-900 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="text-red-600 hover:text-red-900 text-sm"
                    >
                      Hapus
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
