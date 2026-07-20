import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'
import SmartNotifier from '@/components/SmartNotifier'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Kelola absensi les privat, siswa, laporan, dan pendapatan guru di platform Kidemy.',
  robots: { index: false, follow: false },
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  if (user.status !== 'APPROVED') {
    redirect('/waiting-approval')
  }

  return (
    <div className="h-screen flex overflow-hidden glass-bg">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Glass Header */}
        <header
          style={{
            background: 'rgba(255,255,255,0.70)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(229,231,235,0.45)',
            flexShrink: 0,
          }}
          className="h-14 flex items-center justify-between px-4 sm:px-6 shadow-sm"
        >
          <div className="sm:hidden">
            <Sidebar user={user} mobile />
          </div>
          <div className="hidden sm:block" />
          <div className="flex items-center gap-3">
            {user.role === 'GURU' && <SmartNotifier />}
            {user.role === 'ORANG_TUA' && <NotificationBell />}
            {/* Avatar */}
            <div className="flex items-center gap-2.5 pl-3" style={{ borderLeft: '1px solid rgba(209,213,219,0.5)' }}>
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              >
                <span className="text-sm font-semibold text-white">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium hidden sm:inline" style={{ color: '#374151' }}>{user.name}</span>
            </div>
            <LogoutButton />
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
