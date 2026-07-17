'use client'

import { useState, useEffect } from 'react'

interface UserInfo { id: string; name: string; phone: string; role: string }

interface Lesson {
  id: string; tanggalLes: string; namaGuru: string; whatsappGuru: string
  jenisPembelajaran: string; lokasiMengajar: string; kelasMurid: string | null
  jumlahMurid: number; namaMurid: string; catatanMateri: string
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
  const [jenisFilter, setJenisFilter] = useState('')
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null)

  useEffect(() => { fetchUser() }, [])
  useEffect(() => { if (user) fetchLessons() }, [user])

  const fetchUser = async () => { const res = await fetch('/api/auth/me'); const data = await res.json(); setUser(data.user || null) }

  const fetchLessons = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (guruFilter) params.set('guru', guruFilter)
    if (jenisFilter) params.set('jenis', jenisFilter)
    const res = await fetch(`/api/lessons?${params.toString()}`)
    const data = await res.json()
    setLessons(data.lessons || [])
    setLoading(false)
  }

  const handleSearch = () => { fetchLessons() }

  const exportCSV = () => {
    const headers = ['Tanggal','Nama Guru','WA Guru','Jenis Pembelajaran','Lokasi','Kelas','Jumlah Murid','Nama Murid','Catatan','Jam Mulai','Jam Selesai','Wali Murid','WA Wali']
    const rows = lessons.map((l) => [
      new Date(l.tanggalLes).toLocaleDateString('id-ID'), l.namaGuru, l.whatsappGuru,
      l.jenisPembelajaran, l.lokasiMengajar, l.kelasMurid || '-', String(l.jumlahMurid),
      l.namaMurid, l.catatanMateri, l.jamMulai, l.jamSelesai, l.namaWaliMurid, l.whatsappWaliMurid || '-',
    ])
    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `rekap-les-${new Date().toISOString().split('T')[0]}.csv`; a.click()
  }

  const guruNames = [...new Set(lessons.map((l) => l.namaGuru))].sort()
  const jenisList = [...new Set(lessons.map((l) => l.jenisPembelajaran))].sort()

  if (!user) return <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400 text-sm">Loading...</div>

  const inputClass = "w-full sm:w-auto px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white transition-all"

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Laporan</h1>
          <p className="text-sm text-gray-500 mt-1">Rekap absensi les</p>
        </div>
        {lessons.length > 0 && (
          <button onClick={exportCSV} className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2.5 rounded-xl hover:bg-green-700 text-sm font-medium transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            Export CSV
          </button>
        )}
      </div>

      {user.role === 'OWNER' && (
        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Dari Tanggal</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={inputClass} />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Sampai Tanggal</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={inputClass} />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Guru</label>
              <select value={guruFilter} onChange={(e) => setGuruFilter(e.target.value)} className={inputClass}>
                <option value="">Semua Guru</option>
                {guruNames.map((g) => (<option key={g} value={g}>{g}</option>))}
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Jenis Pembelajaran</label>
              <select value={jenisFilter} onChange={(e) => setJenisFilter(e.target.value)} className={inputClass}>
                <option value="">Semua Jenis</option>
                {jenisList.map((j) => (<option key={j} value={j}>{j}</option>))}
              </select>
            </div>
            <button onClick={handleSearch} className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors">
              Cari
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400 text-sm">Loading...</div>
      ) : lessons.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center text-gray-400 text-sm">Tidak ada data les</div>
      ) : (
        <>
          <div className="hidden lg:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Tanggal','Guru','Jenis','Lokasi','Kelas','Murid','Nama Murid','Jam','Wali Murid','Catatan'].map((h) => (
                      <th key={h} className={`px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${h === 'Murid' ? 'text-center' : ''}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lessons.map((lesson) => (
                    <tr key={lesson.id} className="hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => setSelectedLesson(lesson)}>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-900">{new Date(lesson.tanggalLes).toLocaleDateString('id-ID')}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{lesson.namaGuru}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lesson.jenisPembelajaran}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lesson.lokasiMengajar}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lesson.kelasMurid || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center text-gray-600">{lesson.jumlahMurid}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{lesson.namaMurid}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap text-gray-600">{lesson.jamMulai} - {lesson.jamSelesai}</td>
                      <td className="px-4 py-3 text-sm text-gray-600">{lesson.namaWaliMurid}</td>
                      <td className="px-4 py-3 text-sm max-w-[200px] truncate text-gray-600">{lesson.catatanMateri}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden space-y-3">
            {lessons.map((lesson) => (
              <div key={lesson.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm" onClick={() => setSelectedLesson(lesson)}>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{lesson.namaMurid}</p>
                    <p className="text-xs text-gray-500">{lesson.namaGuru}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(lesson.tanggalLes).toLocaleDateString('id-ID')}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div><span className="text-gray-400">Jenis:</span> <span className="text-gray-600">{lesson.jenisPembelajaran}</span></div>
                  <div><span className="text-gray-400">Lokasi:</span> <span className="text-gray-600">{lesson.lokasiMengajar}</span></div>
                  <div><span className="text-gray-400">Jam:</span> <span className="text-gray-600">{lesson.jamMulai} - {lesson.jamSelesai}</span></div>
                  <div><span className="text-gray-400">Murid:</span> <span className="text-gray-600">{lesson.jumlahMurid} orang</span></div>
                </div>
                {lesson.catatanMateri && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{lesson.catatanMateri}</p>}
              </div>
            ))}
          </div>
        </>
      )}

      {selectedLesson && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-gray-100">
            <div className="p-6">
              <div className="flex justify-between items-start mb-5">
                <h3 className="text-base font-semibold text-gray-900">Detail Les</h3>
                <button onClick={() => setSelectedLesson(null)} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3.5 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Tanggal</span>
                    <p className="font-medium text-gray-900">{new Date(selectedLesson.tanggalLes).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Jam</span>
                    <p className="font-medium text-gray-900">{selectedLesson.jamMulai} - {selectedLesson.jamSelesai}</p>
                  </div>
                </div>
                {[
                  ['Nama Guru', selectedLesson.namaGuru],
                  ['WhatsApp Guru', selectedLesson.whatsappGuru],
                  ['Jenis Pembelajaran', selectedLesson.jenisPembelajaran],
                  ['Lokasi Mengajar', selectedLesson.lokasiMengajar],
                ].map(([label, value]) => (
                  <div key={label}>
                    <span className="text-xs text-gray-400 block mb-0.5">{label}</span>
                    <p className="font-medium text-gray-900">{value}</p>
                  </div>
                ))}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Kelas Murid</span>
                    <p className="font-medium text-gray-900">{selectedLesson.kelasMurid || '-'}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Jumlah Murid</span>
                    <p className="font-medium text-gray-900">{selectedLesson.jumlahMurid}</p>
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Nama Murid</span>
                  <p className="font-medium text-gray-900">{selectedLesson.namaMurid}</p>
                </div>
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Catatan / Materi</span>
                  <p className="font-medium text-gray-900 whitespace-pre-wrap">{selectedLesson.catatanMateri}</p>
                </div>
                {selectedLesson.fotoUrl && (
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Foto</span>
                    <p className="font-medium text-gray-900">{selectedLesson.fotoUrl}</p>
                  </div>
                )}
                <div>
                  <span className="text-xs text-gray-400 block mb-0.5">Wali Murid</span>
                  <p className="font-medium text-gray-900">{selectedLesson.namaWaliMurid}</p>
                </div>
                {selectedLesson.whatsappWaliMurid && (
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">WhatsApp Wali Murid</span>
                    <p className="font-medium text-gray-900">{selectedLesson.whatsappWaliMurid}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button onClick={() => setSelectedLesson(null)} className="bg-gray-100 text-gray-700 px-4 py-2.5 rounded-xl hover:bg-gray-200 text-sm font-medium transition-colors">Tutup</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
