'use client'

import { useState, useEffect } from 'react'
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
interface BranchTeacher { id: string; cabangDaerah: string; user: { name: string } }
interface Teacher { id: string; name: string; phone: string }

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [search, setSearch] = useState('')
  const [cabangFilter, setCabangFilter] = useState('')
  const [branchTeachers, setBranchTeachers] = useState<BranchTeacher[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [assignModal, setAssignModal] = useState<Student | null>(null)
  const [assignData, setAssignData] = useState({ provinsi: '', kotaKabupaten: '', teacherId: '', mataPelajaran: '' })

  const mataPelajaranList = [
    'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 'IPS',
    'PPKN', 'Seni Budaya', 'Penjaskes', 'Prakarya', 'Komputer',
    'Pendidikan Agama', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi',
    'Fisika', 'Kimia', 'Biologi', 'Umum', 'Lainnya',
  ]

  useEffect(() => {
    fetchUser()
    fetchStudents()
    if (user?.role === 'OWNER') { fetchBranchTeachers(); fetchTeachers() }
  }, [user?.role])

  useEffect(() => { fetchStudents() }, [statusFilter, search, cabangFilter])

  const fetchUser = async () => { const res = await fetch('/api/auth/me'); const data = await res.json(); setUser(data.user) }

  const fetchStudents = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.set('status', statusFilter)
    if (search) params.set('search', search)
    if (cabangFilter) params.set('cabang', cabangFilter)
    const res = await fetch(`/api/students?${params.toString()}`)
    const data = await res.json()
    setStudents(data.students || [])
    setLoading(false)
  }

  const fetchBranchTeachers = async () => { const res = await fetch('/api/branch-teachers'); const data = await res.json(); setBranchTeachers(data.branchTeachers || []) }
  const fetchTeachers = async () => { const res = await fetch('/api/users?role=GURU'); const data = await res.json(); setTeachers(data.users || []) }

  const handleApprove = async (studentId: string, status: 'APPROVED' | 'REJECTED') => {
    const res = await fetch(`/api/students/${studentId}/approve`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    if (res.ok) fetchStudents()
  }

  const handleAssign = async () => {
    if (!assignModal) return
    const cabangDaerah = `${assignData.kotaKabupaten}, ${assignData.provinsi}`
    const res = await fetch(`/api/students/${assignModal.id}/assign`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cabangDaerah, provinsi: assignData.provinsi, kotaKabupaten: assignData.kotaKabupaten, teacherId: assignData.teacherId, mataPelajaran: assignData.mataPelajaran }),
    })
    if (res.ok) { setAssignModal(null); setAssignData({ provinsi: '', kotaKabupaten: '', teacherId: '', mataPelajaran: '' }); fetchStudents() }
  }

  const cabangs = [...new Set(students.filter((s) => s.cabangDaerah).map((s) => s.cabangDaerah))].sort()

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Siswa</h1>
        <p className="text-sm text-gray-500 mt-1">Manajemen data siswa</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input type="text" placeholder="Cari nama atau NIS..." value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>
          {user?.role === 'OWNER' && (
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all">
              <option value="">Semua Status</option>
              <option value="PENDING">Menunggu ACC</option>
              <option value="APPROVED">Disetujui</option>
              <option value="REJECTED">Ditolak</option>
            </select>
          )}
          <select value={cabangFilter} onChange={(e) => setCabangFilter(e.target.value)}
            className="px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all">
            <option value="">Semua Cabang</option>
            {cabangs.map((c) => (<option key={c} value={c!}>{c}</option>))}
          </select>
        </div>
      </div>

      {assignModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl border border-gray-100">
            <h3 className="text-base font-semibold text-gray-900 mb-4">
              Assign Cabang Daerah - {assignModal.name}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Provinsi</label>
                <select value={assignData.provinsi} onChange={(e) => setAssignData({ ...assignData, provinsi: e.target.value, kotaKabupaten: '' })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all">
                  <option value="">Pilih Provinsi</option>
                  {provinsiList.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Kota / Kabupaten</label>
                <select value={assignData.kotaKabupaten} onChange={(e) => setAssignData({ ...assignData, kotaKabupaten: e.target.value })}
                  disabled={!assignData.provinsi}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all disabled:bg-gray-50">
                  <option value="">Pilih Kota/Kabupaten</option>
                  {(assignData.provinsi ? kotaKabupatenByProvinsi[assignData.provinsi as Provinsi] || [] : []).map((k) => (<option key={k} value={k}>{k}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Guru Pengampu (opsional)</label>
                <select value={assignData.teacherId} onChange={(e) => setAssignData({ ...assignData, teacherId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all">
                  <option value="">Pilih Guru</option>
                  {teachers.map((teacher) => (<option key={teacher.id} value={teacher.id}>{teacher.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Mata Pelajaran (opsional)</label>
                <select value={assignData.mataPelajaran} onChange={(e) => setAssignData({ ...assignData, mataPelajaran: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white transition-all">
                  <option value="">Pilih Mata Pelajaran</option>
                  {mataPelajaranList.map((mp) => (<option key={mp} value={mp}>{mp}</option>))}
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={handleAssign} className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors">Simpan</button>
                <button onClick={() => setAssignModal(null)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl hover:bg-gray-200 text-sm font-medium transition-colors">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading...</div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">Tidak ada siswa ditemukan</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">TTL</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cabang</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orang Tua</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru</th>
                  {user?.role === 'OWNER' && (
                    <th className="px-5 py-3.5 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{student.ttl}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{student.cabangDaerah || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{student.parent?.name || '-'}</td>
                    <td className="px-5 py-3.5 text-sm">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
                        student.status === 'APPROVED' ? 'bg-green-100 text-green-800'
                          : student.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {student.status === 'APPROVED' ? 'Disetujui' : student.status === 'PENDING' ? 'Menunggu' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {student.branchTeachers.length > 0 ? student.branchTeachers.map((bt) => bt.user.name).join(', ') : '-'}
                    </td>
                    {user?.role === 'OWNER' && (
                      <td className="px-5 py-3.5 text-sm text-right">
                        {student.status === 'PENDING' && (
                          <>
                            <button onClick={() => handleApprove(student.id, 'APPROVED')} className="text-green-600 hover:text-green-800 mr-2 font-medium text-xs">ACC</button>
                            <button onClick={() => handleApprove(student.id, 'REJECTED')} className="text-red-500 hover:text-red-700 font-medium text-xs">Tolak</button>
                          </>
                        )}
                        {student.status === 'APPROVED' && (
                          <button onClick={() => { setAssignModal(student); setAssignData({ provinsi: '', kotaKabupaten: '', teacherId: '', mataPelajaran: '' }) }}
                            className="text-blue-600 hover:text-blue-800 font-medium text-xs">
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
      </div>
    </div>
  )
}
