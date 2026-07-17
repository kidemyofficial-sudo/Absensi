'use client'

import { useState, useEffect } from 'react'
import { provinsiList, kotaKabupatenByProvinsi, type Provinsi } from '@/data/indonesia'

interface Teacher {
  id: string
  name: string
  phone: string
}

interface BranchTeacher {
  id: string
  cabangDaerah: string
  provinsi: string
  kotaKabupaten: string
  mataPelajaran: string
  user: Teacher
  student: { id: string; name: string }[]
}

export default function CabangDaerahPage() {
  const [branchTeachers, setBranchTeachers] = useState<BranchTeacher[]>([])
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    provinsi: '',
    kotaKabupaten: '',
    teacherId: '',
    mataPelajaran: '',
  })
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [expandedCabang, setExpandedCabang] = useState<string | null>(null)
  const [expandedGuru, setExpandedGuru] = useState<string | null>(null)

  const kotaList = formData.provinsi
    ? kotaKabupatenByProvinsi[formData.provinsi as Provinsi] || []
    : []

  const mataPelajaranList = [
    'Matematika',
    'Bahasa Indonesia',
    'Bahasa Inggris',
    'IPA',
    'IPS',
    'PPKN',
    'Seni Budaya',
    'Penjaskes',
    'Prakarya',
    'Komputer',
    'Pendidikan Agama',
    'Sejarah',
    'Geografi',
    'Ekonomi',
    'Sosiologi',
    'Fisika',
    'Kimia',
    'Biologi',
  ]

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchData()
  }, [search])

  const fetchData = async () => {
    setLoading(true)
    const [btRes, tRes] = await Promise.all([
      fetch('/api/branch-teachers'),
      fetch('/api/users?role=GURU'),
    ])
    const btData = await btRes.json()
    const tData = await tRes.json()
    setBranchTeachers(btData.branchTeachers || [])
    setTeachers(tData.users || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setMessage('')

    const cabangDaerah = `${formData.kotaKabupaten}, ${formData.provinsi}`

    try {
      const res = await fetch('/api/branch-teachers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cabangDaerah,
          provinsi: formData.provinsi,
          kotaKabupaten: formData.kotaKabupaten,
          teacherId: formData.teacherId,
          mataPelajaran: formData.mataPelajaran,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Gagal tambah cabang daerah')
      }

      setMessage('Cabang Daerah berhasil ditambahkan!')
      setFormData({ provinsi: '', kotaKabupaten: '', teacherId: '', mataPelajaran: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus mapping cabang daerah ini?')) return

    try {
      const res = await fetch(`/api/branch-teachers/${id}`, { method: 'DELETE' })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal hapus')
      }

      fetchData()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    }
  }

  // Group by cabangDaerah
  const groupedByCabang = branchTeachers.reduce((acc, bt) => {
    if (!acc[bt.cabangDaerah]) {
      acc[bt.cabangDaerah] = []
    }
    acc[bt.cabangDaerah].push(bt)
    return acc
  }, {} as Record<string, BranchTeacher[]>)

  // Filter by search
  const filteredCabangs = Object.entries(groupedByCabang).filter(([cabangDaerah, bts]) =>
    cabangDaerah.toLowerCase().includes(search.toLowerCase()) ||
    bts.some(bt => bt.provinsi.toLowerCase().includes(search.toLowerCase()) ||
      bt.kotaKabupaten.toLowerCase().includes(search.toLowerCase()) ||
      bt.user.name.toLowerCase().includes(search.toLowerCase()) ||
      bt.mataPelajaran.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Kelola Cabang Daerah</h2>
        <button
          onClick={() => {
            setShowForm(!showForm)
            setFormData({ provinsi: '', kotaKabupaten: '', teacherId: '', mataPelajaran: '' })
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {showForm ? 'Batal' : 'Tambah Cabang Daerah'}
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

      {/* Form Tambah Cabang Daerah */}
      {showForm && (
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Tambah Cabang Daerah Baru</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provinsi</label>
                <select
                  value={formData.provinsi}
                  onChange={(e) => setFormData({ ...formData, provinsi: e.target.value, kotaKabupaten: '' })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Pilih Provinsi</option>
                  {provinsiList.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kota / Kabupaten</label>
                <select
                  value={formData.kotaKabupaten}
                  onChange={(e) => setFormData({ ...formData, kotaKabupaten: e.target.value })}
                  required
                  disabled={!formData.provinsi}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black disabled:bg-gray-100"
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {kotaList.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </select>
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
                <select
                  value={formData.mataPelajaran}
                  onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {mataPelajaranList.map((mp) => (
                    <option key={mp} value={mp}>{mp}</option>
                  ))}
                </select>
              </div>
            </div>
            {formData.kotaKabupaten && formData.provinsi && (
              <p className="text-sm text-gray-500 mb-4">
                Cabang Daerah: <span className="font-medium text-black">{formData.kotaKabupaten}, {formData.provinsi}</span>
              </p>
            )}
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
          placeholder="Cari nama cabang, guru, mata pelajaran..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-black"
        />
      </div>

      {/* Daftar Cabang Daerah */}
      <div className="space-y-4">
        {loading ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">Loading...</div>
        ) : filteredCabangs.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">Tidak ada cabang daerah ditemukan</div>
        ) : (
          filteredCabangs.map(([cabangDaerah, bts]) => {
            const totalMurid = bts.reduce((sum, bt) => sum + bt.student.length, 0)
            const isExpanded = expandedCabang === cabangDaerah

            return (
              <div key={cabangDaerah} className="bg-white rounded-lg shadow-sm">
                {/* Level 1 - Cabang Daerah Card */}
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => {
                    setExpandedCabang(isExpanded ? null : cabangDaerah)
                    setExpandedGuru(null)
                  }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-lg font-medium text-black">{cabangDaerah}</h4>
                      <p className="text-sm text-gray-500">{bts[0]?.provinsi} — {bts[0]?.kotaKabupaten}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">{bts.length} guru</p>
                        <p className="text-sm text-gray-600">{totalMurid} murid</p>
                      </div>
                      <span className={`text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </div>
                  </div>
                </div>

                {/* Level 2 - Daftar Guru */}
                {isExpanded && (
                  <div className="border-t border-gray-200 p-4">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">Daftar Guru</h5>
                    <div className="space-y-2">
                      {bts.map((bt) => {
                        const isGuruExpanded = expandedGuru === bt.id

                        return (
                          <div key={bt.id} className="bg-gray-50 rounded-lg">
                            {/* Guru Card */}
                            <div
                              className="p-3 cursor-pointer hover:bg-gray-100 transition-colors rounded-lg"
                              onClick={() => setExpandedGuru(isGuruExpanded ? null : bt.id)}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <span className="text-gray-400 text-sm">▶</span>
                                  <div>
                                    <p className="font-medium text-black">{bt.user.name}</p>
                                    <p className="text-sm text-gray-500">{bt.mataPelajaran}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-sm text-gray-600">{bt.student.length} siswa</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleDelete(bt.id)
                                    }}
                                    className="text-red-600 hover:text-red-900 text-sm"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Level 3 - Daftar Siswa */}
                            {isGuruExpanded && (
                              <div className="px-3 pb-3">
                                <div className="bg-white rounded-lg p-3">
                                  <p className="text-xs text-gray-500 mb-2">
                                    Mata Pelajaran: <span className="font-medium text-black">{bt.mataPelajaran}</span>
                                  </p>
                                  {bt.student.length === 0 ? (
                                    <p className="text-sm text-gray-400 italic">Belum ada siswa terdaftar</p>
                                  ) : (
                                    <ul className="space-y-1">
                                      {bt.student.map((s) => (
                                        <li key={s.id} className="flex items-center gap-2 text-sm text-black">
                                          <span className="text-gray-300">•</span>
                                          {s.name}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
