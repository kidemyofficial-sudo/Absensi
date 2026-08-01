'use client'

import { useState, useEffect, useCallback } from 'react'
import ConfirmDialog from '@/components/ConfirmDialog'
import ReportsPrintButton from '@/components/ReportsPrintButton'
import WhatsAppReportButton from '@/components/WhatsAppReportButton'

interface UserInfo { id: string; name: string; phone: string; role: string }

interface Lesson {
  id: string; tanggalLes: string; namaGuru: string; whatsappGuru: string
  jenisPembelajaran: string; lokasiMengajar: string; kelasMurid: string | null
  jumlahMurid: number; namaMurid: string; catatanMateri: string
  kritikSaran: string | null
  biayaPerSiswa: number
  fotoUrl: string | null; jamMulai: string; jamSelesai: string
  namaWaliMurid: string; whatsappWaliMurid: string | null
}

interface FilterOptions {
  guruNames: string[]
  siswaOptions: { namaMurid: string; namaGuru: string }[]
}

const PAGE_SIZE = 50

export default function ReportsPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ guruNames: [], siswaOptions: [] })
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [siswaFilter, setSiswaFilter] = useState('')
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<Lesson | null>(null)
  const [message, setMessage] = useState('')
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null)

  // ─── Fetch user ───────────────────────────────────────────────────────────
  const fetchUser = useCallback(async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    setUser(data.user || null)
  }, [])

  // ─── Fetch dropdown options dari endpoint khusus (cepat, query DB langsung) ─
  const fetchFilterOptions = useCallback(async () => {
    try {
      const res = await fetch('/api/lessons/filters')
      if (!res.ok) return
      const data = await res.json()
      setFilterOptions(data)
    } catch {
      // Jika endpoint belum ada, abaikan saja
    }
  }, [])

  // ─── Fetch lessons dengan pagination ─────────────────────────────────────
  const fetchLessons = useCallback(async (page: number, append = false) => {
    if (page === 1) setLoading(true)
    else setLoadingMore(true)

    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (guruFilter) params.set('guru', guruFilter)
    if (siswaFilter) params.set('siswa', siswaFilter)
    params.set('page', String(page))
    params.set('limit', String(PAGE_SIZE))

    const res = await fetch(`/api/lessons?${params.toString()}`)
    const data = await res.json()
    const newLessons: Lesson[] = data.lessons || []

    if (append) {
      setLessons((prev) => [...prev, ...newLessons])
    } else {
      setLessons(newLessons)
    }

    // Cek apakah masih ada halaman berikutnya
    const pagination = data.pagination
    if (pagination) {
      setHasMore(pagination.page < pagination.totalPages)
    } else {
      setHasMore(false)
    }

    if (page === 1) setLoading(false)
    else setLoadingMore(false)
  }, [startDate, endDate, guruFilter, siswaFilter])

  // ─── Init ─────────────────────────────────────────────────────────────────
  useEffect(() => { fetchUser() }, [fetchUser])

  useEffect(() => {
    if (user) {
      fetchFilterOptions()
      setCurrentPage(1)
      fetchLessons(1, false)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // ─── Cari / Filter ────────────────────────────────────────────────────────
  const handleSearch = () => {
    setCurrentPage(1)
    fetchLessons(1, false)
  }

  // ─── Muat lebih banyak ───────────────────────────────────────────────────
  const handleLoadMore = () => {
    const nextPage = currentPage + 1
    setCurrentPage(nextPage)
    fetchLessons(nextPage, true)
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return

    const lessonToDelete = deleteConfirm
    setDeleteLoadingId(lessonToDelete.id)
    setDeleteConfirm(null)
    setMessage('')

    try {
      const res = await fetch(`/api/lessons/${lessonToDelete.id}`, {
        method: 'DELETE',
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        throw new Error(data.error || 'Gagal menghapus data les')
      }

      setLessons((prev) => prev.filter((lesson) => lesson.id !== lessonToDelete.id))
      setSelectedLesson((prev) => (prev?.id === lessonToDelete.id ? null : prev))
      setMessage(data.message || 'Data les berhasil dihapus')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setDeleteLoadingId(null)
    }
  }

  // ─── Dropdown: filter siswa berdasarkan guru terpilih ────────────────────
  // Sumber: filterOptions (dari DB langsung, selalu lengkap)
  const availableStudents = guruFilter
    ? filterOptions.siswaOptions.filter(s => s.namaGuru === guruFilter).map(s => s.namaMurid)
    : filterOptions.siswaOptions.map(s => s.namaMurid).filter((v, i, a) => a.indexOf(v) === i)

  if (!user) return <div className="glass-card p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Loading...</div>

  const inputClass = "glass-input text-sm w-full sm:w-auto"
  const canDeleteLesson = user.role === 'OWNER' || user.role === 'GURU'
  const isSuccess = message.toLowerCase().includes('berhasil')
  const openDeleteConfirm = (lesson: Lesson) => {
    setSelectedLesson(null)
    setDeleteConfirm(lesson)
  }

  return (
    <div>
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        title="Hapus Data Les"
        message={`Yakin ingin menghapus data les ${deleteConfirm?.namaMurid ?? ''} bersama ${deleteConfirm?.namaGuru ?? ''}? Tindakan ini akan menghapus laporan les beserta pendapatan terkait, data tidak akan tampil lagi di laporan owner, dan tidak bisa dibatalkan.`}
        confirmText="Ya, Hapus"
        variant="danger"
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeleteConfirm(null)}
      />

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Laporan</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Rekap absensi les</p>
        </div>
        <div className="flex items-center gap-3">
          {lessons.length > 0 && user.role === 'OWNER' && (
            <>
              <WhatsAppReportButton
                lessons={lessons}
                role={user.role}
              />
              <ReportsPrintButton
                lessons={lessons}
                userName={user.name}
                role={user.role}
              />
            </>
          )}
        </div>
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

      {user.role === 'OWNER' && (
        <div className="glass-card p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end flex-wrap">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6b7280' }}>Dari Tanggal</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6b7280' }}>Sampai Tanggal</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6b7280' }}>Guru</label>
              <select
                value={guruFilter}
                onChange={(e) => { setGuruFilter(e.target.value); setSiswaFilter('') }}
                className={inputClass}
              >
                <option value="">Semua Guru</option>
                {filterOptions.guruNames.map((g) => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6b7280' }}>Siswa</label>
              <select
                value={siswaFilter}
                onChange={(e) => setSiswaFilter(e.target.value)}
                className={inputClass}
              >
                <option value="">Semua Siswa</option>
                {availableStudents.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <button onClick={handleSearch} className="btn-primary w-full sm:w-auto">
              Cari
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="glass-card p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Loading...</div>
      ) : lessons.length === 0 ? (
        <div className="glass-card p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Tidak ada data les</div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="glass-table min-w-[1200px]">
                <thead>
                  <tr>
                    {['Tanggal','Guru','Jenis','Lokasi','Kelas','Jumlah Murid','Nama Murid','Jam','Wali Murid','Catatan','Perkembangan & Kendala', ...(canDeleteLesson ? ['Aksi'] : [])].map((h) => (
                      <th key={h} className={h === 'Jumlah Murid' ? 'text-center' : ''}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="cursor-pointer" onClick={() => setSelectedLesson(lesson)}>
                      <td className="whitespace-nowrap">{new Date(lesson.tanggalLes).toLocaleDateString('id-ID')}</td>
                      <td>{lesson.namaGuru}</td>
                      <td>{lesson.jenisPembelajaran}</td>
                      <td>{lesson.lokasiMengajar}</td>
                      <td>{lesson.kelasMurid || '-'}</td>
                      <td className="text-center">{lesson.jumlahMurid}</td>
                      <td>{lesson.namaMurid}</td>
                      <td className="whitespace-nowrap">{lesson.jamMulai} - {lesson.jamSelesai}</td>
                      <td>{lesson.namaWaliMurid}</td>
                      <td className="max-w-[180px] truncate">{lesson.catatanMateri}</td>
                      <td className="max-w-[200px] truncate">{lesson.kritikSaran || '-'}</td>
                      {canDeleteLesson && (
                        <td className="whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              openDeleteConfirm(lesson)
                            }}
                            disabled={deleteLoadingId === lesson.id}
                            className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-lg font-bold text-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          >
                            {deleteLoadingId === lesson.id ? 'Menghapus...' : 'Hapus'}
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-3">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="glass-card p-4 cursor-pointer" onClick={() => setSelectedLesson(lesson)}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-bold" style={{ color: '#1e1b4b' }}>{lesson.namaMurid}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>{lesson.namaGuru}</p>
                  </div>
                  <span className="text-xs" style={{ color: '#9ca3af' }}>{new Date(lesson.tanggalLes).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span style={{ color: '#9ca3af' }}>Jenis:</span> <span style={{ color: '#374151' }}>{lesson.jenisPembelajaran}</span></div>
                  <div><span style={{ color: '#9ca3af' }}>Lokasi:</span> <span style={{ color: '#374151' }}>{lesson.lokasiMengajar}</span></div>
                  <div><span style={{ color: '#9ca3af' }}>Jam:</span> <span style={{ color: '#374151' }}>{lesson.jamMulai} - {lesson.jamSelesai}</span></div>
                  <div><span style={{ color: '#9ca3af' }}>Murid:</span> <span style={{ color: '#374151' }}>{lesson.jumlahMurid} orang</span></div>
                </div>
                {lesson.catatanMateri && <p className="text-xs mt-2 line-clamp-2" style={{ color: '#6b7280' }}>{lesson.catatanMateri}</p>}
                {lesson.kritikSaran && (
                  <p className="text-xs mt-1 line-clamp-2" style={{ color: '#ef4444' }}>⚠️ {lesson.kritikSaran}</p>
                )}
                {canDeleteLesson && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        openDeleteConfirm(lesson)
                      }}
                      disabled={deleteLoadingId === lesson.id}
                      className="px-3 py-2 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl font-bold text-xs transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {deleteLoadingId === lesson.id ? 'Menghapus...' : 'Hapus Data'}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Muat Lebih Banyak */}
          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-secondary"
              >
                {loadingMore ? 'Memuat...' : `Muat Lebih Banyak`}
              </button>
            </div>
          )}

          {/* Info jumlah data */}
          <p className="text-center text-xs mt-3" style={{ color: '#9ca3af' }}>
            Menampilkan {lessons.length} data{hasMore ? ' (masih ada lebih banyak)' : ' (semua data ditampilkan)'}
          </p>
        </>
      )}

      {selectedLesson && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(15,10,40,0.45)', backdropFilter: 'blur(6px)' }}
        >
          <div
            className="max-w-lg w-full max-h-[90vh] overflow-y-auto glass-modal"
          >
            <div className="p-6">
              <div className="flex justify-between items-start mb-5">
                <h3 className="text-base font-bold" style={{ color: '#1e1b4b' }}>Detail Les</h3>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="p-1.5 rounded-xl transition-all"
                  style={{ color: '#9ca3af' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = '#6366f1' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3.5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs block mb-0.5" style={{ color: '#9ca3af' }}>Tanggal</span>
                    <p className="font-semibold" style={{ color: '#1e1b4b' }}>{new Date(selectedLesson.tanggalLes).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="text-xs block mb-0.5" style={{ color: '#9ca3af' }}>Jam</span>
                    <p className="font-semibold" style={{ color: '#1e1b4b' }}>{selectedLesson.jamMulai} - {selectedLesson.jamSelesai}</p>
                  </div>
                </div>
                {[
                  ['Nama Guru', selectedLesson.namaGuru],
                  ['WhatsApp Guru', selectedLesson.whatsappGuru],
                  ['Jenis Pembelajaran', selectedLesson.jenisPembelajaran],
                  ['Lokasi Mengajar', selectedLesson.lokasiMengajar],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="text-xs block mb-0.5" style={{ color: '#9ca3af' }}>{label}</span>
                    <p className="font-semibold" style={{ color: '#1e1b4b' }}>{value}</p>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs block mb-0.5" style={{ color: '#9ca3af' }}>Kelas Murid</span>
                    <p className="font-semibold" style={{ color: '#1e1b4b' }}>{selectedLesson.kelasMurid || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs block mb-0.5" style={{ color: '#9ca3af' }}>Jumlah Murid</span>
                    <p className="font-semibold" style={{ color: '#1e1b4b' }}>{selectedLesson.jumlahMurid}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs block mb-0.5" style={{ color: '#9ca3af' }}>Nama Murid</span>
                  <p className="font-semibold" style={{ color: '#1e1b4b' }}>{selectedLesson.namaMurid}</p>
                </div>
                <div>
                  <span className="text-xs block mb-0.5" style={{ color: '#9ca3af' }}>Catatan / Materi</span>
                  <p className="font-medium whitespace-pre-wrap" style={{ color: '#374151' }}>{selectedLesson.catatanMateri}</p>
                </div>
                {selectedLesson.kritikSaran && (
                  <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '12px' }}>
                    <span className="text-xs block mb-0.5 font-semibold" style={{ color: '#ef4444' }}>⚠️ Perkembangan &amp; Kendala</span>
                    <p className="font-medium whitespace-pre-wrap" style={{ color: '#374151' }}>{selectedLesson.kritikSaran}</p>
                  </div>
                )}
                {selectedLesson.fotoUrl && (
                  <div>
                    <span className="text-xs block mb-1" style={{ color: '#9ca3af' }}>Foto Kegiatan</span>
                    <div className="space-y-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={selectedLesson.fotoUrl}
                        alt="Foto Kegiatan Les"
                        className="w-full max-h-48 object-cover rounded-xl border border-gray-100 shadow-sm"
                      />
                      <a
                        href={selectedLesson.fotoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline font-medium block truncate"
                      >
                        Buka Gambar Full Screen ↗
                      </a>
                    </div>
                  </div>
                )}
                <div>
                  <span className="text-xs block mb-0.5" style={{ color: '#9ca3af' }}>Wali Murid</span>
                  <p className="font-semibold" style={{ color: '#1e1b4b' }}>{selectedLesson.namaWaliMurid}</p>
                </div>
                {selectedLesson.whatsappWaliMurid && (
                  <div>
                    <span className="text-xs block mb-0.5" style={{ color: '#9ca3af' }}>WhatsApp Wali Murid</span>
                    <p className="font-semibold" style={{ color: '#1e1b4b' }}>{selectedLesson.whatsappWaliMurid}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <div className="flex flex-col-reverse sm:flex-row gap-3">
                  {canDeleteLesson && (
                    <button
                      onClick={() => openDeleteConfirm(selectedLesson)}
                      disabled={deleteLoadingId === selectedLesson.id}
                      className="px-4 py-2.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl font-bold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {deleteLoadingId === selectedLesson.id ? 'Menghapus...' : 'Hapus Data Ini'}
                    </button>
                  )}
                  <button onClick={() => setSelectedLesson(null)} className="btn-secondary">
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
