import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import LogoutButton from '@/components/LogoutButton'
import Sidebar from '@/components/Sidebar'
import NotificationBell from '@/components/NotificationBell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white shadow-sm h-16 flex items-center justify-between px-4 sm:px-6">
          <div className="sm:hidden">
            <Sidebar user={user} mobile />
          </div>
          <div className="hidden sm:block"></div>
          <div className="flex items-center gap-2 sm:gap-4">
            {user.role === 'ORANG_TUA' && <NotificationBell />}
            <span className="text-sm text-gray-600 hidden sm:inline">
              {user.name}
            </span>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
