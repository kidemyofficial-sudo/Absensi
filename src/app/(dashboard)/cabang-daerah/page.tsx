'use client'

import { useState, useEffect, useCallback } from 'react'
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
    'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'IPA', 'IPS',
    'PPKN', 'Seni Budaya', 'Penjaskes', 'Prakarya', 'Komputer',
    'Pendidikan Agama', 'Sejarah', 'Geografi', 'Ekonomi', 'Sosiologi',
    'Fisika', 'Kimia', 'Biologi', 'Umum', 'Lainnya',
  ]

  const fetchData = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

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
      if (!res.ok) throw new Error(data.error || 'Gagal tambah cabang daerah')
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

  const groupedByCabang = branchTeachers.reduce((acc, bt) => {
    if (!acc[bt.cabangDaerah]) acc[bt.cabangDaerah] = []
    acc[bt.cabangDaerah].push(bt)
    return acc
  }, {} as Record<string, BranchTeacher[]>)

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
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cabang Daerah</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola cabang daerah dan guru pengampu</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormData({ provinsi: '', kotaKabupaten: '', teacherId: '', mataPelajaran: '' }) }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          {showForm ? 'Batal' : 'Tambah Cabang'}
        </button>
      </div>

      {message && (
        <div className={`mb-5 p-3.5 rounded-xl text-sm font-medium ${
          message.includes('berhasil')
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message}
        </div>
      )}

      {showForm && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Tambah Cabang Daerah Baru</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Provinsi</label>
                <select
                  value={formData.provinsi}
                  onChange={(e) => setFormData({ ...formData, provinsi: e.target.value, kotaKabupaten: '' })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                >
                  <option value="">Pilih Provinsi</option>
                  {provinsiList.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Kota / Kabupaten</label>
                <select
                  value={formData.kotaKabupaten}
                  onChange={(e) => setFormData({ ...formData, kotaKabupaten: e.target.value })}
                  required
                  disabled={!formData.provinsi}
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all disabled:bg-gray-50 disabled:text-gray-400"
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {kotaList.map((k) => (<option key={k} value={k}>{k}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Guru Pengampu</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                >
                  <option value="">Pilih Guru</option>
                  {teachers.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Mata Pelajaran</label>
                <select
                  value={formData.mataPelajaran}
                  onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                  required
                  className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {mataPelajaranList.map((mp) => (<option key={mp} value={mp}>{mp}</option>))}
                </select>
              </div>
            </div>
            {formData.kotaKabupaten && formData.provinsi && (
              <p className="text-sm text-gray-500 mb-4">
                Cabang Daerah: <span className="font-medium text-gray-900">{formData.kotaKabupaten}, {formData.provinsi}</span>
              </p>
            )}
            <button type="submit" className="bg-green-600 text-white px-5 py-2.5 rounded-xl hover:bg-green-700 text-sm font-medium transition-colors">
              Simpan
            </button>
          </form>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama cabang, guru, mata pelajaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
      </div>

      <div className="space-y-3">
        {loading ? (
          <div className="bg-white p-8 text-center text-gray-400 rounded-2xl border border-gray-100 shadow-sm text-sm">Loading...</div>
        ) : filteredCabangs.length === 0 ? (
          <div className="bg-white p-8 text-center text-gray-400 rounded-2xl border border-gray-100 shadow-sm text-sm">Tidak ada cabang daerah ditemukan</div>
        ) : (
          filteredCabangs.map(([cabangDaerah, bts]) => {
            const totalMurid = bts.reduce((sum, bt) => sum + bt.student.length, 0)
            const isExpanded = expandedCabang === cabangDaerah

            return (
              <div key={cabangDaerah} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => { setExpandedCabang(isExpanded ? null : cabangDaerah); setExpandedGuru(null) }}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{cabangDaerah}</h4>
                      <p className="text-xs text-gray-500 mt-0.5">{bts[0]?.provinsi} - {bts[0]?.kotaKabupaten}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{bts.length} guru</p>
                        <p className="text-xs text-gray-500">{totalMurid} murid</p>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-100 p-4">
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Daftar Guru</h5>
                    <div className="space-y-2">
                      {bts.map((bt) => {
                        const isGuruExpanded = expandedGuru === bt.id
                        return (
                          <div key={bt.id} className="bg-gray-50 rounded-xl overflow-hidden">
                            <div
                              className="p-3 cursor-pointer hover:bg-gray-100 transition-colors"
                              onClick={() => setExpandedGuru(isGuruExpanded ? null : bt.id)}
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-3 h-3 text-gray-400 transition-transform ${isGuruExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{bt.user.name}</p>
                                    <p className="text-xs text-gray-500">{bt.mataPelajaran}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded-lg">{bt.student.length} siswa</span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDelete(bt.id) }}
                                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            </div>
                            {isGuruExpanded && (
                              <div className="px-3 pb-3">
                                <div className="bg-white rounded-xl p-3">
                                  <p className="text-xs text-gray-500 mb-2">
                                    Mata Pelajaran: <span className="font-medium text-gray-900">{bt.mataPelajaran}</span>
                                  </p>
                                  {bt.student.length === 0 ? (
                                    <p className="text-xs text-gray-400 italic">Belum ada siswa terdaftar</p>
                                  ) : (
                                    <ul className="space-y-1">
                                      {bt.student.map((s) => (
                                        <li key={s.id} className="flex items-center gap-2 text-xs text-gray-700">
                                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
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
