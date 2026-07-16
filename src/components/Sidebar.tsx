'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface User {
  id: string
  name: string
  role: string
}

interface SidebarProps {
  user: User
  mobile?: boolean
}

const navItems = {
  OWNER: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/students', label: 'Siswa', icon: '👤' },
    { href: '/guru', label: 'Guru', icon: '👨‍🏫' },
    { href: '/kelas', label: 'Kelas', icon: '🏫' },
    { href: '/attendance', label: 'Absensi', icon: '📝' },
    { href: '/reports', label: 'Laporan', icon: '📈' },
    { href: '/settings', label: 'Pengaturan', icon: '⚙️' },
  ],
  GURU: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/attendance', label: 'Input Absensi', icon: '📝' },
    { href: '/reports', label: 'Laporan', icon: '📈' },
    { href: '/settings', label: 'Pengaturan', icon: '⚙️' },
  ],
  ORANG_TUA: [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/reports', label: 'Laporan Anak', icon: '📈' },
    { href: '/settings', label: 'Pengaturan', icon: '⚙️' },
  ],
}

export default function Sidebar({ user, mobile }: SidebarProps) {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  const items = navItems[user.role as keyof typeof navItems] || []

  // Mobile hamburger button
  if (mobile) {
    return (
      <>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>

        {isOpen && (
          <>
            <div
              className="fixed inset-0 bg-black bg-opacity-50 z-40"
              onClick={() => setIsOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50">
              <div className="p-4 border-b">
                <div className="flex justify-between items-center">
                  <h1 className="text-xl font-bold text-gray-900">Sistem Absensi</h1>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-1">{user.role}</p>
              </div>
              <nav className="p-4">
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          pathname === item.href
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          </>
        )}
      </>
    )
  }

  // Desktop sidebar
  return (
    <aside className="hidden sm:block w-64 bg-white shadow-sm min-h-screen flex-shrink-0">
      <div className="p-4 border-b">
        <h1 className="text-xl font-bold text-gray-900">Sistem Absensi</h1>
        <p className="text-sm text-gray-500 mt-1">{user.role}</p>
      </div>
      <nav className="p-4">
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
