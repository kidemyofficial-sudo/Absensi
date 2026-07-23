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
    nominalOwner: number | null
    nominalGuru: number | null
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
  const [editNominalOwner, setEditNominalOwner] = useState(20000)
  const [editNominalGuru, setEditNominalGuru] = useState(30000)
  const [applyToExisting, setApplyToExisting] = useState(false)
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
    const biaya = student.biayaPerSiswa
    const ownerNominal = branchTeacher?.nominalOwner ?? Math.round(biaya * 0.4)
    const guruNominal = branchTeacher?.nominalGuru ?? (biaya - ownerNominal)

    setEditing(student)
    setEditBranchTeacherId(branchTeacher?.id ?? '')
    setEditBiaya(biaya)
    setEditNominalOwner(ownerNominal)
    setEditNominalGuru(guruNominal)
    setApplyToExisting(false)
    setMessage('')
  }

  const closeEdit = () => {
    setEditing(null)
    setEditBranchTeacherId('')
    setApplyToExisting(false)
    setMessage('')
  }

  const handleBranchTeacherChange = (branchTeacherId: string) => {
    const branchTeacher = editing?.branchTeachers.find((bt) => bt.id === branchTeacherId)
    const ownerNominal = branchTeacher?.nominalOwner ?? Math.round(editBiaya * 0.4)
    const guruNominal = branchTeacher?.nominalGuru ?? (editBiaya - ownerNominal)

    setEditBranchTeacherId(branchTeacherId)
    setEditNominalOwner(ownerNominal)
    setEditNominalGuru(guruNominal)
  }

  const handleBiayaChange = (val: number) => {
    setEditBiaya(val)
    // Otomatis sesuaikan Nominal Guru agar total pas
    setEditNominalGuru(Math.max(0, val - editNominalOwner))
  }

  const handleNominalOwnerChange = (val: number) => {
    setEditNominalOwner(val)
    // Otomatis sesuaikan Nominal Guru
    setEditNominalGuru(Math.max(0, editBiaya - val))
  }

  const handleNominalGuruChange = (val: number) => {
    setEditNominalGuru(val)
    // Otomatis sesuaikan Nominal Owner
    setEditNominalOwner(Math.max(0, editBiaya - val))
  }

  // Validasi nominal rupiah asli (Owner + Guru = Total Biaya)
  const nominalTotal = editNominalOwner + editNominalGuru
  const isNominalValid = nominalTotal === editBiaya && editNominalOwner >= 0 && editNominalGuru >= 0

  const handleSave = async () => {
    if (!editing) return

    if (!isNominalValid) {
      setMessage(
        `Pembagian tidak valid: Rp${editNominalOwner.toLocaleString('id-ID')} + Rp${editNominalGuru.toLocaleString('id-ID')} = Rp${nominalTotal.toLocaleString('id-ID')} ≠ Rp${editBiaya.toLocaleString('id-ID')}. Total nominal owner dan guru harus sama dengan biaya per siswa.`
      )
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
          applyToExisting,
          ...(editBranchTeacherId
            ? {
                branchTeacherId: editBranchTeacherId,
                nominalOwner: Number(editNominalOwner),
                nominalGuru: Number(editNominalGuru),
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
        const updatedMsg = applyToExisting && data.updatedCount > 0
          ? ` (${data.updatedCount} laporan absensi lama diperbarui)`
          : ' (hanya berlaku untuk laporan absensi berikutnya)'
        setMessage('Berhasil disimpan!' + updatedMsg)
        setTimeout(() => closeEdit(), 1500)
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
        <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Atur biaya per siswa dan nominal bagi hasil per sesi (dalam Rupiah)</p>
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
                  <th>Total Biaya/Sesi</th>
                  <th>Nominal Owner</th>
                  <th>Nominal Guru</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const bt = student.branchTeachers[0]
                  const ownerNom = bt?.nominalOwner ?? Math.round(student.biayaPerSiswa * 0.4)
                  const guruNom = bt?.nominalGuru ?? (student.biayaPerSiswa - ownerNom)

                  return (
                    <tr key={student.id}>
                      <td className="font-bold" style={{ color: '#1e1b4b' }}>{student.name}</td>
                      <td style={{ color: '#4b5563' }}>{student.cabangDaerah || '-'}</td>
                      <td style={{ color: '#4b5563' }}>
                        {student.branchTeachers.length > 0
                          ? student.branchTeachers.map((b) => b.user.name).join(', ')
                          : '-'}
                      </td>
                      <td className="font-bold" style={{ color: '#4b5563' }}>{formatRupiah(student.biayaPerSiswa)}</td>
                      <td className="font-bold" style={{ color: '#6366f1' }}>
                        {student.branchTeachers.length > 0 ? formatRupiah(ownerNom) : formatRupiah(Math.round(student.biayaPerSiswa * 0.4))}
                      </td>
                      <td className="font-bold" style={{ color: '#10b981' }}>
                        {student.branchTeachers.length > 0 ? formatRupiah(guruNom) : formatRupiah(Math.round(student.biayaPerSiswa * 0.6))}
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
                  )
                })}
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
          <div className="glass-modal w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(229,231,235,0.4)' }}>
              <h3 className="text-base font-bold" style={{ color: '#1e1b4b' }}>Edit Bagi Hasil (Rupiah)</h3>
              <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>Siswa: <strong style={{ color: '#1e1b4b' }}>{editing.name}</strong> • {editing.cabangDaerah || 'Belum ada cabang'}</p>
            </div>
            <div className="px-6 py-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Total Biaya Per Siswa per Sesi (Rp)</label>
                <input
                  type="number"
                  value={editBiaya}
                  onChange={(e) => handleBiayaChange(Number(e.target.value))}
                  min={0}
                  step={1000}
                  className="glass-input font-bold"
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
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6366f1' }}>Nominal Owner (Rp)</label>
                      <input
                        type="number"
                        value={editNominalOwner}
                        onChange={(e) => handleNominalOwnerChange(Number(e.target.value))}
                        min={0}
                        step={1000}
                        className="glass-input font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold mb-1.5" style={{ color: '#10b981' }}>Nominal Guru (Rp)</label>
                      <input
                        type="number"
                        value={editNominalGuru}
                        onChange={(e) => handleNominalGuruChange(Number(e.target.value))}
                        min={0}
                        step={1000}
                        className="glass-input font-bold"
                      />
                    </div>
                  </div>

                  {/* Validasi Nominal Rupiah */}
                  <div className="p-4 rounded-xl border border-white/50 space-y-2" style={{ background: 'rgba(255,255,255,0.6)' }}>
                    <h4 className="text-xs font-bold" style={{ color: '#1e1b4b' }}>Validasi Pembagian Nominal:</h4>
                    <p className="text-xs" style={{ color: '#4b5563' }}>
                      Total Biaya: <strong>{formatRupiah(editBiaya)}</strong>
                    </p>

                    <div className="flex gap-2 text-xs pt-0.5">
                      <span style={{ color: '#6366f1' }}>
                        Owner: <strong>{formatRupiah(editNominalOwner)}</strong>
                      </span>
                      <span style={{ color: '#9ca3af' }}>+</span>
                      <span style={{ color: '#10b981' }}>
                        Guru: <strong>{formatRupiah(editNominalGuru)}</strong>
                      </span>
                    </div>

                    <div
                      className="flex items-start gap-2 mt-1 p-2.5 rounded-lg text-[11px] font-bold"
                      style={{
                        background: isNominalValid ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                        color: isNominalValid ? '#065f46' : '#991b1b',
                        border: `1px solid ${isNominalValid ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
                      }}
                    >
                      <span className="text-sm">{isNominalValid ? '✅' : '❌'}</span>
                      <div className="space-y-0.5">
                        <p>
                          {formatRupiah(editNominalOwner)} + {formatRupiah(editNominalGuru)} = {formatRupiah(nominalTotal)}
                        </p>
                        <p className="font-normal text-[10px]">
                          {isNominalValid
                            ? `Sesuai dengan total biaya ${formatRupiah(editBiaya)} ✓`
                            : `Harus sama dengan total biaya ${formatRupiah(editBiaya)} (selisih ${formatRupiah(Math.abs(editBiaya - nominalTotal))})`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option: Apply to existing reports */}
                  <div className="p-4 rounded-xl border border-white/50 space-y-2" style={{ background: 'rgba(255,255,255,0.5)' }}>
                    <h4 className="text-xs font-bold" style={{ color: '#1e1b4b' }}>Penerapan Perubahan:</h4>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={applyToExisting}
                        onChange={(e) => setApplyToExisting(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded cursor-pointer accent-indigo-600"
                      />
                      <div>
                        <p className="text-xs font-semibold" style={{ color: '#374151' }}>
                          Perbarui juga laporan absensi guru yang sudah ada sebelumnya
                        </p>
                        <p className="text-[10px] mt-0.5" style={{ color: '#6b7280' }}>
                          Jika dicentang, seluruh laporan les siswa ini yang pernah di-input akan dihitung ulang dengan nominal baru.
                          Jika tidak dicentang, pembagian baru hanya berlaku untuk absensi les berikutnya.
                        </p>
                      </div>
                    </label>
                    {applyToExisting && (
                      <div className="px-3 py-2 rounded-lg text-[10px] font-bold" style={{ background: 'rgba(245,158,11,0.1)', color: '#92400e', border: '1px solid rgba(245,158,11,0.2)' }}>
                        ⚠️ Perhatian: Laporan yang sudah ada akan dihitung ulang dengan nominal baru.
                      </div>
                    )}
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
            <div className="px-6 py-4 flex justify-end gap-3 shrink-0" style={{ borderTop: '1px solid rgba(229,231,235,0.4)', background: 'rgba(255,255,255,0.3)' }}>
              <button onClick={closeEdit} className="btn-secondary">Batal</button>
              <button onClick={handleSave} disabled={saving || !isNominalValid} className="btn-primary" style={{ opacity: (!isNominalValid || saving) ? 0.6 : 1 }}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}

