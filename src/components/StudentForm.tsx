import { registerStudent } from '@/app/(dashboard)/dashboard/actions'

export default function StudentForm() {
  return (
    <form action={registerStudent}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Nama Lengkap
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
            placeholder="Nama lengkap siswa"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Tempat, Tanggal Lahir
          </label>
          <input
            type="text"
            name="ttl"
            required
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
            placeholder="contoh: Jakarta, 1 Januari 2010"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Domisili
          </label>
          <input
            type="text"
            name="domisili"
            required
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
            placeholder="Alamat domisili"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Asal Sekolah
          </label>
          <input
            type="text"
            name="asalSekolah"
            required
            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black bg-white transition-all"
            placeholder="Nama sekolah asal"
          />
        </div>
      </div>
      <button
        type="submit"
        className="mt-5 bg-blue-600 text-white px-6 py-2.5 rounded-xl hover:bg-blue-700 text-sm font-medium transition-colors"
      >
        Daftarkan Siswa
      </button>
    </form>
  )
}
