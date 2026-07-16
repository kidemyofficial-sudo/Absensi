import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import RegisterStudentForm from '@/components/RegisterStudentForm'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Owner dashboard
  if (user.role === 'OWNER') {
    const [totalStudents, totalTeachers, pendingStudents, todayAttendance] = await Promise.all([
      prisma.student.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'GURU' } }),
      prisma.student.count({ where: { status: 'PENDING' } }),
      prisma.attendance.count({ where: { date: today } }),
    ])

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Dashboard Owner</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Siswa Aktif</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{totalStudents}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Menunggu ACC</h3>
            <p className="mt-2 text-3xl font-bold text-orange-600">{pendingStudents}</p>
            {pendingStudents > 0 && (
              <Link href="/students?status=PENDING" className="mt-2 text-sm text-blue-500 hover:underline">
                Review →
              </Link>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Total Guru</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">{totalTeachers}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Absensi Hari Ini</h3>
            <p className="mt-2 text-3xl font-bold text-purple-600">{todayAttendance}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/students" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900">👤 Kelola Siswa</h3>
            <p className="text-gray-500 mt-2">ACC pendaftaran, assign kelas & guru</p>
          </Link>
          <Link href="/reports" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900">📊 Laporan Absensi</h3>
            <p className="text-gray-500 mt-2">Lihat rekap kehadiran siswa</p>
          </Link>
        </div>
      </div>
    )
  }

  // Guru dashboard
  if (user.role === 'GURU') {
    const classes = await prisma.classroomTeacher.findMany({
      where: { userId: user.id },
      select: {
        className: true,
        _count: {
          select: { student: true },
        },
      },
    })

    const todayAttendances = await prisma.attendance.count({
      where: {
        teacherId: user.id,
        date: today,
      },
    })

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Dashboard Guru</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Kelas Yang Diampu</h3>
            {classes.length === 0 ? (
              <p className="text-gray-500">Belum ada kelas yang ditugaskan</p>
            ) : (
              <ul className="space-y-2">
                {classes.map((c) => (
                  <li key={c.className} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{c.className}</span>
                    <span className="text-sm text-gray-500">{c._count.student} siswa</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Absensi Hari Ini</h3>
            <p className="text-3xl font-bold text-orange-600">{todayAttendances}</p>
            <p className="text-sm text-gray-500 mt-2">sudah tercatat</p>
            <Link
              href="/attendance"
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Input Absensi
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Orang Tua dashboard
  if (user.role === 'ORANG_TUA') {
    const children = await prisma.student.findMany({
      where: { parentId: user.id },
      select: {
        id: true,
        name: true,
        nis: true,
        class: true,
        status: true,
      },
    })

    const childrenIds = children.map((c) => c.id)

    const todayAttendances = await prisma.attendance.findMany({
      where: {
        studentId: { in: childrenIds },
        date: today,
      },
      select: {
        studentId: true,
        status: true,
        note: true,
      },
    })

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Dashboard Orang Tua</h2>

        {/* Form Daftarkan Siswa Baru */}
        <RegisterStudentForm />

        {/* Status Anak */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status Anak</h3>
          {children.length === 0 ? (
            <p className="text-gray-500">Belum ada data anak. Silakan daftarkan di atas.</p>
          ) : (
            <div className="space-y-4">
              {children.map((child) => {
                const attendance = todayAttendances.find((a) => a.studentId === child.id)
                return (
                  <div key={child.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{child.name}</p>
                        <p className="text-sm text-gray-500">NIS: {child.nis}</p>
                        {child.class && (
                          <p className="text-sm text-gray-500">Kelas: {child.class}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            child.status === 'APPROVED'
                              ? 'bg-green-100 text-green-800'
                              : child.status === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {child.status === 'APPROVED'
                            ? 'Disetujui'
                            : child.status === 'PENDING'
                            ? 'Menunggu ACC'
                            : 'Ditolak'}
                        </span>
                      </div>
                    </div>
                    {attendance && (
                      <div className="mt-2">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            attendance.status === 'HADIR'
                              ? 'bg-green-100 text-green-800'
                              : attendance.status === 'IZIN'
                              ? 'bg-yellow-100 text-yellow-800'
                              : attendance.status === 'SAKIT'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          Hari ini: {attendance.status}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  return null
}
