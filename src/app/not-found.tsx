export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8 bg-white rounded-2xl shadow-sm max-w-md">
        <div className="text-6xl font-bold text-gray-200 mb-4">404</div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Halaman Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">Halaman yang Anda cari tidak ada atau telah dipindahkan.</p>
        <a
          href="/dashboard"
          className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition-colors inline-block"
        >
          Kembali ke Dashboard
        </a>
      </div>
    </div>
  )
}
