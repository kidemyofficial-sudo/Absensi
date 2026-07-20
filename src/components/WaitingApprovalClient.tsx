'use client'

import { useRouter } from 'next/navigation'

interface WaitingApprovalClientProps {
  userName: string
  roleText: string
  waUrl: string
}

export default function WaitingApprovalClient({ userName, roleText, waUrl }: WaitingApprovalClientProps) {
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      router.push('/login')
      router.refresh()
    } catch (err) {
      console.error('Gagal keluar:', err)
    }
  }

  return (
    <div className="flex flex-col items-center text-center">
      {/* Icon Jam Pasir Animasi */}
      <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-amber-100 relative">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500"></span>
        </span>
      </div>

      <h2 className="text-xl font-bold mb-2" style={{ color: '#1e1b4b' }}>
        Menunggu Persetujuan Admin ⏳
      </h2>
      <p className="text-sm mb-6 text-gray-500 max-w-sm">
        Halo <span className="font-semibold text-gray-800">{userName}</span>, pendaftaran Anda sebagai <span className="font-semibold text-indigo-600">{roleText}</span> telah berhasil. Akun Anda saat ini sedang menunggu persetujuan (ACC) dari Admin/Owner sebelum Anda dapat mengakses dashboard.
      </p>

      {/* Button Hubungi Admin via WA */}
      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full btn-primary flex items-center justify-center gap-2 mb-4 shadow-lg hover:shadow-xl transition-all"
        style={{
          background: 'linear-gradient(135deg, #22c55e, #10b981)',
          borderColor: '#10b981',
          padding: '0.75rem 1.5rem',
          fontSize: '0.9375rem',
        }}
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.472 14.382c-.024-.014-.507-.25-5.863-2.906-.118-.058-.236-.088-.34-.088-.19 0-.373.08-.5.22l-1.12 1.4c-.033.04-.087.062-.143.062-.036 0-.07-.008-.103-.024-.19-.074-.75-.296-1.425-.903-.524-.468-.878-1.047-.98-1.228-.032-.055-.028-.108-.002-.146.035-.05.15-.175.226-.263l.366-.438c.045-.055.068-.12.064-.183-.004-.065-.034-.127-.085-.17l-.888-.888c-.092-.092-.25-.136-.37-.085l-1.025.43c-.2.083-.348.242-.4.442-.1.4-.413 1.956.406 3.738.56 1.22 1.543 2.296 2.766 2.973.812.45 1.53.645 2.13.645.41 0 .762-.09 1.05-.27l1.025-.56c.15-.08.24-.23.23-.39-.01-.06-.03-.13-.07-.18l-.888-.89zM12 2C6.48 2 2 6.48 2 12c0 2.17.7 4.19 1.94 5.86L2.6 21.4c-.12.33-.02.7.23.95.18.18.43.27.67.27.1 0 .19-.01.28-.04l3.54-1.34C8.98 22.09 10.45 22.5 12 22.5c5.52 0 10-4.48 10-10S17.52 2 12 2zm0 18.5c-1.74 0-3.41-.5-4.84-1.45-.1-.07-.23-.09-.34-.05l-2.48.94.94-2.48c.04-.1.02-.23-.05-.34C4.28 15.68 3.5 13.9 3.5 12c0-4.69 3.81-8.5 8.5-8.5s8.5 3.81 8.5 8.5-3.81 8.5-8.5 8.5z" />
        </svg>
        Hubungi Admin via WhatsApp
      </a>

      {/* Button Keluar */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border border-gray-200 text-gray-500 hover:bg-gray-50 active:bg-gray-100"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
        </svg>
        Keluar & Ganti Akun
      </button>
    </div>
  )
}
