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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex flex-col items-center gap-3">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden shadow-md">
              <Image
                src="/image/kidemy logo.png"
                alt="Kidemy Logo"
                fill
                className="object-cover"
                priority
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Kidemy</h1>
              <p className="text-sm text-blue-600 font-medium mt-0.5">Learn and Grow</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
