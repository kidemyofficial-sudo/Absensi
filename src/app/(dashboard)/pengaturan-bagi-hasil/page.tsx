'use client'

import { useState, useEffect, useCallback } from 'react'

interface StudentRevenue {
  id: string
  name: string
  ttl: string
  domisili: string
  asalSekolah: string
  cabangDaerah: string | null
  biayaPerSiswa: number
  status: string
  parent: { id: string; name: string } | null
  branchTeachers: {
    id: string
    persentaseOwner: number
    persentaseGuru: number
    mataPelajaran: string
    user: { name: string }
  }[]
}

export default function PengaturanBagiHasilPage() {
  const [students, setStudents] = useState<StudentRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<StudentRevenue | null>(null)
  const [editBranchTeacherId, setEditBranchTeacherId] = useState('')
  const [editBiaya, setEditBiaya] = useState(50000)
  const [editPersentaseOwner, setEditPersentaseOwner] = useState(40)
  const [editPersentaseGuru, setEditPersentaseGuru] = useState(60)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/revenue-settings')
      const data = await res.json()
      if (data.students) {
        setStudents(data.students)
      }
    } catch {
      console.error('Failed to fetch students')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const openEdit = (student: StudentRevenue) => {
    const branchTeacher = student.branchTeachers[0]
    setEditing(student)
    setEditBranchTeacherId(branchTeacher?.id ?? '')
    setEditBiaya(student.biayaPerSiswa)
    setEditPersentaseOwner(branchTeacher?.persentaseOwner ?? 40)
    setEditPersentaseGuru(branchTeacher?.persentaseGuru ?? 60)
    setMessage('')
  }

  const closeEdit = () => {
    setEditing(null)
    setEditBranchTeacherId('')
    setMessage('')
  }

  const handleBranchTeacherChange = (branchTeacherId: string) => {
    const branchTeacher = editing?.branchTeachers.find((bt) => bt.id === branchTeacherId)
    setEditBranchTeacherId(branchTeacherId)
    setEditPersentaseOwner(branchTeacher?.persentaseOwner ?? 40)
    setEditPersentaseGuru(branchTeacher?.persentaseGuru ?? 60)
  }

  const handleSave = async () => {
    if (!editing) return
    if (editPersentaseOwner + editPersentaseGuru !== 100) {
      setMessage('Total persentase owner dan guru harus 100%')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/revenue-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: editing.id,
          biayaPerSiswa: Number(editBiaya),
          ...(editBranchTeacherId
            ? {
                branchTeacherId: editBranchTeacherId,
                persentaseOwner: Number(editPersentaseOwner),
                persentaseGuru: Number(editPersentaseGuru),
              }
            : {}),
        }),
      })

      const data = await res.json()

      if (res.ok && data.student) {
        setStudents((prev) =>
          prev.map((s) =>
            s.id === editing.id ? { ...s, ...data.student } : s
          )
        )
        setMessage('Berhasil disimpan!')
        setTimeout(() => closeEdit(), 1000)
      } else {
        setMessage(data.error || 'Gagal menyimpan')
      }
    } catch {
      setMessage('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency', currency: 'IDR',
      minimumFractionDigits: 0, maximumFractionDigits: 0,
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500 text-sm">Memuat data...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pengaturan Bagi Hasil</h1>
        <p className="text-sm text-gray-500 mt-1">Atur biaya per siswa dan persentase bagi hasil per guru</p>
      </div>

      {students.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Belum ada siswa yang terdaftar.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama Siswa</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cabang</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Biaya/Siswa</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Owner</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Guru</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{student.cabangDaerah || '-'}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">
                      {student.branchTeachers.length > 0
                        ? student.branchTeachers.map((bt) => bt.user.name).join(', ')
                        : '-'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{formatRupiah(student.biayaPerSiswa)}</td>
                    <td className="px-5 py-3.5 text-sm text-blue-600 font-medium">
                      {student.branchTeachers.length > 0 ? `${student.branchTeachers[0].persentaseOwner}%` : '40%'}
                    </td>
                    <td className="px-5 py-3.5 text-sm text-green-600 font-medium">
                      {student.branchTeachers.length > 0 ? `${student.branchTeachers[0].persentaseGuru}%` : '60%'}
                    </td>
                    <td className="px-5 py-3.5">
                      <button onClick={() => openEdit(student)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">Edit Bagi Hasil - {editing.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{editing.cabangDaerah || 'Belum ada cabang'}</p>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Biaya Per Siswa (Rp)</label>
                <input
                  type="number" value={editBiaya}
                  onChange={(e) => setEditBiaya(Number(e.target.value))}
                  min={0}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                />
              </div>

              {editing.branchTeachers.length > 0 && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Guru / Mata Pelajaran</label>
                    <select
                      value={editBranchTeacherId}
                      onChange={(e) => handleBranchTeacherChange(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                    >
                      {editing.branchTeachers.map((bt) => (
                        <option key={bt.id} value={bt.id}>
                          {bt.user.name} - {bt.mataPelajaran}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Persentase Owner (%)</label>
                      <input
                        type="number"
                        value={editPersentaseOwner}
                        onChange={(e) => setEditPersentaseOwner(Number(e.target.value))}
                        min={1}
                        max={99}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Persentase Guru (%)</label>
                      <input
                        type="number"
                        value={editPersentaseGuru}
                        onChange={(e) => setEditPersentaseGuru(Number(e.target.value))}
                        min={1}
                        max={99}
                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Contoh Perhitungan:</h4>
                    <p className="text-sm text-gray-600">1 siswa x {formatRupiah(editBiaya)} = {formatRupiah(editBiaya)}</p>
                    <p className="text-sm text-blue-600">
                      Owner: {formatRupiah(Math.floor((editBiaya * editPersentaseOwner) / 100))} ({editPersentaseOwner}%)
                    </p>
                    <p className="text-sm text-green-600">
                      Guru: {formatRupiah(Math.floor((editBiaya * editPersentaseGuru) / 100))} ({editPersentaseGuru}%)
                    </p>
                    <p className={`text-xs mt-2 ${editPersentaseOwner + editPersentaseGuru === 100 ? 'text-gray-500' : 'text-red-600'}`}>
                      Total persentase: {editPersentaseOwner + editPersentaseGuru}%
                    </p>
                  </div>
                </>
              )}

              {editing.branchTeachers.length === 0 && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100">
                  <p className="text-sm text-yellow-700">Siswa ini belum memiliki guru cabang, jadi hanya biaya per siswa yang bisa diubah.</p>
                </div>
              )}

              {message && (
                <div className={`text-sm font-medium ${message.includes('Berhasil') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={closeEdit} className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
