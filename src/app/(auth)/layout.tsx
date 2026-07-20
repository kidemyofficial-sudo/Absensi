import type { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Masuk ke Akun',
  description: 'Login ke platform Kidemy — sistem absensi les privat untuk guru, orang tua, dan admin.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center">
          {/* Gunakan img biasa agar bisa pakai width 100% tanpa terbatas aspect ratio container */}
          {/* Logo PNG memiliki transparent padding internal — kita beri width penuh agar nampak besar */}
          {/* Gunakan negative margin bottom untuk merapatkan jarak transparan di dalam PNG */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image/kidemy logo.png"
            alt="Kidemy Logo"
            style={{
              width: '260px',
              maxWidth: '100%',
              display: 'inline-block',
              marginBottom: '-35px',
              marginTop: '-15px'
            }}
            loading="eager"
          />
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
