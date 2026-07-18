'use client'

import { useState, useEffect } from 'react'

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
    persentaseOwner: number
    persentaseGuru: number
    user: { name: string }
  }[]
}

export default function PengaturanBagiHasilPage() {
  const [students, setStudents] = useState<StudentRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<StudentRevenue | null>(null)
  const [editBiaya, setEditBiaya] = useState(50000)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
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
  }

  const openEdit = (student: StudentRevenue) => {
    setEditing(student)
    setEditBiaya(student.biayaPerSiswa)
    setMessage('')
  }

  const closeEdit = () => {
    setEditing(null)
    setMessage('')
  }

  const handleSave = async () => {
    if (!editing) return
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/revenue-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: editing.id,
          biayaPerSiswa: Number(editBiaya),
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
              <h3 className="text-base font-semibold text-gray-900">Edit Biaya — {editing.name}</h3>
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
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Contoh Perhitungan:</h4>
                  <p className="text-sm text-gray-600">1 siswa × {formatRupiah(editBiaya)} = {formatRupiah(editBiaya)}</p>
                  <p className="text-sm text-blue-600">
                    Owner: {formatRupiah(Math.floor((editBiaya * editing.branchTeachers[0].persentaseOwner) / 100))} ({editing.branchTeachers[0].persentaseOwner}%)
                  </p>
                  <p className="text-sm text-green-600">
                    Guru: {formatRupiah(Math.floor((editBiaya * editing.branchTeachers[0].persentaseGuru) / 100))} ({editing.branchTeachers[0].persentaseGuru}%)
                  </p>
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
