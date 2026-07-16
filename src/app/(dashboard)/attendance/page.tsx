'use client'

import { useState, useEffect } from 'react'

interface Student {
  id: string
  name: string
  nis: string
  class: string
}

interface ClassTeacher {
  className: string
}

interface AttendanceRecord {
  studentId: string
  status: 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA'
  note: string
}

export default function AttendancePage() {
  const [classes, setClasses] = useState<ClassTeacher[]>([])
  const [selectedClass, setSelectedClass] = useState('')
  const [students, setStudents] = useState<Student[]>([])
  const [attendances, setAttendances] = useState<Record<string, AttendanceRecord>>({})
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [userRole, setUserRole] = useState('')

  useEffect(() => {
    fetchUser()
    fetchClasses()
  }, [])

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass)
    }
  }, [selectedClass])

  const fetchUser = async () => {
    const res = await fetch('/api/auth/me')
    const data = await res.json()
    setUserRole(data.user?.role || '')
  }

  const fetchClasses = async () => {
    const res = await fetch('/api/dashboard')
    const data = await res.json()
    if (data.classes) {
      setClasses(data.classes)
    }
  }

  const fetchStudents = async (className: string) => {
    setLoading(true)
    const res = await fetch(`/api/students?class=${encodeURIComponent(className)}`)
    const data = await res.json()
    setStudents(data.students || [])

    // Initialize attendance records
    const initial: Record<string, AttendanceRecord> = {}
    data.students?.forEach((s: Student) => {
      initial[s.id] = {
        studentId: s.id,
        status: 'ALPA',
        note: '',
      }
    })
    setAttendances(initial)
    setLoading(false)
  }

  const handleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }))
  }

  const handleNoteChange = (studentId: string, note: string) => {
    setAttendances((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        note,
      },
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage({ type: '', text: '' })

    const attendanceList = Object.values(attendances)

    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        attendances: attendanceList,
      }),
    })

    const data = await res.json()

    if (res.ok) {
      setMessage({ type: 'success', text: 'Absensi berhasil disimpan!' })
    } else {
      setMessage({ type: 'error', text: data.error || 'Gagal menyimpan absensi' })
    }

    setSaving(false)
  }

  const markAll = (status: AttendanceRecord['status']) => {
    const updated: Record<string, AttendanceRecord> = {}
    Object.keys(attendances).forEach((id) => {
      updated[id] = {
        ...attendances[id],
        status,
      }
    })
    setAttendances(updated)
  }

  if (userRole === 'ORANG_TUA') {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Input Absensi</h2>
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <p className="text-gray-600">
            Orang tua tidak dapat menginput absensi. Silakan melihat laporan di halaman Laporan.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Input Absensi</h2>

      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-end">
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1">Tanggal</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border rounded-md"
            />
          </div>
          <div className="w-full sm:w-auto">
            <label className="block text-sm font-medium mb-1">Kelas</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 border rounded-md"
            >
              <option value="">Pilih Kelas</option>
              {classes.map((c) => (
                <option key={c.className} value={c.className}>
                  {c.className}
                </option>
              ))}
            </select>
          </div>
          {selectedClass && students.length > 0 && (
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => markAll('HADIR')}
                className="flex-1 sm:flex-none px-3 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
              >
                Semua Hadir
              </button>
              <button
                onClick={() => markAll('ALPA')}
                className="flex-1 sm:flex-none px-3 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
              >
                Semua Alpa
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Message */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700'
              : 'bg-red-100 text-red-700'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Attendance Table - Desktop */}
      {selectedClass && (
        <>
          <div className="hidden sm:block bg-white rounded-lg shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-8 text-center text-gray-500">Loading...</div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                Tidak ada siswa di kelas ini
              </div>
            ) : (
              <>
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        No
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Nama
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        NIS
                      </th>
                      <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Catatan
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {students.map((student, index) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4">{index + 1}</td>
                        <td className="px-6 py-4">{student.name}</td>
                        <td className="px-6 py-4">{student.nis}</td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center gap-1">
                            {(['HADIR', 'IZIN', 'SAKIT', 'ALPA'] as const).map((status) => (
                              <button
                                key={status}
                                onClick={() => handleStatusChange(student.id, status)}
                                className={`px-2 py-1 text-xs rounded ${
                                  attendances[student.id]?.status === status
                                    ? status === 'HADIR'
                                      ? 'bg-green-500 text-white'
                                      : status === 'IZIN'
                                      ? 'bg-yellow-500 text-white'
                                      : status === 'SAKIT'
                                      ? 'bg-orange-500 text-white'
                                      : 'bg-red-500 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                              >
                                {status.charAt(0)}
                              </button>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={attendances[student.id]?.note || ''}
                            onChange={(e) => handleNoteChange(student.id, e.target.value)}
                            placeholder="Catatan..."
                            className="w-full px-2 py-1 border rounded text-sm"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="p-4 border-t">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Menyimpan...' : 'Simpan Absensi'}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Attendance Cards - Mobile */}
          <div className="sm:hidden space-y-4">
            {loading ? (
              <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">
                Loading...
              </div>
            ) : students.length === 0 ? (
              <div className="bg-white p-8 text-center text-gray-500 rounded-lg shadow-sm">
                Tidak ada siswa di kelas ini
              </div>
            ) : (
              <>
                {students.map((student, index) => (
                  <div key={student.id} className="bg-white p-4 rounded-lg shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <p className="font-medium">{index + 1}. {student.name}</p>
                        <p className="text-sm text-gray-500">NIS: {student.nis}</p>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {(['HADIR', 'IZIN', 'SAKIT', 'ALPA'] as const).map((status) => (
                        <button
                          key={status}
                          onClick={() => handleStatusChange(student.id, status)}
                          className={`flex-1 px-2 py-2 text-xs rounded ${
                            attendances[student.id]?.status === status
                              ? status === 'HADIR'
                                ? 'bg-green-500 text-white'
                                : status === 'IZIN'
                                ? 'bg-yellow-500 text-white'
                                : status === 'SAKIT'
                                ? 'bg-orange-500 text-white'
                                : 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      value={attendances[student.id]?.note || ''}
                      onChange={(e) => handleNoteChange(student.id, e.target.value)}
                      placeholder="Catatan..."
                      className="w-full px-2 py-1 border rounded text-sm"
                    />
                  </div>
                ))}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Absensi'}
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
