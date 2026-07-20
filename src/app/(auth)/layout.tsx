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
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md my-auto flex flex-col items-center">
        <div className="text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image/kidemy logo.png"
            alt="Kidemy Logo"
            style={{
              width: '260px',
              maxWidth: '100%',
              display: 'inline-block',
              marginBottom: '-28px',
              marginTop: '-10px'
            }}
            loading="eager"
          />
        </div>
        <div className="w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 mt-2">
          {children}
        </div>
      </div>
    </div>
  )
}
