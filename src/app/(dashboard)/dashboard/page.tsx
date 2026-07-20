import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import StudentForm from '@/components/StudentForm'

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) return null

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // ─────────────────────────────────────────────
  //  OWNER DASHBOARD
  // ─────────────────────────────────────────────
  if (user.role === 'OWNER') {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    let totalStudents  = 0
    let totalTeachers  = 0
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
          where: { lesson: { tanggalLes: { gte: startOfMonth, lte: endOfMonth } } },
          include: { lesson: { select: { namaGuru: true } } },
        }),
      ])
    } catch { /* DB cold start */ }

    const totalPendapatanOwner = monthlyRevenue.reduce((s, r) => s + r.pendapatanOwner, 0)
    const totalPendapatanGuru  = monthlyRevenue.reduce((s, r) => s + r.pendapatanGuru, 0)
    const totalLes             = monthlyRevenue.length

    const guruRevenueMap = new Map<string, { namaGuru: string; total: number; count: number }>()
    for (const rev of monthlyRevenue) {
      const e = guruRevenueMap.get(rev.lesson.namaGuru)
      if (e) { e.total += rev.pendapatanGuru; e.count += 1 }
      else    guruRevenueMap.set(rev.lesson.namaGuru, { namaGuru: rev.lesson.namaGuru, total: rev.pendapatanGuru, count: 1 })
    }
    const guruRevenues = Array.from(guruRevenueMap.values()).sort((a, b) => b.total - a.total)

    const fmt = (n: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

    const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

    return (
      <div className="pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Selamat datang kembali, <span className="font-semibold text-gray-700">{user.name}</span> 👋
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Siswa Aktif */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase tracking-wider">Aktif</span>
            </div>
            <p className="text-xs font-semibold text-gray-400 mb-0.5">Siswa Aktif</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{totalStudents}</p>
          </div>

          {/* Menunggu ACC */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {pendingStudents > 0 && (
                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg uppercase tracking-wider animate-pulse">Review!</span>
              )}
            </div>
            <p className="text-xs font-semibold text-gray-400 mb-0.5">Menunggu ACC</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{pendingStudents}</p>
            {pendingStudents > 0 && (
              <Link href="/students?status=PENDING" className="mt-2 inline-flex items-center gap-1 text-xs text-amber-600 hover:text-amber-800 font-semibold transition-colors">
                Review sekarang
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>

          {/* Total Guru */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg uppercase tracking-wider">Guru</span>
            </div>
            <p className="text-xs font-semibold text-gray-400 mb-0.5">Total Guru</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{totalTeachers}</p>
          </div>

          {/* Absensi Hari Ini */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg uppercase tracking-wider">Hari Ini</span>
            </div>
            <p className="text-xs font-semibold text-gray-400 mb-0.5">Absensi Hari Ini</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{todayAttendance}</p>
          </div>
        </div>

        {/* Revenue Banner */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 p-6 rounded-2xl mb-6 text-white relative overflow-hidden shadow-[0_8px_30px_rgba(99,102,241,0.25)]">
          {/* Decorative circles */}
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-sm" />
          <div className="absolute -bottom-10 right-20 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute top-2 right-1/3 w-12 h-12 bg-white/10 rounded-full" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Rekap Keuangan</span>
              <span className="text-blue-200/70 text-xs">•</span>
              <span className="text-blue-100 text-xs">{monthName}</span>
            </div>
            <div className="grid grid-cols-3 gap-6 mt-4">
              <div>
                <p className="text-blue-200 text-xs font-medium mb-1">Pendapatan Owner</p>
                <p className="text-2xl font-bold text-white">{fmt(totalPendapatanOwner)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs font-medium mb-1">Total Bagi Guru</p>
                <p className="text-2xl font-bold text-white">{fmt(totalPendapatanGuru)}</p>
              </div>
              <div>
                <p className="text-blue-200 text-xs font-medium mb-1">Total Les</p>
                <p className="text-2xl font-bold text-white">{totalLes} <span className="text-base font-medium text-blue-200">sesi</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Guru Revenue Table */}
        {guruRevenues.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Pendapatan Per Guru — {monthName}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Nama Guru</th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Jumlah Les</th>
                    <th className="px-6 py-3.5 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Bagi Hasil</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {guruRevenues.map((g, i) => (
                    <tr key={g.namaGuru} className="hover:bg-gray-50/70 transition-colors">
                      <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {g.namaGuru.charAt(0).toUpperCase()}
                          </div>
                          {g.namaGuru}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          {g.count} sesi
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-emerald-600">{fmt(g.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/students" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-blue-100 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-100 transition-colors text-blue-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">Kelola Siswa</h3>
                <p className="text-xs text-gray-400 font-medium">ACC pendaftaran, assign cabang & guru</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-600 font-semibold group-hover:gap-2.5 transition-all">
              <span>Buka Daftar Siswa</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>
          <Link href="/reports" className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-green-100 transition-all group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center group-hover:bg-green-100 transition-colors text-green-600">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 group-hover:text-green-700 transition-colors">Laporan Absensi</h3>
                <p className="text-xs text-gray-400 font-medium">Rekap kehadiran lengkap semua siswa</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-600 font-semibold group-hover:gap-2.5 transition-all">
              <span>Lihat Laporan</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  //  GURU DASHBOARD
  // ─────────────────────────────────────────────
  if (user.role === 'GURU') {
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

    type BranchTeacherRow = { cabangDaerah: string; _count: { student: number } }
    type GuruRevRow = { id: string; lessonId: string; pendapatanGuru: number; lesson: { tanggalLes: Date; jumlahMurid: number; namaMurid: string; jenisPembelajaran: string } }

    let branchTeachers: BranchTeacherRow[] = []
    let todayAttendances = 0
    let monthlyRevenues: GuruRevRow[] = []

    try {
      ;[branchTeachers, todayAttendances, monthlyRevenues] = await Promise.all([
        prisma.branchTeacher.findMany({
          where: { userId: user.id },
          select: { cabangDaerah: true, _count: { select: { student: true } } },
        }),
        prisma.attendance.count({ where: { teacherId: user.id, date: today } }),
        prisma.lessonRevenue.findMany({
          where: { lesson: { guruId: user.id, tanggalLes: { gte: startOfMonth, lte: endOfMonth } } },
          include: { lesson: { select: { tanggalLes: true, jumlahMurid: true, namaMurid: true, jenisPembelajaran: true } } },
        }),
      ])
    } catch { /* DB cold start */ }

    const totalPendapatanGuru = monthlyRevenues.reduce((s, r) => s + r.pendapatanGuru, 0)
    const fmt = (n: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

    const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

    return (
      <div className="pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Selamat datang kembali, <span className="font-semibold text-gray-700">{user.name}</span> 👋
          </p>
        </div>

        {/* Top Grid: Cabang & Absensi */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">

          {/* Cabang Daerah */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Cabang Daerah Yang Diampu</h3>
            </div>
            {branchTeachers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-400 font-medium italic">Belum ada cabang yang ditugaskan</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {branchTeachers.map((bt) => (
                  <li key={bt.cabangDaerah} className="flex justify-between items-center p-3.5 bg-gray-50 hover:bg-blue-50/50 rounded-xl transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      <span className="text-sm text-gray-800 font-semibold">{bt.cabangDaerah}</span>
                    </div>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-xl">
                      {bt._count.student} siswa
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Absensi Hari Ini */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-sm font-semibold text-gray-900">Absensi Hari Ini</h3>
            </div>
            <div>
              <p className="text-5xl font-bold text-gray-900 mb-1 tracking-tight">{todayAttendances}</p>
              <p className="text-sm text-gray-500 mb-5">siswa sudah tercatat</p>
              <Link
                href="/attendance"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 rounded-xl hover:from-blue-700 hover:to-indigo-700 text-sm font-semibold transition-all shadow-[0_4px_12px_rgba(99,102,241,0.2)] hover:shadow-[0_6px_16px_rgba(99,102,241,0.3)] hover:scale-[1.01]"
              >
                Input Absensi
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>

        {/* Income Banner */}
        <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-6 rounded-2xl mb-6 text-white relative overflow-hidden shadow-[0_8px_30px_rgba(16,185,129,0.25)]">
          <div className="absolute -top-8 -right-8 w-36 h-36 bg-white/10 rounded-full blur-sm" />
          <div className="absolute -bottom-10 right-20 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute top-2 right-1/3 w-12 h-12 bg-white/10 rounded-full" />

          <div className="relative z-10 flex justify-between items-start flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </div>
                <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Estimasi Pendapatan</span>
              </div>
              <p className="text-3xl font-bold text-white mt-2">{fmt(totalPendapatanGuru)}</p>
              <p className="text-emerald-100 text-sm mt-1">{monthName}</p>
              <p className="text-emerald-100/80 text-xs mt-1">Pembayaran dilakukan langsung ke rekening Anda</p>
            </div>
            <Link href="/pendapatan"
              className="self-end inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all backdrop-blur-sm border border-white/20"
            >
              Lihat Detail
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Aplikasi Pendukung */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V6.75m-12 0H18m-12 0h.008" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900">Aplikasi Pendukung Pembelajaran</h3>
              <p className="text-xs text-gray-400 font-medium">Tools terbaik untuk mengajar lebih efektif</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { href: 'https://calendar.google.com', domain: 'calendar.google.com', name: 'Google Calendar', desc: 'Jadwal les', hoverBg: 'hover:bg-blue-50' },
              { href: 'https://chat.openai.com',     domain: 'chat.openai.com',     name: 'ChatGPT',         desc: 'Asisten AI',         hoverBg: 'hover:bg-green-50' },
              { href: 'https://www.canva.com',       domain: 'canva.com',            name: 'Canva',           desc: 'Desain materi',      hoverBg: 'hover:bg-purple-50' },
              { href: 'https://drive.google.com',    domain: 'drive.google.com',     name: 'Google Drive',   desc: 'Penyimpanan file',   hoverBg: 'hover:bg-yellow-50' },
              { href: 'https://zoom.us',             domain: 'zoom.us',              name: 'Zoom',            desc: 'Video meeting',      hoverBg: 'hover:bg-blue-50' },
              { href: 'https://meet.google.com',     domain: 'meet.google.com',      name: 'Google Meet',    desc: 'Video call',         hoverBg: 'hover:bg-red-50' },
              { href: 'https://quizizz.com',         domain: 'quizizz.com',          name: 'Quizizz',         desc: 'Kuis interaktif',    hoverBg: 'hover:bg-orange-50' },
              { href: 'https://www.khanacademy.org', domain: 'khanacademy.org',      name: 'Khan Academy',   desc: 'Belajar online',     hoverBg: 'hover:bg-teal-50' },
            ].map((app) => (
              <a
                key={app.domain}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl ${app.hoverBg} hover:shadow-sm transition-all group`}
              >
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 group-hover:shadow-md transition-shadow">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://www.google.com/s2/favicons?domain=${app.domain}&sz=64`} alt={app.name} className="w-6 h-6 rounded" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-900">{app.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">{app.desc}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────
  //  ORANG TUA DASHBOARD
  // ─────────────────────────────────────────────
  if (user.role === 'ORANG_TUA') {
    let children: {
      id: string; name: string; ttl: string; domisili: string;
      asalSekolah: string; cabangDaerah: string | null; status: string
    }[] = []

    try {
      children = await prisma.student.findMany({
        where: { parentId: user.id },
        select: { id: true, name: true, ttl: true, domisili: true, asalSekolah: true, cabangDaerah: true, status: true },
      })
    } catch { /* DB cold start */ }

    const childrenIds = children.map((c) => c.id)

    let todayAttendances: { studentId: string; status: string; note: string | null }[] = []

    try {
      if (childrenIds.length > 0) {
        todayAttendances = await prisma.attendance.findMany({
          where: { studentId: { in: childrenIds }, date: today },
          select: { studentId: true, status: true, note: true },
        })
      }
    } catch { /* DB cold start */ }

    const statusConfig = {
      APPROVED: { label: 'Disetujui',     bg: 'bg-green-50',  text: 'text-green-700',  border: 'border-green-200' },
      PENDING:  { label: 'Menunggu ACC',  bg: 'bg-amber-50',  text: 'text-amber-700',  border: 'border-amber-200' },
      REJECTED: { label: 'Ditolak',       bg: 'bg-red-50',    text: 'text-red-700',    border: 'border-red-200'   },
    }

    const attendanceConfig = {
      HADIR:  { label: 'Hadir',  bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500'  },
      IZIN:   { label: 'Izin',   bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
      SAKIT:  { label: 'Sakit',  bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
      ALPHA:  { label: 'Alpha',  bg: 'bg-red-50',    text: 'text-red-700',    dot: 'bg-red-500'    },
    }

    return (
      <div className="pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">
            Selamat datang kembali, <span className="font-semibold text-gray-700">{user.name}</span> 👋
          </p>
        </div>

        {/* Status Anak — only if there are children */}
        {children.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-sm font-semibold text-gray-700">Status Anak Hari Ini</h2>
              <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-blue-100">
                {children.length} terdaftar
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {children.map((child) => {
                const attendance = todayAttendances.find((a) => a.studentId === child.id)
                const st = statusConfig[child.status as keyof typeof statusConfig] ?? statusConfig.PENDING
                const att = attendance ? (attendanceConfig[attendance.status as keyof typeof attendanceConfig] ?? null) : null

                return (
                  <div key={child.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all">
                    {/* Child Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-sm flex-shrink-0">
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-gray-900">{child.name}</p>
                          <p className="text-xs text-gray-400 font-medium mt-0.5">{child.asalSekolah}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${st.bg} ${st.text} ${st.border}`}>
                        {st.label}
                      </span>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span className="font-medium text-gray-600">{child.ttl}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span className="font-medium text-gray-600">{child.domisili}</span>
                      </div>
                      {child.cabangDaerah && (
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                          </svg>
                          <span className="font-medium text-gray-600">Cabang: {child.cabangDaerah}</span>
                        </div>
                      )}
                    </div>

                    {/* Attendance Today */}
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      {att ? (
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${att.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${att.dot} flex-shrink-0`} />
                          <span className={`text-xs font-bold ${att.text}`}>Kehadiran Hari Ini: {att.label}</span>
                          {attendance?.note && (
                            <span className={`text-xs ${att.text} opacity-70 ml-1`}>— {attendance.note}</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-50">
                          <span className="w-2 h-2 rounded-full bg-gray-300 flex-shrink-0" />
                          <span className="text-xs font-semibold text-gray-400">Belum ada absensi hari ini</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Registration Form */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Daftarkan Siswa Baru</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Isi formulir di bawah. Setelah dikirim, tunggu persetujuan dari Admin.
                </p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <StudentForm />
          </div>
        </div>
      </div>
    )
  }

  return null
}
