import { registerStudent } from '@/app/(dashboard)/dashboard/actions'

export default function StudentForm() {
  return (
    <form action={registerStudent}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nama Lengkap Siswa
          </label>
          <input
            type="text"
            name="name"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Masukkan nama siswa"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            NIS (Nomor Induk Siswa)
          </label>
          <input
            type="text"
            name="nis"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            placeholder="Masukkan NIS"
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
