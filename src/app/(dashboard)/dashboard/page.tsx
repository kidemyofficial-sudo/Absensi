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
          <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Selamat datang kembali, <span className="font-semibold" style={{ color: '#4b5563' }}>{user.name}</span> 👋
          </p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Siswa Aktif */}
          <div className="glass-card p-5 hover:shadow-[0_16px_48px_rgba(99,102,241,0.18)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>Aktif</span>
            </div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#9ca3af' }}>Siswa Aktif</p>
            <p className="text-3xl font-bold tracking-tight" style={{ color: '#1e1b4b' }}>{totalStudents}</p>
          </div>

          {/* Menunggu ACC */}
          <div className="glass-card p-5 hover:shadow-[0_16px_48px_rgba(245,158,11,0.18)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(245,158,11,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              {pendingStudents > 0 && (
                <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider animate-pulse" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706' }}>Review!</span>
              )}
            </div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#9ca3af' }}>Menunggu ACC</p>
            <p className="text-3xl font-bold tracking-tight" style={{ color: '#1e1b4b' }}>{pendingStudents}</p>
            {pendingStudents > 0 && (
              <Link href="/students?status=PENDING" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold transition-colors" style={{ color: '#d97706' }}>
                Review sekarang
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>
            )}
          </div>

          {/* Total Guru */}
          <div className="glass-card p-5 hover:shadow-[0_16px_48px_rgba(16,185,129,0.18)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(16,185,129,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>Guru</span>
            </div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#9ca3af' }}>Total Guru</p>
            <p className="text-3xl font-bold tracking-tight" style={{ color: '#1e1b4b' }}>{totalTeachers}</p>
          </div>

          {/* Absensi Hari Ini */}
          <div className="glass-card p-5 hover:shadow-[0_16px_48px_rgba(139,92,246,0.18)] transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(139,92,246,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5.5 h-5.5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <span className="text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider" style={{ background: 'rgba(139,92,246,0.1)', color: '#8b5cf6' }}>Hari Ini</span>
            </div>
            <p className="text-xs font-semibold mb-0.5" style={{ color: '#9ca3af' }}>Absensi Hari Ini</p>
            <p className="text-3xl font-bold tracking-tight" style={{ color: '#1e1b4b' }}>{todayAttendance}</p>
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <p className="text-blue-100/80 text-[10px] font-bold uppercase tracking-wider mb-1">Pendapatan Owner</p>
                <p className="text-2xl font-bold text-white">{fmt(totalPendapatanOwner)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <p className="text-blue-100/80 text-[10px] font-bold uppercase tracking-wider mb-1">Total Bagi Guru</p>
                <p className="text-2xl font-bold text-white">{fmt(totalPendapatanGuru)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <p className="text-blue-100/80 text-[10px] font-bold uppercase tracking-wider mb-1">Total Les</p>
                <p className="text-2xl font-bold text-white">{totalLes} <span className="text-sm font-semibold text-blue-100">sesi</span></p>
              </div>
            </div>
          </div>
        </div>

        {/* Guru Revenue Table */}
        {guruRevenues.length > 0 && (
          <div className="glass-card mb-6 overflow-hidden">
            <div className="px-6 py-4 flex items-center gap-3" style={{ borderBottom: '1px solid rgba(229,231,235,0.4)' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(16,185,129,0.1)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75" />
                </svg>
              </div>
              <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Pendapatan Per Guru — {monthName}</h3>
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
                      <td className="px-6 py-4 text-sm font-medium" style={{ color: '#6b7280' }}>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: 'rgba(243,244,246,0.5)', color: '#374151' }}>
                          {g.count} sesi
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold" style={{ color: '#10b981' }}>{fmt(g.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link href="/students" className="glass-card p-5 hover:shadow-[0_16px_48px_rgba(99,102,241,0.18)] transition-all group" style={{ textDecoration: 'none' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: 'rgba(99,102,241,0.08)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Kelola Siswa</h3>
                <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>ACC pendaftaran, assign cabang &amp; guru</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#6366f1' }}>
              <span>Buka Daftar Siswa</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </div>
          </Link>
          <Link href="/reports" className="glass-card p-5 hover:shadow-[0_16px_48px_rgba(16,185,129,0.18)] transition-all group" style={{ textDecoration: 'none' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-all" style={{ background: 'rgba(16,185,129,0.08)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Laporan Absensi</h3>
                <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>Rekap kehadiran lengkap semua siswa</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#10b981' }}>
              <span>Lihat Laporan</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="#10b981" strokeWidth={2}>
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
    type TodayScheduleRow = { id: string; title: string; time: string; timeEnd: string | null; category: string; recurrence: string }

    let branchTeachers: BranchTeacherRow[] = []
    let todayAttendances = 0
    let monthlyRevenues: GuruRevRow[] = []
    let rawSchedules: TodayScheduleRow[] = []

    try {
      ;[branchTeachers, todayAttendances, monthlyRevenues, rawSchedules] = await Promise.all([
        prisma.branchTeacher.findMany({
          where: { userId: user.id },
          select: { cabangDaerah: true, _count: { select: { student: true } } },
        }),
        prisma.attendance.count({ where: { teacherId: user.id, date: today } }),
        prisma.lessonRevenue.findMany({
          where: { lesson: { guruId: user.id, tanggalLes: { gte: startOfMonth, lte: endOfMonth } } },
          include: { lesson: { select: { tanggalLes: true, jumlahMurid: true, namaMurid: true, jenisPembelajaran: true } } },
        }),
        prisma.teacherSchedule.findMany({
          where: { userId: user.id, category: 'JADWAL' },
          select: { id: true, title: true, time: true, timeEnd: true, category: true, recurrence: true, date: true },
          orderBy: { time: 'asc' },
        }) as unknown as TodayScheduleRow[],
      ])
    } catch { /* DB cold start */ }

    // Filter schedules for today: ONCE matching today's date OR WEEKLY matching today's weekday
    const todayWeekday = now.getDay()
    const todayStr = today.toISOString().split('T')[0]
    const todaySchedules = (rawSchedules as (TodayScheduleRow & { date: Date })[]).filter(s => {
      const sDate = new Date(s.date)
      const sStr = sDate.toISOString().split('T')[0]
      if (sStr === todayStr) return true
      if (s.recurrence === 'WEEKLY') return sDate.getDay() === todayWeekday
      return false
    })

    const totalPendapatanGuru = monthlyRevenues.reduce((s, r) => s + r.pendapatanGuru, 0)
    const fmt = (n: number) =>
      new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n)

    const monthName = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

    return (
      <div className="pb-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Selamat datang kembali, <span className="font-semibold" style={{ color: '#4b5563' }}>{user.name}</span> 👋
          </p>
        </div>

        {/* Top Grid: Cabang, Jadwal Hari Ini & Absensi */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">

          {/* Cabang Daerah */}
          <div className="glass-card p-5">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
                </svg>
              </div>
              <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Cabang Daerah Yang Diampu</h3>
            </div>
            {branchTeachers.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm font-medium italic" style={{ color: '#9ca3af' }}>Belum ada cabang yang ditugaskan</p>
              </div>
            ) : (
              <ul className="space-y-2.5">
                {branchTeachers.map((bt) => (
                  <li key={bt.cabangDaerah} className="flex justify-between items-center p-3.5 rounded-xl transition-colors" style={{ background: 'rgba(99,102,241,0.05)' }}>
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#6366f1' }} />
                      <span className="text-sm font-semibold" style={{ color: '#1e1b4b' }}>{bt.cabangDaerah}</span>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-xl" style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}>
                      {bt._count.student} siswa
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Jadwal Mengajar Hari Ini */}
          <div className="glass-card p-5 flex flex-col">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                  </svg>
                </div>
                <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Jadwal Mengajar Hari Ini</h3>
              </div>
              <Link
                href="/schedule"
                className="text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all"
                style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
              >
                + Atur
              </Link>
            </div>
            {todaySchedules.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-6 text-center">
                <div className="w-12 h-12 rounded-2xl mb-3 flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 9v7.5" />
                  </svg>
                </div>
                <p className="text-xs font-medium italic" style={{ color: '#9ca3af' }}>Belum ada jadwal mengajar hari ini</p>
                <Link
                  href="/schedule"
                  className="mt-3 text-xs font-bold px-3 py-1.5 rounded-xl transition-all"
                  style={{ background: 'rgba(99,102,241,0.1)', color: '#6366f1' }}
                >
                  Buat Jadwal
                </Link>
              </div>
            ) : (
              <ul className="space-y-2 flex-1 overflow-y-auto">
                {todaySchedules.map((s) => {
                  const t = s.time
                  const te = s.timeEnd
                  const hFmt = (str: string) => {
                    const m = str.match(/^(\d+):(\d+)$/)
                    if (!m) return str
                    let h = +m[1]; const min = +m[2]
                    const p = h >= 12 ? 'PM' : 'AM'
                    h = h > 12 ? h - 12 : h === 0 ? 12 : h
                    return `${h}:${min.toString().padStart(2,'0')} ${p}`
                  }
                  return (
                    <li key={s.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.06)' }}>
                      <div className="flex-shrink-0 w-1.5 h-10 rounded-full" style={{ background: 'linear-gradient(to bottom, #6366f1, #8b5cf6)' }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: '#1e1b4b' }}>{s.title}</p>
                        <p className="text-[10px] font-semibold mt-0.5" style={{ color: '#8b5cf6' }}>
                          {hFmt(t)}{te ? ` – ${hFmt(te)}` : ''}
                          {s.recurrence === 'WEEKLY' && <span className="ml-1.5">🔁</span>}
                        </p>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Absensi Hari Ini */}
          <div className="glass-card p-5 flex flex-col justify-between">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-rose-500 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(249,115,22,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Absensi Hari Ini</h3>
            </div>
            <div>
              <p className="text-5xl font-bold mb-1 tracking-tight" style={{ color: '#1e1b4b' }}>{todayAttendances}</p>
              <p className="text-sm mb-5" style={{ color: '#6b7280' }}>siswa sudah tercatat</p>
              <Link
                href="/attendance"
                className="inline-flex items-center gap-2 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}
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

          <div className="relative z-10 flex justify-between items-center flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
                  </svg>
                </div>
                <span className="text-emerald-100 text-xs font-semibold uppercase tracking-wider">Estimasi Pendapatan</span>
              </div>
              <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/10 inline-block min-w-[240px]">
                <p className="text-emerald-100/80 text-[10px] font-bold uppercase tracking-wider">{monthName}</p>
                <p className="text-2xl font-bold text-white mt-1">{fmt(totalPendapatanGuru)}</p>
                <p className="text-[10px] text-emerald-100/70 font-medium mt-1">Pembayaran ditransfer ke rekening terdaftar</p>
              </div>
            </div>
            <Link href="/pendapatan"
              className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all backdrop-blur-sm border border-white/20"
            >
              Lihat Detail
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 stroke-white text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Aplikasi Pendukung */}
        <div className="glass-card p-5">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.08)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V6.75m-12 0H18m-12 0h.008" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Aplikasi Pendukung Pembelajaran</h3>
              <p className="text-xs font-medium" style={{ color: '#9ca3af' }}>Tools terbaik untuk mengajar lebih efektif</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {[
              { href: 'https://calendar.google.com', domain: 'calendar.google.com', name: 'Google Calendar', desc: 'Jadwal les' },
              { href: 'https://chat.openai.com',     domain: 'chat.openai.com',     name: 'ChatGPT',         desc: 'Asisten AI' },
              { href: 'https://www.canva.com',       domain: 'canva.com',            name: 'Canva',           desc: 'Desain materi' },
              { href: 'https://drive.google.com',    domain: 'drive.google.com',     name: 'Google Drive',   desc: 'Penyimpanan file' },
              { href: 'https://zoom.us',             domain: 'zoom.us',              name: 'Zoom',            desc: 'Video meeting' },
              { href: 'https://meet.google.com',     domain: 'meet.google.com',      name: 'Google Meet',    desc: 'Video call' },
              { href: 'https://quizizz.com',         domain: 'quizizz.com',          name: 'Quizizz',         desc: 'Kuis interaktif' },
              { href: 'https://www.khanacademy.org', domain: 'khanacademy.org',      name: 'Khan Academy',   desc: 'Belajar online' },
            ].map((app) => (
              <a
                key={app.domain}
                href={app.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3.5 rounded-xl transition-all hover:bg-indigo-50"
                style={{ background: 'rgba(99,102,241,0.04)' }}
              >
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center shadow-sm flex-shrink-0" style={{ border: '1px solid rgba(229,231,235,0.5)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`https://www.google.com/s2/favicons?domain=${app.domain}&sz=64`} alt={app.name} className="w-6 h-6 rounded" />
                </div>
                <div>
                  <p className="text-xs font-semibold" style={{ color: '#1e1b4b' }}>{app.name}</p>
                  <p className="text-[10px] font-medium mt-0.5" style={{ color: '#9ca3af' }}>{app.desc}</p>
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
          <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>
            Selamat datang kembali, <span className="font-semibold" style={{ color: '#4b5563' }}>{user.name}</span> 👋
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
                  <div key={child.id} className="glass-card p-5 hover:shadow-[0_16px_48px_rgba(99,102,241,0.18)] transition-all">
                    {/* Child Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-base font-bold shadow-sm flex-shrink-0">
                          {child.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-sm" style={{ color: '#1e1b4b' }}>{child.name}</p>
                          <p className="text-xs font-medium mt-0.5" style={{ color: '#9ca3af' }}>{child.asalSekolah}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-xl border ${st.bg} ${st.text} ${st.border}`}>
                        {st.label}
                      </span>
                    </div>

                    {/* Info Grid */}
                    <div className="space-y-1.5 text-xs" style={{ color: '#6b7280' }}>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#6366f1" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                        </svg>
                        <span className="font-medium" style={{ color: '#4b5563' }}>{child.ttl}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6" strokeWidth={1.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                        </svg>
                        <span className="font-medium" style={{ color: '#4b5563' }}>{child.domisili}</span>
                      </div>
                      {child.cabangDaerah && (
                        <div className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6" strokeWidth={1.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342" />
                          </svg>
                          <span className="font-medium" style={{ color: '#4b5563' }}>Cabang: {child.cabangDaerah}</span>
                        </div>
                      )}
                    </div>

                    {/* Attendance Today */}
                    <div className="mt-4 pt-4" style={{ borderTop: '1px solid rgba(229,231,235,0.4)' }}>
                      {att ? (
                        <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${att.bg}`}>
                          <span className={`w-2 h-2 rounded-full ${att.dot} flex-shrink-0`} />
                          <span className={`text-xs font-bold ${att.text}`}>Kehadiran Hari Ini: {att.label}</span>
                          {attendance?.note && (
                            <span className={`text-xs ${att.text} opacity-70 ml-1`}>— {attendance.note}</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(99,102,241,0.04)' }}>
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#d1d5db' }} />
                          <span className="text-xs font-semibold" style={{ color: '#9ca3af' }}>Belum ada absensi hari ini</span>
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
        <div className="glass-card overflow-hidden">
          <div className="px-6 py-5" style={{ borderBottom: '1px solid rgba(229,231,235,0.4)', background: 'linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.04) 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Daftarkan Siswa Baru</h3>
                <p className="text-xs mt-0.5" style={{ color: '#6b7280' }}>
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
