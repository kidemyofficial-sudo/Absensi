'use client'

export default function Error({
  reset,
}: {
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center glass-bg p-4">
      <div className="text-center p-8 glass-card max-w-md w-full">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(239,68,68,0.1)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1e1b4b' }}>Terjadi Kesalahan</h2>
        <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Silakan coba lagi atau hubungi admin jika masalah berlanjut.</p>
        <button
          onClick={() => reset()}
          className="btn-primary w-full sm:w-auto"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
