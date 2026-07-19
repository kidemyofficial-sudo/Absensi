import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export default async function PendapatanPage() {
  const user = await getCurrentUser()

  if (!user) return null

  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999)

  const where: Record<string, unknown> = {
    lesson: { tanggalLes: { gte: startOfMonth, lte: endOfMonth } },
  }

  if (user.role === 'GURU') {
    where.lesson = { ...where.lesson as Record<string, unknown>, guruId: user.id }
  }

  let revenues: any[] = []

  try {
    revenues = await prisma.lessonRevenue.findMany({
      where,
      include: {
        lesson: {
          select: {
            id: true, tanggalLes: true, namaGuru: true, guruId: true,
            jumlahMurid: true, namaMurid: true, jenisPembelajaran: true,
          },
        },
      },
      orderBy: { lesson: { tanggalLes: 'desc' } },
    })
  } catch (err) {
    console.error("Prisma error in pendapatan page findMany:", err)
  }


  const totalPendapatan = revenues.reduce((sum, r) => {
    return sum + (user.role === 'OWNER' ? r.pendapatanOwner : r.pendapatanGuru)
  }, 0)

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
  }

  const bulan = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(now)

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Pendapatan</h1>
        <p className="text-sm text-gray-500 mt-1">Detail pendapatan bulanan</p>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-semibold text-gray-900">
            {user.role === 'OWNER' ? 'Estimasi Pendapatan Owner' : 'Estimasi Pendapatan'} {bulan}
          </h3>
        </div>
        <p className="text-3xl font-bold text-green-600 mb-2">{formatRupiah(totalPendapatan)}</p>
        <p className="text-sm text-gray-500">
          {user.role === 'OWNER'
            ? 'Pendapatan bersih bagian Owner dari seluruh operasional les.'
            : 'Pembayaran dilakukan langsung ke rekening Anda.'}
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-semibold text-gray-900">Detail Per Les</h3>
        </div>
        <div className="p-6">
          {revenues.length === 0 ? (
            <p className="text-sm text-gray-500">Belum ada data les bulan ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100">
                    {user.role === 'OWNER' ? (
                      <>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Les</th>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guru</th>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Murid</th>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Siswa</th>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Biaya</th>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bagi Hasil Owner</th>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bagi Hasil Guru</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jenis Les</th>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Murid</th>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jumlah Siswa</th>
                        <th className="px-4 py-3.5 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Salary</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {revenues.map((rev) => (
                    <tr key={rev.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3.5 text-sm text-gray-900">{formatDate(rev.lesson.tanggalLes)}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">{rev.lesson.jenisPembelajaran}</td>
                      {user.role === 'OWNER' && (
                        <td className="px-4 py-3.5 text-sm text-gray-900">{rev.lesson.namaGuru}</td>
                      )}
                      <td className="px-4 py-3.5 text-sm text-gray-900">{rev.lesson.namaMurid}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-600">{rev.lesson.jumlahMurid}</td>
                      {user.role === 'OWNER' ? (
                        <>
                          <td className="px-4 py-3.5 text-sm text-gray-600">{formatRupiah(rev.biayaTotal)}</td>
                          <td className="px-4 py-3.5 text-sm font-medium text-blue-600">{formatRupiah(rev.pendapatanOwner)}</td>
                          <td className="px-4 py-3.5 text-sm font-medium text-green-600">{formatRupiah(rev.pendapatanGuru)}</td>
                        </>
                      ) : (
                        <td className="px-4 py-3.5 text-sm font-medium text-green-600">{formatRupiah(rev.pendapatanGuru)}</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
