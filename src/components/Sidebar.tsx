'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

interface User {
  id: string
  name: string
  role: string
}

interface SidebarProps {
  user: User
  mobile?: boolean
}

interface NavItem {
  href: string
  label: string
  icon: (props: { active: boolean }) => React.ReactNode
}

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      style={{ color: active ? '#6366f1' : '#9ca3af' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
    </svg>
  )
}

function SchoolIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      style={{ color: active ? '#6366f1' : '#9ca3af' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.436 60.436 0 00-.491 6.347A48.627 48.627 0 0112 20.904a48.627 48.627 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.57 50.57 0 00-2.658-.813A59.905 59.905 0 0112 3.493a59.902 59.902 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.697 50.697 0 0112 13.489a50.702 50.702 0 017.74-3.342M6.75 15a.75.75 0 100-1.5.75.75 0 000 1.5zm0 0v-3.675A55.378 55.378 0 0112 8.443m-7.007 11.55A5.981 5.981 0 006.75 15.75v-1.5" />
    </svg>
  )
}

function TeacherIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      style={{ color: active ? '#6366f1' : '#9ca3af' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
    </svg>
  )
}

function StudentIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      style={{ color: active ? '#6366f1' : '#9ca3af' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
    </svg>
  )
}

function AttendanceIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      style={{ color: active ? '#6366f1' : '#9ca3af' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}

function ReportIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      style={{ color: active ? '#6366f1' : '#9ca3af' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  )
}

function MoneyIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      style={{ color: active ? '#6366f1' : '#9ca3af' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z" />
    </svg>
  )
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      style={{ color: active ? '#6366f1' : '#9ca3af' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}
      style={{ color: active ? '#6366f1' : '#9ca3af' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12V15zm0 2.25h.008v.008H12v-.008zM9.75 15h.008v.008H9.75V15zm0 2.25h.008v.008H9.75v-.008zM7.5 15h.008v.008H7.5V15zm0 2.25h.008v.008H7.5v-.008zm6.75-4.5h.008v.008h-.008v-.008zm0 2.25h.008v.008h-.008V15zm0 2.25h.008v.008h-.008v-.008zm2.25-4.5h.008v.008H16.5v-.008zm0 2.25h.008v.008H16.5V15z" />
    </svg>
  )
}

const ownerNav = {
  sections: [
    {
      label: 'Menu Utama',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
        { href: '/cabang-daerah', label: 'Cabang Daerah', icon: SchoolIcon },
        { href: '/guru', label: 'Guru', icon: TeacherIcon },
        { href: '/students', label: 'Siswa', icon: StudentIcon },
      ] as NavItem[],
    },
    {
      label: 'Aktivitas',
      items: [
        { href: '/attendance', label: 'Absensi', icon: AttendanceIcon },
        { href: '/reports', label: 'Laporan', icon: ReportIcon },
        { href: '/pendapatan', label: 'Pendapatan', icon: MoneyIcon },
        { href: '/pengaturan-bagi-hasil', label: 'Pengaturan Bagi Hasil', icon: MoneyIcon },
      ] as NavItem[],
    },
    {
      label: 'Pengaturan',
      items: [
        { href: '/settings', label: 'Settings', icon: SettingsIcon },
      ] as NavItem[],
    },
  ],
}

const guruNav = {
  sections: [
    {
      label: 'Menu Utama',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
      ] as NavItem[],
    },
    {
      label: 'Aktivitas',
      items: [
        { href: '/attendance', label: 'Input Absensi', icon: AttendanceIcon },
        { href: '/reports', label: 'Laporan', icon: ReportIcon },
        { href: '/pendapatan', label: 'Pendapatan', icon: MoneyIcon },
        { href: '/schedule', label: 'K Schedule', icon: CalendarIcon },
      ] as NavItem[],
    },
    {
      label: 'Pengaturan',
      items: [
        { href: '/settings', label: 'Settings', icon: SettingsIcon },
      ] as NavItem[],
    },
  ],
}

const orangTuaNav = {
  sections: [
    {
      label: 'Menu Utama',
      items: [
        { href: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
      ] as NavItem[],
    },
    {
      label: 'Aktivitas',
      items: [
        { href: '/reports', label: 'Laporan Anak', icon: ReportIcon },
      ] as NavItem[],
    },
    {
      label: 'Pengaturan',
      items: [
        { href: '/settings', label: 'Settings', icon: SettingsIcon },
      ] as NavItem[],
    },
  ],
}

const navConfigs: Record<string, typeof ownerNav> = {
  OWNER: ownerNav,
  GURU: guruNav,
  ORANG_TUA: orangTuaNav,
}

const roleLabels: Record<string, string> = {
  OWNER: 'Owner',
  GURU: 'Guru',
  ORANG_TUA: 'Wali Murid',
}

// Role accent colors for avatar
const roleColors: Record<string, string> = {
  OWNER: 'linear-gradient(135deg, #f59e0b, #ef4444)',
  GURU: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
  ORANG_TUA: 'linear-gradient(135deg, #10b981, #0d9488)',
}

function SidebarContent({ user, pathname, onNavigate, isCollapsed, setIsCollapsed }: { user: User; pathname: string; onNavigate?: () => void; isCollapsed?: boolean; setIsCollapsed?: (v: boolean) => void }) {
  const [search, setSearch] = useState('')
  const navConfig = navConfigs[user.role] || ownerNav
  const roleLabel = roleLabels[user.role] || user.role

  const filteredSections = navConfig.sections.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      item.label.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((section) => section.items.length > 0)

  return (
    <div className="flex flex-col h-full">
      {/* Logo & Toggle */}
      <div className={`px-5 py-5 flex items-center ${isCollapsed ? 'flex-col justify-center gap-2' : 'justify-between'}`} style={{ borderBottom: '1px solid rgba(229,231,235,0.35)' }}>
        <div className="flex items-center gap-3">
          <Image src="/image/kidemy.webp" alt="Kidemy" width={40} height={40}
            className="w-10 h-10 rounded-2xl object-cover shadow-sm flex-shrink-0" />
          {!isCollapsed && (
            <div>
              <h1 className="text-sm font-bold truncate" style={{ color: '#1e1b4b' }}>Sistem Absensi</h1>
              <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8b5cf6' }}>{roleLabel}</p>
            </div>
          )}
        </div>
        {!isCollapsed && setIsCollapsed && (
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-all hidden sm:block"
            title="Sembunyikan Sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {isCollapsed && setIsCollapsed && (
          <button
            onClick={() => setIsCollapsed(false)}
            className="p-1 rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all flex items-center justify-center"
            title="Tampilkan Sidebar"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Search */}
      {!isCollapsed && (
        <div className="px-4 py-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: '#9ca3af' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Cari menu..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl transition-all outline-none"
              style={{
                background: 'rgba(249,250,251,0.8)',
                border: '1px solid rgba(229,231,235,0.6)',
                color: '#374151',
              }}
              onFocus={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.95)'
                e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.10)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.background = 'rgba(249,250,251,0.8)'
                e.currentTarget.style.borderColor = 'rgba(229,231,235,0.6)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto">
        {filteredSections.map((section) => (
          <div key={section.label} className="mb-5">
            {!isCollapsed && <p className="px-3 mb-2 nav-section-label">{section.label}</p>}
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      className={`group flex items-center ${isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'} rounded-xl text-sm font-medium transition-all duration-200`}
                      title={isCollapsed ? item.label : undefined}
                      style={active ? {
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))',
                        color: '#6366f1',
                        boxShadow: '0 2px 8px rgba(99,102,241,0.12)',
                        borderLeft: active && !isCollapsed ? '3px solid #6366f1' : 'none',
                      } : {
                        color: '#6b7280',
                      }}
                      onMouseEnter={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'rgba(99,102,241,0.06)'
                          e.currentTarget.style.color = '#6366f1'
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!active) {
                          e.currentTarget.style.background = 'transparent'
                          e.currentTarget.style.color = '#6b7280'
                        }
                      }}
                    >
                      {item.icon({ active })}
                      {!isCollapsed && <span style={{ color: active ? '#6366f1' : 'inherit' }}>{item.label}</span>}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User Info at bottom */}
      <div className="px-4 py-4" style={{ borderTop: '1px solid rgba(229,231,235,0.35)' }}>
        <div className={`flex items-center ${isCollapsed ? 'justify-center p-2' : 'gap-3 p-2.5'} rounded-xl`} style={{ background: 'rgba(99,102,241,0.05)' }}>
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{ background: roleColors[user.role] || roleColors.GURU }}
          >
            <span className="text-xs font-bold text-white">{user.name.charAt(0).toUpperCase()}</span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate" style={{ color: '#1e1b4b' }}>{user.name}</p>
              <p className="text-[10px] font-medium" style={{ color: '#8b5cf6' }}>{roleLabel}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}export default function Sidebar({ user, mobile }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const roleLabel = roleLabels[user.role] || user.role

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed')
    if (saved === 'true') {
      setIsCollapsed(true)
    }
  }, [])

  const handleSetCollapsed = (val: boolean) => {
    setIsCollapsed(val)
    localStorage.setItem('sidebar_collapsed', String(val))
  }

  const sidebarStyle = {
    background: 'rgba(255,255,255,0.82)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    borderRight: '1px solid rgba(229,231,235,0.4)',
  }

  if (mobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl transition-all"
          style={{ color: '#6b7280' }}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            )}
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-40 transition-opacity"
              style={{ background: 'rgba(15,10,40,0.4)', backdropFilter: 'blur(4px)' }}
              onClick={() => setIsOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-72 z-50 flex flex-col shadow-2xl" style={sidebarStyle}>
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid rgba(229,231,235,0.35)' }}>
                <div className="flex items-center gap-2.5">
                  <Image src="/image/kidemy.webp" alt="Kidemy" width={36} height={36} className="w-9 h-9 rounded-xl object-cover shadow-sm" />
                  <div>
                    <h1 className="text-sm font-bold" style={{ color: '#1e1b4b' }}>Sistem Absensi</h1>
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#8b5cf6' }}>{roleLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ color: '#9ca3af' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SidebarContent user={user} pathname={pathname} onNavigate={() => setIsOpen(false)} />
            </div>
          </>
        )}
      </>
    )
  }

  return (
    <aside className={`hidden sm:flex min-h-screen flex-shrink-0 flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'}`} style={sidebarStyle}>
      <SidebarContent user={user} pathname={pathname} isCollapsed={isCollapsed} setIsCollapsed={handleSetCollapsed} />
    </aside>
  )
}
