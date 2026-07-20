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
      <div className="glass-card p-8 text-center text-sm" style={{ color: '#9ca3af' }}>
        Loading...
      </div>
    )
  }

  const isSuccess = message.includes('Berhasil')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Pengaturan Bagi Hasil</h1>
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Atur biaya per siswa dan persentase bagi hasil per guru</p>
      </div>

      {students.length === 0 ? (
        <div className="glass-card p-6">
          <p className="text-sm" style={{ color: '#9ca3af' }}>Belum ada siswa yang terdaftar.</p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="glass-table w-full">
              <thead>
                <tr>
                  <th>Nama Siswa</th>
                  <th>Cabang</th>
                  <th>Guru</th>
                  <th>Biaya/Siswa</th>
                  <th>% Owner</th>
                  <th>% Guru</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <td className="font-bold" style={{ color: '#1e1b4b' }}>{student.name}</td>
                    <td style={{ color: '#4b5563' }}>{student.cabangDaerah || '-'}</td>
                    <td style={{ color: '#4b5563' }}>
                      {student.branchTeachers.length > 0
                        ? student.branchTeachers.map((bt) => bt.user.name).join(', ')
                        : '-'}
                    </td>
                    <td style={{ color: '#4b5563' }}>{formatRupiah(student.biayaPerSiswa)}</td>
                    <td className="font-bold" style={{ color: '#6366f1' }}>
                      {student.branchTeachers.length > 0 ? `${student.branchTeachers[0].persentaseOwner}%` : '40%'}
                    </td>
                    <td className="font-bold" style={{ color: '#10b981' }}>
                      {student.branchTeachers.length > 0 ? `${student.branchTeachers[0].persentaseGuru}%` : '60%'}
                    </td>
                    <td>
                      <button
                        onClick={() => openEdit(student)}
                        className="px-3 py-1.5 rounded-lg font-bold text-xs bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 transition-colors"
                      >
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,10,40,0.45)', backdropFilter: 'blur(6px)' }}
        >
          <div className="glass-modal w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4.5" style={{ borderBottom: '1px solid rgba(229,231,235,0.4)' }}>
              <h3 className="text-base font-bold" style={{ color: '#1e1b4b' }}>Edit Bagi Hasil</h3>
              <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Siswa: <strong style={{ color: '#1e1b4b' }}>{editing.name}</strong> • {editing.cabangDaerah || 'Belum ada cabang'}</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Biaya Per Siswa (Rp)</label>
                <input
                  type="number"
                  value={editBiaya}
                  onChange={(e) => setEditBiaya(Number(e.target.value))}
                  min={0}
                  className="glass-input"
                />
              </div>

              {editing.branchTeachers.length > 0 && (
                <>
                  <div>
                    <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Guru / Mata Pelajaran</label>
                    <select
                      value={editBranchTeacherId}
                      onChange={(e) => handleBranchTeacherChange(e.target.value)}
                      className="glass-input"
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Persentase Owner (%)</label>
                      <input
                        type="number"
                        value={editPersentaseOwner}
                        onChange={(e) => setEditPersentaseOwner(Number(e.target.value))}
                        min={1}
                        max={99}
                        className="glass-input"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Persentase Guru (%)</label>
                      <input
                        type="number"
                        value={editPersentaseGuru}
                        onChange={(e) => setEditPersentaseGuru(Number(e.target.value))}
                        min={1}
                        max={99}
                        className="glass-input"
                      />
                    </div>
                  </div>

                  {/* Calculations breakdown - solid background for neat readability */}
                  <div className="p-4 rounded-xl border border-white/50 space-y-1" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <h4 className="text-xs font-bold" style={{ color: '#1e1b4b' }}>Simulasi Perhitungan Pendapatan:</h4>
                    <p className="text-xs" style={{ color: '#4b5563' }}>1 sesi les x {formatRupiah(editBiaya)} = {formatRupiah(editBiaya)}</p>
                    <p className="text-xs font-bold" style={{ color: '#6366f1' }}>
                      Bagian Owner: {formatRupiah(Math.floor((editBiaya * editPersentaseOwner) / 100))} ({editPersentaseOwner}%)
                    </p>
                    <p className="text-xs font-bold" style={{ color: '#10b981' }}>
                      Bagian Guru: {formatRupiah(Math.floor((editBiaya * editPersentaseGuru) / 100))} ({editPersentaseGuru}%)
                    </p>
                    <p className={`text-[10px] font-bold mt-2 ${editPersentaseOwner + editPersentaseGuru === 100 ? 'text-gray-400' : 'text-rose-600'}`}>
                      Total akumulasi persentase: {editPersentaseOwner + editPersentaseGuru}%
                    </p>
                  </div>
                </>
              )}

              {editing.branchTeachers.length === 0 && (
                <div className="p-4 rounded-xl border border-amber-100" style={{ background: 'rgba(245,158,11,0.08)', color: '#92400e' }}>
                  <p className="text-xs">Siswa ini belum memiliki guru cabang, jadi hanya biaya per siswa yang bisa diubah.</p>
                </div>
              )}

              {message && (
                <div
                  className="p-3 rounded-xl text-xs font-bold border"
                  style={{
                    background: isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
                    color: isSuccess ? '#065f46' : '#991b1b',
                    borderColor: isSuccess ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)',
                  }}
                >
                  {message}
                </div>
              )}
            </div>
            <div className="px-6 py-4 flex justify-end gap-3" style={{ borderTop: '1px solid rgba(229,231,235,0.4)', background: 'rgba(255,255,255,0.3)' }}>
              <button onClick={closeEdit} className="btn-secondary">Batal</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
