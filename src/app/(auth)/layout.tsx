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
    <div className="min-h-screen bg-gray-50 px-4 pt-3 pb-8 flex flex-col items-center">
      <div className="w-full max-w-md">
        {/* Logo — PNG has large internal transparent padding top & bottom, use negative margins to crop it */}
        <div className="text-center overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image/kidemy logo.png"
            alt="Kidemy Logo"
            style={{
              width: '260px',
              maxWidth: '100%',
              display: 'inline-block',
              marginTop: '-30px',
              marginBottom: '-36px',
            }}
            loading="eager"
          />
        </div>
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
