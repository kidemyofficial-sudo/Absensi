import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import StudentForm from '@/components/StudentForm'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Owner dashboard
  if (user.role === 'OWNER') {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [totalStudents, totalTeachers, pendingStudents, todayAttendance, monthlyRevenue] = await Promise.all([
      prisma.student.count({ where: { status: 'APPROVED' } }),
      prisma.user.count({ where: { role: 'GURU' } }),
      prisma.student.count({ where: { status: 'PENDING' } }),
      prisma.attendance.count({ where: { date: today } }),
      prisma.lessonRevenue.findMany({
        where: {
          lesson: {
            tanggalLes: { gte: startOfMonth, lte: endOfMonth },
          },
        },
        include: {
          lesson: {
            select: { namaGuru: true },
          },
        },
      }),
    ])

    const totalPendapatanOwner = monthlyRevenue.reduce((sum, r) => sum + r.pendapatanOwner, 0)
    const totalPendapatanGuru = monthlyRevenue.reduce((sum, r) => sum + r.pendapatanGuru, 0)
    const totalLes = monthlyRevenue.length

    // Group by guru
    const guruRevenueMap = new Map<string, { namaGuru: string; total: number; count: number }>()
    for (const rev of monthlyRevenue) {
      const existing = guruRevenueMap.get(rev.lesson.namaGuru)
      if (existing) {
        existing.total += rev.pendapatanGuru
        existing.count += 1
      } else {
        guruRevenueMap.set(rev.lesson.namaGuru, {
          namaGuru: rev.lesson.namaGuru,
          total: rev.pendapatanGuru,
          count: 1,
        })
      }
    }
    const guruRevenues = Array.from(guruRevenueMap.values()).sort((a, b) => b.total - a.total)

    const formatRupiah = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }

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
                Review
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

        {/* Revenue Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Pendapatan Owner Bulan Ini</h3>
            <p className="mt-2 text-3xl font-bold text-blue-600">{formatRupiah(totalPendapatanOwner)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Total Bagi Guru Bulan Ini</h3>
            <p className="mt-2 text-3xl font-bold text-green-600">{formatRupiah(totalPendapatanGuru)}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900">Total Les Bulan Ini</h3>
            <p className="mt-2 text-3xl font-bold text-purple-600">{totalLes}</p>
          </div>
        </div>

        {/* Revenue per Guru */}
        {guruRevenues.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Pendapatan Per Guru Bulan Ini</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Guru</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Les</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Bagi Hasil</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {guruRevenues.map((g) => (
                    <tr key={g.namaGuru}>
                      <td className="px-4 py-3 text-sm text-gray-900">{g.namaGuru}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{g.count}</td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">{formatRupiah(g.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/students" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900">Kelola Siswa</h3>
            <p className="text-gray-500 mt-2">ACC pendaftaran, assign cabang daerah & guru</p>
          </Link>
          <Link href="/reports" className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-medium text-gray-900">Laporan Absensi</h3>
            <p className="text-gray-500 mt-2">Lihat rekap kehadiran siswa</p>
          </Link>
        </div>
      </div>
    )
  }

  // Guru dashboard
  if (user.role === 'GURU') {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    const [branchTeachers, todayAttendances, monthlyRevenues] = await Promise.all([
      prisma.branchTeacher.findMany({
        where: { userId: user.id },
        select: {
          cabangDaerah: true,
          _count: {
            select: { student: true },
          },
        },
      }),
      prisma.attendance.count({
        where: {
          teacherId: user.id,
          date: today,
        },
      }),
      prisma.lessonRevenue.findMany({
        where: {
          lesson: {
            guruId: user.id,
            tanggalLes: { gte: startOfMonth, lte: endOfMonth },
          },
        },
        include: {
          lesson: {
            select: {
              tanggalLes: true,
              jumlahMurid: true,
              namaMurid: true,
              jenisPembelajaran: true,
            },
          },
        },
      }),
    ])

    const totalPendapatanGuru = monthlyRevenues.reduce((sum, r) => sum + r.pendapatanGuru, 0)

    const formatRupiah = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(amount)
    }

    return (
      <div>
        <h2 className="text-2xl font-bold mb-6">Dashboard Guru</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Cabang Daerah Yang Diampu</h3>
            {branchTeachers.length === 0 ? (
              <p className="text-gray-500">Belum ada cabang daerah yang ditugaskan</p>
            ) : (
              <ul className="space-y-2">
                {branchTeachers.map((bt) => (
                  <li key={bt.cabangDaerah} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                    <span>{bt.cabangDaerah}</span>
                    <span className="text-sm text-gray-500">{bt._count.student} siswa</span>
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

        {/* Guru Revenue Summary */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Estimasi Pendapatan Bulan Ini</h3>
          <p className="text-3xl font-bold text-green-600 mb-2">{formatRupiah(totalPendapatanGuru)}</p>
          <p className="text-sm text-gray-500">Pembayaran dilakukan langsung ke rekening Anda.</p>
          <Link href="/pendapatan" className="mt-4 inline-block text-blue-600 hover:underline">
            Lihat Detail Pendapatan →
          </Link>
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
        ttl: true,
        domisili: true,
        asalSekolah: true,
        cabangDaerah: true,
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
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Daftarkan Siswa Baru</h3>
          <p className="text-gray-500 text-sm mb-4">
            Isi form di bawah untuk mendaftarkan anak Anda. Setelah itu, tunggu persetujuan dari Admin.
          </p>
          <StudentForm />
        </div>

        {/* Status Anak */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Status Anak Hari Ini</h3>
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
                        <p className="text-sm">{child.ttl}</p>
                        <p className="text-sm">{child.domisili}</p>
                        <p className="text-sm">Asal: {child.asalSekolah}</p>
                        {child.cabangDaerah && (
                          <p className="text-sm text-gray-500">Cabang Daerah: {child.cabangDaerah}</p>
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
