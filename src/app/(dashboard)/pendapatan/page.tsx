import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function PendapatanPage() {
  const user = await getCurrentUser()

  if (!user) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const where: Record<string, unknown> = {
    lesson: {
      tanggalLes: { gte: startOfMonth, lte: endOfMonth },
    },
  }

  // Guru hanya bisa lihat pendapatan sendiri
  if (user.role === 'GURU') {
    where.lesson = {
      ...where.lesson as Record<string, unknown>,
      guruId: user.id,
    }
  }

  const revenues = await prisma.lessonRevenue.findMany({
    where,
    include: {
      lesson: {
        select: {
          id: true,
          tanggalLes: true,
          namaGuru: true,
          guruId: true,
          jumlahMurid: true,
          namaMurid: true,
          jenisPembelajaran: true,
        },
      },
    },
    orderBy: {
      lesson: {
        tanggalLes: 'desc',
      },
    },
  })

  const totalPendapatan = revenues.reduce((sum, r) => sum + r.pendapatanGuru, 0)

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(date))
  }

  const bulan = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now)

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Pendapatan</h2>

      {/* Summary */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Estimasi Pendapatan {bulan}</h3>
        <p className="text-4xl font-bold text-green-600 mb-2">{formatRupiah(totalPendapatan)}</p>
        <p className="text-sm text-gray-500">Pembayaran dilakukan langsung ke rekening Anda.</p>
      </div>

      {/* Detail Table */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Detail Per Les</h3>
        {revenues.length === 0 ? (
          <p className="text-gray-500">Belum ada data les bulan ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jenis Les</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Murid</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jumlah Siswa</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Biaya</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bagi Hasil Guru</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {revenues.map((rev) => (
                  <tr key={rev.id}>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatDate(rev.lesson.tanggalLes)}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{rev.lesson.jenisPembelajaran}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{rev.lesson.namaMurid}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{rev.lesson.jumlahMurid}</td>
                    <td className="px-4 py-3 text-sm text-gray-900">{formatRupiah(rev.biayaTotal)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-green-600">{formatRupiah(rev.pendapatanGuru)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
