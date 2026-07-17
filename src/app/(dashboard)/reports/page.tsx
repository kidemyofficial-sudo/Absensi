'use client'

import { useState, useEffect } from 'react'

interface UserInfo {
  id: string
  name: string
  phone: string
  role: string
}

interface Lesson {
  id: string
  tanggalLes: string
  namaGuru: string
  whatsappGuru: string
  jenisPembelajaran: string
  lokasiMengajar: string
  kelasMurid: string | null
  jumlahMurid: number
  namaMurid: string
  catatanMateri: string
  fotoUrl: string | null
  jamMulai: string
  jamSelesai: string
  namaWaliMurid: string
  whatsappWaliMurid: string | null
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

  useEffect(() => {
    fetchUser()
  }, [])

  useEffect(() => {
    if (user) {
      fetchLessons()
    }
  }, [user])

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    setUser(data.user || null)
  }

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

  const handleSearch = () => {
    fetchLessons()
  }

  const exportCSV = () => {
    const headers = [
      'Tanggal',
      'Nama Guru',
      'WA Guru',
      'Jenis Pembelajaran',
      'Lokasi',
      'Kelas',
      'Jumlah Murid',
      'Nama Murid',
      'Catatan',
      'Jam Mulai',
      'Jam Selesai',
      'Wali Murid',
      'WA Wali',
    ]
    const rows = lessons.map((l) => [
      new Date(l.tanggalLes).toLocaleDateString('id-ID'),
      l.namaGuru,
      l.whatsappGuru,
      l.jenisPembelajaran,
      l.lokasiMengajar,
      l.kelasMurid || '-',
      String(l.jumlahMurid),
      l.namaMurid,
      l.catatanMateri,
      l.jamMulai,
      l.jamSelesai,
      l.namaWaliMurid,
      l.whatsappWaliMurid || '-',
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `rekap-les-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const guruNames = [...new Set(lessons.map((l) => l.namaGuru))].sort()
  const jenisList = [...new Set(lessons.map((l) => l.jenisPembelajaran))].sort()

  if (!user) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
        Loading...
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Rekap Absensi Les</h2>
        {lessons.length > 0 && (
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Filters - OWNER only */}
      {user.role === 'OWNER' && (
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border rounded-md"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border rounded-md"
              />
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-1">Guru</label>
              <select
                value={guruFilter}
                onChange={(e) => setGuruFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border rounded-md"
              >
                <option value="">Semua Guru</option>
                {guruNames.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:w-auto">
              <label className="block text-sm font-medium mb-1">Jenis Pembelajaran</label>
              <select
                value={jenisFilter}
                onChange={(e) => setJenisFilter(e.target.value)}
                className="w-full sm:w-auto px-3 py-2 border rounded-md"
              >
                <option value="">Semua Jenis</option>
                {jenisList.map((j) => (
                  <option key={j} value={j}>{j}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleSearch}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Cari
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
          Loading...
        </div>
      ) : lessons.length === 0 ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
          Tidak ada data les
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden lg:block bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1200px]">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guru</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lokasi</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Murid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama Murid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jam</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Wali Murid</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {lessons.map((lesson) => (
                    <tr
                      key={lesson.id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => setSelectedLesson(lesson)}
                    >
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {new Date(lesson.tanggalLes).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-4 py-3 text-sm">{lesson.namaGuru}</td>
                      <td className="px-4 py-3 text-sm">{lesson.jenisPembelajaran}</td>
                      <td className="px-4 py-3 text-sm">{lesson.lokasiMengajar}</td>
                      <td className="px-4 py-3 text-sm">{lesson.kelasMurid || '-'}</td>
                      <td className="px-4 py-3 text-sm text-center">{lesson.jumlahMurid}</td>
                      <td className="px-4 py-3 text-sm">{lesson.namaMurid}</td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">{lesson.jamMulai} - {lesson.jamSelesai}</td>
                      <td className="px-4 py-3 text-sm">{lesson.namaWaliMurid}</td>
                      <td className="px-4 py-3 text-sm max-w-[200px] truncate">{lesson.catatanMateri}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-4">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="bg-white p-4 rounded-lg shadow-sm"
                onClick={() => setSelectedLesson(lesson)}
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-medium">{lesson.namaMurid}</p>
                    <p className="text-sm text-gray-500">{lesson.namaGuru}</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    {new Date(lesson.tanggalLes).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500">Jenis:</span> {lesson.jenisPembelajaran}
                  </div>
                  <div>
                    <span className="text-gray-500">Lokasi:</span> {lesson.lokasiMengajar}
                  </div>
                  <div>
                    <span className="text-gray-500">Jam:</span> {lesson.jamMulai} - {lesson.jamSelesai}
                  </div>
                  <div>
                    <span className="text-gray-500">Murid:</span> {lesson.jumlahMurid} orang
                  </div>
                </div>
                {lesson.catatanMateri && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{lesson.catatanMateri}</p>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* Detail Modal */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold">Detail Les</h3>
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Tanggal:</span>
                    <p className="font-medium">{new Date(selectedLesson.tanggalLes).toLocaleDateString('id-ID')}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Jam:</span>
                    <p className="font-medium">{selectedLesson.jamMulai} - {selectedLesson.jamSelesai}</p>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Nama Guru:</span>
                  <p className="font-medium">{selectedLesson.namaGuru}</p>
                </div>
                <div>
                  <span className="text-gray-500">WhatsApp Guru:</span>
                  <p className="font-medium">{selectedLesson.whatsappGuru}</p>
                </div>
                <div>
                  <span className="text-gray-500">Jenis Pembelajaran:</span>
                  <p className="font-medium">{selectedLesson.jenisPembelajaran}</p>
                </div>
                <div>
                  <span className="text-gray-500">Lokasi Mengajar:</span>
                  <p className="font-medium">{selectedLesson.lokasiMengajar}</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">Kelas Murid:</span>
                    <p className="font-medium">{selectedLesson.kelasMurid || '-'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Jumlah Murid:</span>
                    <p className="font-medium">{selectedLesson.jumlahMurid}</p>
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">Nama Murid:</span>
                  <p className="font-medium">{selectedLesson.namaMurid}</p>
                </div>
                <div>
                  <span className="text-gray-500">Catatan / Materi:</span>
                  <p className="font-medium whitespace-pre-wrap">{selectedLesson.catatanMateri}</p>
                </div>
                {selectedLesson.fotoUrl && (
                  <div>
                    <span className="text-gray-500">Foto:</span>
                    <p className="font-medium">{selectedLesson.fotoUrl}</p>
                  </div>
                )}
                <div>
                  <span className="text-gray-500">Wali Murid:</span>
                  <p className="font-medium">{selectedLesson.namaWaliMurid}</p>
                </div>
                {selectedLesson.whatsappWaliMurid && (
                  <div>
                    <span className="text-gray-500">WhatsApp Wali Murid:</span>
                    <p className="font-medium">{selectedLesson.whatsappWaliMurid}</p>
                  </div>
                )}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setSelectedLesson(null)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                >
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
