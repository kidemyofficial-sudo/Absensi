'use client'

import { useState, useEffect } from 'react'

interface Student {
  id: string
  name: string
  ttl: string
  domisili: string
  asalSekolah: string
  class: string | null
  status: string
  parent: {
    id: string
    name: string
    phone: string
  } | null
  classroomTeachers: {
    user: { name: string }
  }[]
}

interface User {
  id: string
  name: string
  role: string
}

interface ClassroomTeacher {
  id: string
  className: string
  user: { name: string }
}

interface Teacher {
  id: string
  name: string
  phone: string
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [classroomTeachers, setClassroomTeachers] = useState<ClassroomTeacher[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [assignModal, setAssignModal] = useState<Student | null>(null)
  const [assignData, setAssignData] = useState({ class: '', teacherId: '' })

  useEffect(() => {
    fetchUser()
    fetchStudents()
    if (user?.role === 'OWNER') {
      fetchClassroomTeachers()
      fetchTeachers()
    }
  }, [user?.role])

  useEffect(() => {
    fetchStudents()
  }, [statusFilter, search, classFilter])

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    setUser(data.user)
  }

  const fetchStudents = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)
    if (classFilter) params.set('class', classFilter)

    const res = await fetch(`/api/students?${params.toString()}`)
    const data = await res.json()
    setStudents(data.students || [])
    setLoading(false)
  }

  const fetchClassroomTeachers = async () => {
    const res = await fetch('/api/classroom-teachers')
    const data = await res.json()
    setClassroomTeachers(data.classroomTeachers || [])
  }

  const fetchTeachers = async () => {
    const res = await fetch('/api/users?role=GURU')
    const data = await res.json()
    setTeachers(data.users || [])
  }

  const handleApprove = async (studentId: string, status: 'APPROVED' | 'REJECTED') => {
    const res = await fetch(`/api/students/${studentId}/approve`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (res.ok) {
      fetchStudents()
    }
  }

  const handleAssign = async () => {
    if (!assignModal) return

    const res = await fetch(`/api/students/${assignModal.id}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assignData),
    })

    if (res.ok) {
      setAssignModal(null)
      setAssignData({ class: '', teacherId: '' })
      fetchStudents()
    }
  }

  const classes = [...new Set(students.filter((s) => s.class).map((s) => s.class))].sort()

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Manajemen Siswa</h2>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Cari nama atau NIS..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md text-black"
          />
          {user?.role === 'OWNER' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-md text-black"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu ACC</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          )}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 border rounded-md text-black"
          >
            <option value="">Semua Kelas</option>
            {classes.map((c) => (
              <option key={c} value={c!}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              Assign Kelas - {assignModal.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kelas</label>
                <input
                  type="text"
                  value={assignData.class}
                  onChange={(e) => setAssignData({ ...assignData, class: e.target.value, teacherId: '' })}
                  className="w-full px-3 py-2 border rounded-md text-black"
                  placeholder="contoh: 1A"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Guru Pengampu (opsional)</label>
                <select
                  value={assignData.teacherId}
                  onChange={(e) => setAssignData({ ...assignData, teacherId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-md text-black"
                >
                  <option value="">Pilih Guru</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAssign}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Simpan
                </button>
                <button
                  onClick={() => setAssignModal(null)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-500">Tidak ada siswa ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">TTL</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orang Tua</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guru</th>
                  {user?.role === 'OWNER' && (
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="px-4 py-3">{student.name}</td>
                    <td className="px-4 py-3">{student.ttl}</td>
                    <td className="px-4 py-3">{student.class || '-'}</td>
                    <td className="px-4 py-3">{student.parent?.name || '-'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          student.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : student.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {student.status === 'APPROVED'
                          ? 'Disetujui'
                          : student.status === 'PENDING'
                          ? 'Menunggu'
                          : 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {student.classroomTeachers.length > 0
                        ? student.classroomTeachers.map((ct) => ct.user.name).join(', ')
                        : '-'}
                    </td>
                    {user?.role === 'OWNER' && (
                      <td className="px-4 py-3 text-right">
                        {student.status === 'PENDING' && (
                          <>
                            <button
                              onClick={() => handleApprove(student.id, 'APPROVED')}
                              className="text-green-600 hover:text-green-900 mr-2"
                            >
                              ACC
                            </button>
                            <button
                              onClick={() => handleApprove(student.id, 'REJECTED')}
                              className="text-red-600 hover:text-red-900 mr-2"
                            >
                              Tolak
                            </button>
                          </>
                        )}
                        {student.status === 'APPROVED' && (
                          <button
                            onClick={() => {
                              setAssignModal(student)
                              setAssignData({ class: student.class || '', teacherId: '' })
                            }}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {student.class ? 'Edit' : 'Assign'}
                          </button>
                        )}
                      </td>
                    )}
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
