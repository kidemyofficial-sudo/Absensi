import type { Metadata } from 'next'

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
    <div
      className="min-h-screen glass-bg px-4 pt-6 pb-8 flex flex-col items-center justify-center"
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div style={{ height: '110px', overflow: 'hidden', textAlign: 'center', marginBottom: '20px' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/image/kidemy logo.png"
            alt="Kidemy Logo"
            style={{
              width: '280px',
              maxWidth: '100%',
              display: 'inline-block',
              marginTop: '-72px',
              filter: 'drop-shadow(0 4px 12px rgba(99,102,241,0.15))',
            }}
            loading="eager"
          />
        </div>

        {/* Glass Card */}
        <div
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.55)',
            borderRadius: '24px',
            boxShadow: '0 20px 60px rgba(99,102,241,0.14), 0 4px 16px rgba(0,0,0,0.06)',
            padding: '36px 32px',
          }}
        >
          {children}
        </div>

        {/* Footer hint */}
        <p className="text-center text-xs mt-6" style={{ color: '#9ca3af' }}>
          © 2024 Kidemy · Sistem Absensi Les Privat
        </p>
      </div>
    </div>
  )
}
