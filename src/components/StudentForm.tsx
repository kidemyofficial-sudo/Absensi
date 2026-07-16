import { registerStudent } from '@/app/(dashboard)/dashboard/actions'

export default function StudentForm() {
  return (
    <form action={registerStudent}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lengkap
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Nama lengkap siswa"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tempat, Tanggal Lahir
          </label>
          <input
            type="text"
            name="ttl"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="contoh: Jakarta, 1 Januari 2010"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Domisili
          </label>
          <input
            type="text"
            name="domisili"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Alamat domisili"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Asal Sekolah
          </label>
          <input
            type="text"
            name="asalSekolah"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Nama sekolah asal"
          />
        </div>
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
      >
        Daftarkan Siswa
      </button>
    </form>
  )
}
