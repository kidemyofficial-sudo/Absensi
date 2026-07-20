'use client'

import { useState, useEffect, useCallback } from 'react'
import { provinsiList, kotaKabupatenByProvinsi, type Provinsi } from '@/data/indonesia'
import ConfirmDialog from '@/components/ConfirmDialog'

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
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

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

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirmId) return
    setDeleteConfirmId(null)
    try {
      const res = await fetch(`/api/branch-teachers/${deleteConfirmId}`, { method: 'DELETE' })
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

  const isSuccess = message.includes('berhasil')

  return (
    <div>
      <ConfirmDialog
        isOpen={!!deleteConfirmId}
        title="Hapus Mapping Cabang Daerah"
        message="Yakin ingin menghapus mapping cabang daerah ini? Siswa yang terdaftar tidak akan ikut terhapus."
        confirmText="Ya, Hapus"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirmId(null)}
      />
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Cabang Daerah</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Kelola cabang daerah dan guru pengampu</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormData({ provinsi: '', kotaKabupaten: '', teacherId: '', mataPelajaran: '' }) }}
          className="btn-primary"
        >
          {showForm ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Batal
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Tambah Cabang
            </>
          )}
        </button>
      </div>

      {message && (
        <div
          className="mb-5 p-3.5 rounded-xl text-sm font-medium"
          style={{
            background: isSuccess ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)',
            color: isSuccess ? '#065f46' : '#991b1b',
            border: `1px solid ${isSuccess ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}
        >
          {message}
        </div>
      )}

      {showForm && (
        <div className="glass-card p-6 mb-6">
          <h3 className="text-base font-bold mb-4" style={{ color: '#1e1b4b' }}>Tambah Cabang Daerah Baru</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Provinsi</label>
                <select
                  value={formData.provinsi}
                  onChange={(e) => setFormData({ ...formData, provinsi: e.target.value, kotaKabupaten: '' })}
                  required
                  className="glass-input"
                >
                  <option value="">Pilih Provinsi</option>
                  {provinsiList.map((p) => (<option key={p} value={p}>{p}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Kota / Kabupaten</label>
                <select
                  value={formData.kotaKabupaten}
                  onChange={(e) => setFormData({ ...formData, kotaKabupaten: e.target.value })}
                  required
                  disabled={!formData.provinsi}
                  className="glass-input"
                  style={!formData.provinsi ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                >
                  <option value="">Pilih Kota/Kabupaten</option>
                  {kotaList.map((k) => (<option key={k} value={k}>{k}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Guru Pengampu</label>
                <select
                  value={formData.teacherId}
                  onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                  required
                  className="glass-input"
                >
                  <option value="">Pilih Guru</option>
                  {teachers.map((t) => (<option key={t.id} value={t.id}>{t.name}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: '#4b5563' }}>Mata Pelajaran</label>
                <select
                  value={formData.mataPelajaran}
                  onChange={(e) => setFormData({ ...formData, mataPelajaran: e.target.value })}
                  required
                  className="glass-input"
                >
                  <option value="">Pilih Mata Pelajaran</option>
                  {mataPelajaranList.map((mp) => (<option key={mp} value={mp}>{mp}</option>))}
                </select>
              </div>
            </div>
            {formData.kotaKabupaten && formData.provinsi && (
              <p className="text-xs mb-4" style={{ color: '#9ca3af' }}>
                Cabang Daerah: <span className="font-semibold" style={{ color: '#1e1b4b' }}>{formData.kotaKabupaten}, {formData.provinsi}</span>
              </p>
            )}
            <button type="submit" className="btn-primary" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.25)' }}>
              Simpan
            </button>
          </form>
        </div>
      )}

      <div className="glass-card p-4 mb-6">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Cari nama cabang, guru, mata pelajaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input pl-9"
          />
        </div>
      </div>

      <div className="space-y-3.5">
        {loading ? (
          <div className="glass-card p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Loading...</div>
        ) : filteredCabangs.length === 0 ? (
          <div className="glass-card p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Tidak ada cabang daerah ditemukan</div>
        ) : (
          filteredCabangs.map(([cabangDaerah, bts]) => {
            const totalMurid = bts.reduce((sum, bt) => sum + bt.student.length, 0)
            const isExpanded = expandedCabang === cabangDaerah

            return (
              <div key={cabangDaerah} className="glass-card overflow-hidden">
                <div
                  className="p-4 cursor-pointer hover:bg-white/40 transition-colors"
                  onClick={() => { setExpandedCabang(isExpanded ? null : cabangDaerah); setExpandedGuru(null) }}
                >
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h4 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>{cabangDaerah}</h4>
                      <p className="text-xs" style={{ color: '#6b7280' }}>{bts[0]?.provinsi} - {bts[0]?.kotaKabupaten}</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg mr-1.5" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                          {bts.length} guru
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                          {totalMurid} murid
                        </span>
                      </div>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="#9ca3af" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 space-y-3" style={{ borderTop: '1px solid rgba(229,231,235,0.4)', background: 'rgba(255,255,255,0.2)' }}>
                    <h5 className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#9ca3af' }}>Daftar Guru Pengampu</h5>
                    <div className="grid grid-cols-1 gap-2.5">
                      {bts.map((bt) => {
                        const isGuruExpanded = expandedGuru === bt.id
                        return (
                          <div key={bt.id} className="rounded-xl overflow-hidden border border-white/40" style={{ background: 'rgba(255,255,255,0.5)' }}>
                            <div
                              className="p-3 cursor-pointer hover:bg-white/60 transition-colors"
                              onClick={() => setExpandedGuru(isGuruExpanded ? null : bt.id)}
                            >
                              <div className="flex justify-between items-center flex-wrap gap-2">
                                <div className="flex items-center gap-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" className={`w-3.5 h-3.5 transition-transform ${isGuruExpanded ? 'rotate-90' : ''}`} fill="currentColor" viewBox="0 0 24 24" style={{ color: '#9ca3af' }}>
                                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z" />
                                  </svg>
                                  <div>
                                    <p className="text-sm font-semibold" style={{ color: '#1e1b4b' }}>{bt.user.name}</p>
                                    <p className="text-xs" style={{ color: '#6b7280' }}>{bt.mataPelajaran}</p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className="text-[10px] font-semibold bg-white border border-white/50 px-2 py-0.5 rounded-lg" style={{ color: '#4b5563' }}>
                                    {bt.student.length} siswa
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setDeleteConfirmId(bt.id) }}
                                    className="px-2 py-1 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-xs transition-colors"
                                  >
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            </div>
                            {isGuruExpanded && (
                              <div className="px-3 pb-3" style={{ background: 'rgba(255,255,255,0.2)' }}>
                                <div className="bg-white/80 backdrop-blur-sm border border-white/50 rounded-xl p-3.5 mt-1">
                                  <p className="text-xs mb-2" style={{ color: '#6b7280' }}>
                                    Mata Pelajaran: <span className="font-semibold" style={{ color: '#1e1b4b' }}>{bt.mataPelajaran}</span>
                                  </p>
                                  {bt.student.length === 0 ? (
                                    <p className="text-xs italic" style={{ color: '#9ca3af' }}>Belum ada siswa terdaftar</p>
                                  ) : (
                                    <div>
                                      <p className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: '#9ca3af' }}>Siswa Terdaftar:</p>
                                      <ul className="space-y-1">
                                        {bt.student.map((s) => (
                                          <li key={s.id} className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#374151' }}>
                                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: '#6366f1' }} />
                                            {s.name}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
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
