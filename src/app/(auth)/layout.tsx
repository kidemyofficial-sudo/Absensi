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
    <div className="min-h-screen bg-gray-50 px-4 pt-4 pb-6 flex flex-col items-center">
      <div className="w-full max-w-md">
        {/*
          Logo PNG is 500x500 (square). The visible "Kidemy Learn & Grow" graphic
          sits in the middle ~40% of the image, with ~30% transparent padding top and bottom.
          At display width 260px → total height = 260px.
          Transparent top = ~78px, visible content = ~104px, transparent bottom = ~78px.
          We crop with a fixed-height container + overflow-hidden + negative marginTop.
        */}
        <div style={{ height: '110px', overflow: 'hidden', textAlign: 'center', marginBottom: '12px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image/kidemy logo.png"
            alt="Kidemy Logo"
            style={{
              width: '280px',
              maxWidth: '100%',
              display: 'inline-block',
              marginTop: '-72px',
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
