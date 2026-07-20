'use client'

import { useState, useEffect, useCallback } from 'react'
import { provinsiList, kotaKabupatenByProvinsi, type Provinsi } from '@/data/indonesia'

interface Student {
  id: string
  name: string
  ttl: string
  domisili: string
  asalSekolah: string
  cabangDaerah: string | null
  status: string
  parent: { id: string; name: string; phone: string } | null
  branchTeachers: { user: { name: string } }[]
}

interface User { id: string; name: string; role: string }
interface Teacher { id: string; name: string; phone: string }
interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [cabangFilter, setCabangFilter] = useState('')
  const [cabangs, setCabangs] = useState<string[]>([])
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 25, total: 0, totalPages: 1 })
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [assignModal, setAssignModal] = useState<Student | null>(null)
  const [assignData, setAssignData] = useState({ provinsi: '', kotaKabupaten: '', teacherId: '', mataPelajaran: '' })

  const mataPelajaranList = [
    'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 'IPS',
    'PPKN', 'Seni Budaya', 'Penjaskes', 'Prakarya', 'Komputer',
    'Pendidikan Agama', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi',
    'Fisika', 'Kimia', 'Biologi', 'Umum', 'Lainnya',
  ]

  const fetchUser = useCallback(async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    setUser(data.user)
  }, [])

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({
      page: String(pagination.page),
      limit: String(pagination.limit),
    })
    if (statusFilter) params.set('status', statusFilter)
    if (debouncedSearch) params.set('search', debouncedSearch)
    if (cabangFilter) params.set('cabang', cabangFilter)
    try {
      const res = await fetch(`/api/students?${params.toString()}`)
      const data = await res.json()
      setStudents(data.students || [])
      setCabangs(data.cabangs || [])
      setPagination((prev) => data.pagination || prev)
    } finally {
      setLoading(false)
    }
  }, [pagination.page, pagination.limit, statusFilter, debouncedSearch, cabangFilter])

  const fetchTeachers = useCallback(async () => {
    const res = await fetch('/api/users?role=GURU')
    const data = await res.json()
    setTeachers(data.users || [])
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search.trim())
      setPagination((prev) => ({ ...prev, page: 1 }))
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [search])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  useEffect(() => {
    if (user?.role === 'OWNER') {
      fetchTeachers()
    }
  }, [user?.role, fetchTeachers])

  const handleApprove = async (studentId: string, status: 'APPROVED' | 'REJECTED') => {
    const res = await fetch(`/api/students/${studentId}/approve`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) {
      fetchStudents()
      return
    }

    const data = await res.json().catch(() => ({}))
    console.error(data.error || 'Gagal memperbarui status siswa')
  }

  const handleAssign = async () => {
    if (!assignModal) return
    const cabangDaerah = `${assignData.kotaKabupaten}, ${assignData.provinsi}`
    const res = await fetch(`/api/students/${assignModal.id}/assign`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cabangDaerah, provinsi: assignData.provinsi, kotaKabupaten: assignData.kotaKabupaten, teacherId: assignData.teacherId, mataPelajaran: assignData.mataPelajaran }),
    })
    if (res.ok) {
      setAssignModal(null)
      setAssignData({ provinsi: '', kotaKabupaten: '', teacherId: '', mataPelajaran: '' })
      fetchStudents()
      return
    }

    const data = await res.json().catch(() => ({}))
    console.error(data.error || 'Gagal assign siswa')
  }

  const setPage = (page: number) => {
    setPagination((prev) => ({
      ...prev,
      page: Math.min(Math.max(page, 1), prev.totalPages),
    }))
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Siswa</h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Manajemen data siswa</p>
      </div>

      {/* Filter panel */}
      <div className="glass-card p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari nama, TTL, atau sekolah..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="glass-input pl-9"
            />
          </div>
          {user?.role === 'OWNER' && (
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="glass-input sm:w-44"
            >
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu ACC</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          )}
          <select
            value={cabangFilter}
            onChange={(e) => { setCabangFilter(e.target.value); setPage(1) }}
            className="glass-input sm:w-44"
          >
            <option value="">Semua Cabang</option>
            {cabangs.map((c) => (<option key={c} value={c}>{c}</option>))}
          </select>
        </div>
      </div>

      {/* Assign modal */}
      {assignModal && (
        <div
          className="fixed inset-0 flex items-center justify-center z-50 p-4"
          style={{ background: 'rgba(15,10,40,0.45)', backdropFilter: 'blur(6px)' }}
        >
          <div className="glass-modal p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold" style={{ color: '#1e1b4b' }}>
                Assign Cabang Daerah
              </h3>
              <button
                onClick={() => setAssignModal(null)}
                className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: '#9ca3af' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-xs mb-4" style={{ color: '#6b7280' }}>Siswa: <strong style={{ color: '#1e1b4b' }}>{assignModal.name}</strong></p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Provinsi</label>
                <select
                  value={assignData.provinsi}
                  onChange={(e) => setAssignData({ ...assignData, provinsi: e.target.value, kotaKabupaten: '' })}
                  className="glass-input"
                >
                  <option value="">Pilih Provinsi</option>
                  {provinsiList.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Kota / Kabupaten</label>
                <select
                  value={assignData.kotaKabupaten}
                  onChange={(e) => setAssignData({ ...assignData, kotaKabupaten: e.target.value })}
                  disabled={!assignData.provinsi}
                  className="glass-input"
                  style={!assignData.provinsi ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {(assignData.provinsi ? kotaKabupatenByProvinsi[assignData.provinsi as Provinsi] || [] : []).map((k) => (<option key={k} value={k}>{k}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Guru Pengampu (opsional)</label>
                <select
                  value={assignData.teacherId}
                  onChange={(e) => setAssignData({ ...assignData, teacherId: e.target.value })}
                  className="glass-input"
                >
                  <option value="">Pilih Guru</option>
                  {teachers.map((teacher) => (<option key={teacher.id} value={teacher.id}>{teacher.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Mata Pelajaran (opsional)</label>
                <select
                  value={assignData.mataPelajaran}
                  onChange={(e) => setAssignData({ ...assignData, mataPelajaran: e.target.value })}
                  className="glass-input"
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {mataPelajaranList.map((mp) => (<option key={mp} value={mp}>{mp}</option>))}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleAssign} className="btn-primary flex-1">Simpan</button>
                <button onClick={() => setAssignModal(null)} className="btn-secondary flex-1">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main glass card table wrapper */}
      <div className="glass-card overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Tidak ada siswa ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="glass-table w-full min-w-[800px]">
              <thead>
                <tr>
                  <th>Nama</th>
                  <th>TTL</th>
                  <th>Cabang</th>
                  <th>Orang Tua</th>
                  <th>Status</th>
                  <th>Guru</th>
                  {user?.role === 'OWNER' && (
                    <th className="text-right">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="font-bold" style={{ color: '#1e1b4b' }}>{student.name}</td>
                    <td style={{ color: '#4b5563' }}>{student.ttl}</td>
                    <td style={{ color: '#4b5563' }}>{student.cabangDaerah || '-'}</td>
                    <td className="font-medium" style={{ color: '#374151' }}>{student.parent?.name || '-'}</td>
                    <td>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                        student.status === 'APPROVED' ? 'badge-green'
                          : student.status === 'PENDING' ? 'badge-yellow'
                          : 'badge-red'
                      }`}>
                        {student.status === 'APPROVED' ? 'Disetujui' : student.status === 'PENDING' ? 'Menunggu' : 'Ditolak'}
                      </span>
                    </td>
                    <td style={{ color: '#4b5563' }}>
                      {student.branchTeachers.length > 0 ? student.branchTeachers.map((bt) => bt.user.name).join(', ') : '-'}
                    </td>
                    {user?.role === 'OWNER' && (
                      <td className="text-right">
                        {student.status === 'PENDING' && (
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => handleApprove(student.id, 'APPROVED')}
                              className="px-2.5 py-1 rounded-lg font-bold text-xs bg-emerald-100 hover:bg-emerald-200 text-emerald-800 transition-colors"
                            >
                              ACC
                            </button>
                            <button
                              onClick={() => handleApprove(student.id, 'REJECTED')}
                              className="px-2.5 py-1 rounded-lg font-bold text-xs bg-rose-100 hover:bg-rose-200 text-rose-800 transition-colors"
                            >
                              Tolak
                            </button>
                          </div>
                        )}
                        {student.status === 'APPROVED' && (
                          <button
                            onClick={() => { setAssignModal(student); setAssignData({ provinsi: '', kotaKabupaten: '', teacherId: '', mataPelajaran: '' }) }}
                            className="px-3 py-1.5 rounded-lg font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 transition-colors"
                          >
                            {student.cabangDaerah ? 'Edit' : 'Assign'}
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

        {/* Pagination */}
        {!loading && students.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4" style={{ borderTop: '1px solid rgba(229,231,235,0.4)' }}>
            <p className="text-xs" style={{ color: '#9ca3af' }}>
              Menampilkan {students.length} dari {pagination.total} siswa
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
              >
                Sebelumnya
              </button>
              <span className="text-xs font-semibold" style={{ color: '#4b5563' }}>
                Halaman {pagination.page} / {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="btn-secondary"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.75rem' }}
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
