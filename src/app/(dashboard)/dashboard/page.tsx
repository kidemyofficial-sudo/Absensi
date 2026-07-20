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

    let totalStudents = 0
    let totalTeachers = 0
    let pendingStudents = 0
    let todayAttendance = 0
    type OwnerRevRow = { id: string; lessonId: string; pendapatanOwner: number; pendapatanGuru: number; lesson: { namaGuru: string } }
    let monthlyRevenue: OwnerRevRow[] = []

    try {
      ;[totalStudents, totalTeachers, pendingStudents, todayAttendance, monthlyRevenue] = await Promise.all([
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
    } catch {
      // DB cold start — render page with empty/zero fallbacks
    }

    const totalPendapatanOwner = monthlyRevenue.reduce((sum, r) => sum + r.pendapatanOwner, 0)
    const totalPendapatanGuru = monthlyRevenue.reduce((sum, r) => sum + r.pendapatanGuru, 0)
    const totalLes = monthlyRevenue.length

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang kembali, {user.name}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Siswa Aktif</p>
            <p className="text-2xl font-bold text-gray-900">{totalStudents}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Menunggu ACC</p>
            <p className="text-2xl font-bold text-gray-900">{pendingStudents}</p>
            {pendingStudents > 0 && (
              <Link href="/students?status=PENDING" className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium">
                Review sekarang
              </Link>
            )}
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Total Guru</p>
            <p className="text-2xl font-bold text-gray-900">{totalTeachers}</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 mb-1">Absensi Hari Ini</p>
            <p className="text-2xl font-bold text-gray-900">{todayAttendance}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Pendapatan Owner Bulan Ini</p>
            <p className="text-xl font-bold text-blue-600">{formatRupiah(totalPendapatanOwner)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Bagi Guru Bulan Ini</p>
            <p className="text-xl font-bold text-green-600">{formatRupiah(totalPendapatanGuru)}</p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <p className="text-sm text-gray-500 mb-1">Total Les Bulan Ini</p>
            <p className="text-xl font-bold text-purple-600">{totalLes}</p>
          </div>
        </div>

        {guruRevenues.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900">Pendapatan Per Guru Bulan Ini</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Les</th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bagi Hasil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {guruRevenues.map((g) => (
                    <tr key={g.namaGuru} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-3.5 text-sm text-gray-900 font-medium">{g.namaGuru}</td>
                      <td className="px-5 py-3.5 text-sm text-gray-600">{g.count}</td>
                      <td className="px-5 py-3.5 text-sm font-medium text-green-600">{formatRupiah(g.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/students" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Kelola Siswa</h3>
            </div>
            <p className="text-sm text-gray-500">ACC pendaftaran, assign cabang daerah & guru</p>
          </Link>
          <Link href="/reports" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Laporan Absensi</h3>
            </div>
            <p className="text-sm text-gray-500">Lihat rekap kehadiran siswa</p>
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

    type BranchTeacherRow = { cabangDaerah: string; _count: { student: number } }
    type GuruRevRow = { id: string; lessonId: string; pendapatanGuru: number; lesson: { tanggalLes: Date; jumlahMurid: number; namaMurid: string; jenisPembelajaran: string } }
    let branchTeachers: BranchTeacherRow[] = []
    let todayAttendances = 0
    let monthlyRevenues: GuruRevRow[] = []

    try {
      ;[branchTeachers, todayAttendances, monthlyRevenues] = await Promise.all([
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
    } catch {
      // DB cold start — render page with empty/zero fallbacks
    }

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
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang kembali, {user.name}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Cabang Daerah Yang Diampu</h3>
            </div>
            {branchTeachers.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada cabang daerah yang ditugaskan</p>
            ) : (
              <ul className="space-y-2">
                {branchTeachers.map((bt) => (
                  <li key={bt.cabangDaerah} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                    <span className="text-sm text-gray-700 font-medium">{bt.cabangDaerah}</span>
                    <span className="text-xs text-gray-500 bg-white px-2 py-1 rounded-lg">{bt._count.student} siswa</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Absensi Hari Ini</h3>
            </div>
            <p className="text-3xl font-bold text-gray-900 mb-1">{todayAttendances}</p>
            <p className="text-sm text-gray-500 mb-4">sudah tercatat</p>
            <Link
              href="/attendance"
              className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors"
            >
              Input Absensi
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Estimasi Pendapatan Bulan Ini</h3>
          </div>
          <p className="text-2xl font-bold text-green-600 mb-1">{formatRupiah(totalPendapatanGuru)}</p>
          <p className="text-sm text-gray-500 mb-3">Pembayaran dilakukan langsung ke rekening Anda.</p>
          <Link href="/pendapatan" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Lihat Detail Pendapatan
          </Link>
        </div>

        {/* Section Aplikasi Pendukung */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V6.75m-12 0H18m-12 0h.008" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900">Aplikasi Pendukung Pembelajaran</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {/* Google Calendar */}
            <a href="https://calendar.google.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.google.com/s2/favicons?domain=calendar.google.com&sz=64" alt="Google Calendar" className="w-6 h-6 rounded" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Google Calendar</p>
                <p className="text-[10px] text-gray-400">Jadwal les</p>
              </div>
            </a>
            {/* ChatGPT */}
            <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-green-50 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.google.com/s2/favicons?domain=chat.openai.com&sz=64" alt="ChatGPT" className="w-6 h-6 rounded" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">ChatGPT</p>
                <p className="text-[10px] text-gray-400">Asisten AI</p>
              </div>
            </a>
            {/* Canva */}
            <a href="https://www.canva.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-purple-50 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.google.com/s2/favicons?domain=canva.com&sz=64" alt="Canva" className="w-6 h-6 rounded" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Canva</p>
                <p className="text-[10px] text-gray-400">Desain materi</p>
              </div>
            </a>
            {/* Google Drive */}
            <a href="https://drive.google.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-yellow-50 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.google.com/s2/favicons?domain=drive.google.com&sz=64" alt="Google Drive" className="w-6 h-6 rounded" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Google Drive</p>
                <p className="text-[10px] text-gray-400">Penyimpanan file</p>
              </div>
            </a>
            {/* Zoom */}
            <a href="https://zoom.us" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-blue-50 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.google.com/s2/favicons?domain=zoom.us&sz=64" alt="Zoom" className="w-6 h-6 rounded" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Zoom</p>
                <p className="text-[10px] text-gray-400">Video meeting</p>
              </div>
            </a>
            {/* Google Meet */}
            <a href="https://meet.google.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-red-50 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.google.com/s2/favicons?domain=meet.google.com&sz=64" alt="Google Meet" className="w-6 h-6 rounded" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Google Meet</p>
                <p className="text-[10px] text-gray-400">Video call</p>
              </div>
            </a>
            {/* Quizizz */}
            <a href="https://quizizz.com" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-orange-50 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.google.com/s2/favicons?domain=quizizz.com&sz=64" alt="Quizizz" className="w-6 h-6 rounded" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Quizizz</p>
                <p className="text-[10px] text-gray-400">Kuis interaktif</p>
              </div>
            </a>
            {/* Khan Academy */}
            <a href="https://www.khanacademy.org" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl hover:bg-teal-50 hover:shadow-sm transition-all group">
              <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center shadow-sm flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="https://www.google.com/s2/favicons?domain=khanacademy.org&sz=64" alt="Khan Academy" className="w-6 h-6 rounded" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-900">Khan Academy</p>
                <p className="text-[10px] text-gray-400">Belajar online</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Orang Tua dashboard
  if (user.role === 'ORANG_TUA') {
    let children: { id: string; name: string; ttl: string; domisili: string; asalSekolah: string; cabangDaerah: string | null; status: string }[] = []

    try {
      children = await prisma.student.findMany({
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
    } catch {
      // DB cold start — fallback to empty
    }

    const childrenIds = children.map((c) => c.id)

    let todayAttendances: { studentId: string; status: string; note: string | null }[] = []

    try {
      todayAttendances = await prisma.attendance.findMany({
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
    } catch {
      // DB cold start — fallback to empty
    }

    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang kembali, {user.name}</p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Daftarkan Siswa Baru</h3>
          <p className="text-gray-500 text-sm mb-5">
            Isi form di bawah untuk mendaftarkan anak Anda. Setelah itu, tunggu persetujuan dari Admin.
          </p>
          <StudentForm />
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">Status Anak Hari Ini</h3>
          </div>
          <div className="p-6">
            {children.length === 0 ? (
              <p className="text-sm text-gray-500">Belum ada data anak. Silakan daftarkan di atas.</p>
            ) : (
              <div className="space-y-3">
                {children.map((child) => {
                  const attendance = todayAttendances.find((a) => a.studentId === child.id)
                  return (
                    <div key={child.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-sm text-gray-900">{child.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{child.ttl}</p>
                          <p className="text-xs text-gray-500">{child.domisili}</p>
                          <p className="text-xs text-gray-500">Asal: {child.asalSekolah}</p>
                          {child.cabangDaerah && (
                            <p className="text-xs text-gray-500 mt-0.5">Cabang: {child.cabangDaerah}</p>
                          )}
                        </div>
                        <span
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium ${
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
                      {attendance && (
                        <div className="mt-2">
                          <span
                            className={`px-2 py-0.5 rounded text-xs font-medium ${
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
      </div>
    )
  }

  return null
}
