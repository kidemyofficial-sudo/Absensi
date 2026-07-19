'use client'

import { useEffect } from 'react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[Dashboard Error Boundary]', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="p-8 max-w-lg mx-auto">
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-red-800 mb-2">Dashboard gagal dimuat</h2>
        <p className="text-sm text-red-600 mb-1">
          Terjadi kesalahan saat memuat halaman dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-red-400 font-mono mb-4">
            Error ID: {error.digest}
          </p>
        )}
        <p className="text-xs text-red-500 mb-4 font-mono break-all">
          {error.message}
        </p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      </div>
    </div>
  )
}
