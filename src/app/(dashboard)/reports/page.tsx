'use client'

import { useState, useEffect } from 'react'

interface Student {
  id: string
  name: string
  nis: string
  class: string
}

interface Attendance {
  id: string
  date: string
  status: string
  note: string | null
  student: Student
}

interface Summary {
  student: Student
  HADIR: number
  IZIN: number
  SAKIT: number
  ALPA: number
  total: number
}

export default function ReportsPage() {
  const [attendances, setAttendances] = useState<Attendance[]>([])
  const [summary, setSummary] = useState<Summary[]>([])
  const [loading, setLoading] = useState(false)

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [classFilter, setClassFilter] = useState('')
  const [view, setView] = useState<'detail' | 'summary'>('summary')

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (startDate) params.set('startDate', startDate)
    if (endDate) params.set('endDate', endDate)
    if (classFilter) params.set('class', classFilter)

    const res = await fetch(`/api/reports?${params.toString()}`)
    const data = await res.json()

    setAttendances(data.attendances || [])
    setSummary(data.summary || [])
    setLoading(false)
  }

  const handleSearch = () => {
    fetchReports()
  }

  const exportCSV = () => {
    const headers = ['Tanggal', 'Nama', 'NIS', 'Kelas', 'Status', 'Catatan']
    const rows = attendances.map((a) => [
      new Date(a.date).toLocaleDateString('id-ID'),
      a.student.name,
      a.student.nis,
      a.student.class,
      a.status,
      a.note || '',
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `laporan-absensi-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
  }

  const classes = [...new Set(attendances.map((a) => a.student.class))].sort()

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold">Laporan Absensi</h2>
        {attendances.length > 0 && (
          <button
            onClick={exportCSV}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
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
            <label className="block text-sm font-medium mb-1">Kelas</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border rounded-md"
            >
              <option value="">Semua Kelas</option>
              {classes.map((c) => (
                <option key={c} value={c}>{c}</option>
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
        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setView('summary')}
            className={`px-3 py-1 rounded text-sm ${
              view === 'summary'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Ringkasan
          </button>
          <button
            onClick={() => setView('detail')}
            className={`px-3 py-1 rounded text-sm ${
              view === 'detail'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Detail
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="bg-white p-8 rounded-lg shadow-sm text-center text-gray-500">
          Loading...
        </div>
      ) : view === 'summary' ? (
        <>
          {/* Summary Table - Desktop */}
          <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
            {summary.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Tidak ada data</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">NIS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Hadir</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Izin</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Sakit</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Alpa</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {summary.map((item) => (
                    <tr key={item.student.id}>
                      <td className="px-6 py-4">{item.student.name}</td>
                      <td className="px-6 py-4">{item.student.nis}</td>
                      <td className="px-6 py-4">{item.student.class}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-green-600 font-medium">{item.HADIR}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-yellow-600 font-medium">{item.IZIN}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-orange-600 font-medium">{item.SAKIT}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="text-red-600 font-medium">{item.ALPA}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Summary Cards - Mobile */}
          <div className="sm:hidden space-y-4">
            {summary.length === 0 ? (
              <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">
                Tidak ada data
              </div>
            ) : (
              summary.map((item) => (
                <div key={item.student.id} className="bg-white p-4 rounded-lg shadow-sm">
                  <h4 className="font-medium">{item.student.name}</h4>
                  <p className="text-sm text-gray-500">NIS: {item.student.nis} | Kelas: {item.student.class}</p>
                  <div className="grid grid-cols-4 gap-2 mt-3">
                    <div className="text-center">
                      <p className="text-lg font-bold text-green-600">{item.HADIR}</p>
                      <p className="text-xs text-gray-500">Hadir</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-yellow-600">{item.IZIN}</p>
                      <p className="text-xs text-gray-500">Izin</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-orange-600">{item.SAKIT}</p>
                      <p className="text-xs text-gray-500">Sakit</p>
                    </div>
                    <div className="text-center">
                      <p className="text-lg font-bold text-red-600">{item.ALPA}</p>
                      <p className="text-xs text-gray-500">Alpa</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Detail Table - Desktop */}
          <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
            {attendances.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Tidak ada data</div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nama</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Kelas</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Catatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendances.map((a) => (
                    <tr key={a.id}>
                      <td className="px-6 py-4">
                        {new Date(a.date).toLocaleDateString('id-ID')}
                      </td>
                      <td className="px-6 py-4">{a.student.name}</td>
                      <td className="px-6 py-4">{a.student.class}</td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            a.status === 'HADIR'
                              ? 'bg-green-100 text-green-800'
                              : a.status === 'IZIN'
                              ? 'bg-yellow-100 text-yellow-800'
                              : a.status === 'SAKIT'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {a.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{a.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Detail Cards - Mobile */}
          <div className="sm:hidden space-y-4">
            {attendances.length === 0 ? (
              <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">
                Tidak ada data
              </div>
            ) : (
              attendances.map((a) => (
                <div key={a.id} className="bg-white p-4 rounded-lg shadow-sm">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{a.student.name}</p>
                      <p className="text-sm text-gray-500">Kelas: {a.student.class}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(a.date).toLocaleDateString('id-ID')}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        a.status === 'HADIR'
                          ? 'bg-green-100 text-green-800'
                          : a.status === 'IZIN'
                          ? 'bg-yellow-100 text-yellow-800'
                          : a.status === 'SAKIT'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {a.status}
                    </span>
                  </div>
                  {a.note && (
                    <p className="text-sm text-gray-600 mt-2">Catatan: {a.note}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  )
}
