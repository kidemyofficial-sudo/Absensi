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
    <div className="h-screen bg-gray-50 flex overflow-hidden">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="bg-white border-b border-gray-200 h-14 flex items-center justify-between px-4 sm:px-6 flex-shrink-0">
          <div className="sm:hidden">
            <Sidebar user={user} mobile />
          </div>
          <div className="hidden sm:block"></div>
          <div className="flex items-center gap-3">
            {user.role === 'ORANG_TUA' && <NotificationBell />}
            <div className="flex items-center gap-2.5 pl-3 border-l border-gray-200">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-blue-700">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:inline">{user.name}</span>
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
