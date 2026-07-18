'use client'

import { useState, useEffect } from 'react'

interface BranchTeacherRevenue {
  id: string
  userId: string
  cabangDaerah: string
  provinsi: string
  kotaKabupaten: string
  mataPelajaran: string
  biayaPerSesi: number
  persentaseOwner: number
  persentaseGuru: number
  user: {
    id: string
    name: string
    phone: string
  }
}

export default function PengaturanBagiHasilPage() {
  const [branchTeachers, setBranchTeachers] = useState<BranchTeacherRevenue[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<BranchTeacherRevenue | null>(null)
  const [editBiaya, setEditBiaya] = useState(50000)
  const [editOwner, setEditOwner] = useState(40)
  const [editGuru, setEditGuru] = useState(60)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetchBranchTeachers()
  }, [])

  const fetchBranchTeachers = async () => {
    try {
      const res = await fetch('/api/revenue-settings')
      const data = await res.json()
      if (data.branchTeachers) {
        setBranchTeachers(data.branchTeachers)
      }
    } catch {
      console.error('Failed to fetch branch teachers')
    } finally {
      setLoading(false)
    }
  }

  const openEdit = (bt: BranchTeacherRevenue) => {
    setEditing(bt)
    setEditBiaya(bt.biayaPerSesi)
    setEditOwner(bt.persentaseOwner)
    setEditGuru(bt.persentaseGuru)
    setMessage('')
  }

  const closeEdit = () => {
    setEditing(null)
    setMessage('')
  }

  const handleOwnerChange = (value: number) => {
    setEditOwner(value)
    setEditGuru(100 - value)
  }

  const handleGuruChange = (value: number) => {
    setEditGuru(value)
    setEditOwner(100 - value)
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
          branchTeacherId: editing.id,
          biayaPerSesi: Number(editBiaya),
          persentaseOwner: Number(editOwner),
          persentaseGuru: Number(editGuru),
        }),
      })

      const data = await res.json()

      if (res.ok && data.branchTeacher) {
        setBranchTeachers((prev) =>
          prev.map((bt) =>
            bt.id === editing.id ? { ...bt, ...data.branchTeacher } : bt
          )
        )
        setMessage('Berhasil disimpan!')
        setTimeout(() => {
          closeEdit()
        }, 1000)
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
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Preview calculation
  const previewMurid = 3
  const previewBiayaTotal = previewMurid * editBiaya
  const previewOwner = Math.floor((previewBiayaTotal * editOwner) / 100)
  const previewGuru = Math.floor((previewBiayaTotal * editGuru) / 100)

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

      {branchTeachers.length === 0 ? (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500">Belum ada data guru yang terdaftar di cabang daerah.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cabang</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mata Pelajaran</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Biaya/Siswa</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Owner</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">% Guru</th>
                  <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {branchTeachers.map((bt) => (
                  <tr key={bt.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5 text-sm text-gray-900 font-medium">{bt.user.name}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{bt.cabangDaerah}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{bt.mataPelajaran}</td>
                    <td className="px-5 py-3.5 text-sm text-gray-600">{formatRupiah(bt.biayaPerSesi)}</td>
                    <td className="px-5 py-3.5 text-sm text-blue-600 font-medium">{bt.persentaseOwner}%</td>
                    <td className="px-5 py-3.5 text-sm text-green-600 font-medium">{bt.persentaseGuru}%</td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => openEdit(bt)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
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
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100">
              <h3 className="text-base font-semibold text-gray-900">
                Edit Bagi Hasil — {editing.user.name}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{editing.cabangDaerah} · {editing.mataPelajaran}</p>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Biaya Per Siswa (Rp)
                </label>
                <input
                  type="number"
                  value={editBiaya}
                  onChange={(e) => setEditBiaya(Number(e.target.value))}
                  min={0}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persentase Owner (%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={editOwner}
                    onChange={(e) => handleOwnerChange(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-lg font-bold text-blue-600 mt-1">
                    {editOwner}%
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Persentase Guru (%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={editGuru}
                    onChange={(e) => handleGuruChange(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-center text-lg font-bold text-green-600 mt-1">
                    {editGuru}%
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Contoh Perhitungan (per siswa):</h4>
                <p className="text-sm text-gray-600">
                  1 siswa × {formatRupiah(editBiaya)} = {formatRupiah(editBiaya)}
                </p>
                <p className="text-sm text-blue-600">
                  Owner: {formatRupiah(Math.floor((editBiaya * editOwner) / 100))} ({editOwner}%)
                </p>
                <p className="text-sm text-green-600">
                  Guru: {formatRupiah(Math.floor((editBiaya * editGuru) / 100))} ({editGuru}%)
                </p>
              </div>

              {message && (
                <div className={`text-sm font-medium ${message.includes('Berhasil') ? 'text-green-600' : 'text-red-600'}`}>
                  {message}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={closeEdit}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition-colors"
              >
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
