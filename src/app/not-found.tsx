export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center glass-bg p-4">
      <div className="text-center p-8 glass-card max-w-md w-full">
        <div className="text-7xl font-extrabold mb-4 gradient-text">404</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#1e1b4b' }}>Halaman Tidak Ditemukan</h2>
        <p className="text-sm mb-6" style={{ color: '#6b7280' }}>Halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
        <a
          href="/dashboard"
          className="btn-primary inline-flex"
        >
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  )
}
