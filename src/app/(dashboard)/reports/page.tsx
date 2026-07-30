'use client'

import { useState, useEffect, useCallback } from 'react'
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

export default function ReportsPage() {
  const [user, setUser] = useState<UserInfo | null>(null)
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [guruFilter, setGuruFilter] = useState('')
  const [siswaFilter, setSiswaFilter] = useState('')
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  const fetchUser = useCallback(async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    setUser(data.user || null)
  }, [])

  const fetchLessons = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (guruFilter) params.set('guru', guruFilter)
    if (siswaFilter) params.set('siswa', siswaFilter)
    const res = await fetch(`/api/lessons?${params.toString()}`)
    const data = await res.json()
    setLessons(data.lessons || [])
    setLoading(false)
  }, [startDate, endDate, guruFilter, siswaFilter])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  useEffect(() => {
    if (user) fetchLessons()
  }, [user, fetchLessons])

  const handleSearch = () => { fetchLessons() }


  const guruNames = [...new Set(lessons.map((l) => l.namaGuru))].sort()
  
  // Filter siswa berdasarkan guru yang dipilih
  const availableStudents = guruFilter 
    ? [...new Set(lessons.filter(l => l.namaGuru === guruFilter).map((l) => l.namaMurid))].sort()
    : [...new Set(lessons.map((l) => l.namaMurid))].sort()

  if (!user) return <div className="glass-card p-8 text-center text-sm" style={{ color: '#9ca3af' }}>Loading...</div>

  const inputClass = "glass-input text-sm w-full sm:w-auto"

  return (
    <div>
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
              <select value={guruFilter} onChange={(e) => { setGuruFilter(e.target.value); setSiswaFilter('') }} className={inputClass}>
                <option value="">Semua Guru</option>
                {guruNames.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-semibold mb-1.5" style={{ color: '#6b7280' }}>Siswa</label>
              <select value={siswaFilter} onChange={(e) => setSiswaFilter(e.target.value)} className={inputClass} disabled={!guruFilter && availableStudents.length === 0}>
                <option value="">Semua Siswa</option>
                {availableStudents.map((s) => (<option key={s} value={s}>{s}</option>))}
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
                    {['Tanggal','Guru','Jenis','Lokasi','Kelas','Jumlah Murid','Nama Murid','Jam','Wali Murid','Catatan','Perkembangan & Kendala'].map((h) => (
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
              </div>
            ))}
          </div>
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
                <button onClick={() => setSelectedLesson(null)} className="btn-secondary">
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
