import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PendapatanPrintButton from '@/components/PendapatanPrintButton'

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
    console.error('Prisma error in pendapatan page findMany:', err)
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

  // Serialize revenues for client component (Date → string)
  const serializedRevenues = revenues.map((r) => ({
    id: r.id,
    biayaTotal: r.biayaTotal,
    pendapatanOwner: r.pendapatanOwner,
    pendapatanGuru: r.pendapatanGuru,
    lesson: {
      tanggalLes: r.lesson.tanggalLes.toISOString(),
      jenisPembelajaran: r.lesson.jenisPembelajaran,
      namaGuru: r.lesson.namaGuru,
      namaMurid: r.lesson.namaMurid,
      jumlahMurid: r.lesson.jumlahMurid,
    },
  }))

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#1e1b4b' }}>Pendapatan</h1>
          <p className="text-sm mt-1" style={{ color: '#6b7280' }}>Detail pendapatan bulanan</p>
        </div>
        <PendapatanPrintButton
          revenues={serializedRevenues}
          role={user.role}
          userName={user.name}
          bulan={bulan}
          totalPendapatan={totalPendapatan}
        />
      </div>

      {/* Summary card */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 4px 15px rgba(16,185,129,0.2)' }}>
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="white" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-base font-bold" style={{ color: '#1e1b4b' }}>
            {user.role === 'OWNER' ? 'Estimasi Pendapatan Owner' : 'Estimasi Pendapatan'} {bulan}
          </h3>
        </div>
        <div className="inline-block mb-2">
          <p className="text-3xl font-extrabold" style={{ color: '#10b981' }}>{formatRupiah(totalPendapatan)}</p>
        </div>
        <p className="text-xs mt-1" style={{ color: '#8b5cf6' }}>
          {user.role === 'OWNER'
            ? 'Pendapatan bersih bagian Owner dari seluruh operasional les.'
            : 'Pembayaran dilakukan langsung ke rekening Anda.'}
        </p>
      </div>

      {/* Detail table */}
      <div className="glass-card overflow-hidden">
        <div className="px-6 py-4.5" style={{ borderBottom: '1px solid rgba(229,231,235,0.45)' }}>
          <h3 className="text-base font-bold" style={{ color: '#1e1b4b' }}>Detail Per Les</h3>
        </div>
        <div className="p-0 sm:p-4">
          {revenues.length === 0 ? (
            <p className="p-6 text-sm text-center" style={{ color: '#9ca3af' }}>Belum ada data les bulan ini.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="glass-table min-w-[800px] w-full">
                <thead>
                  <tr>
                    {user.role === 'OWNER' ? (
                      <>
                        <th>Tanggal</th>
                        <th>Jenis Les</th>
                        <th>Guru</th>
                        <th>Murid</th>
                        <th>Jumlah Siswa</th>
                        <th>Total Biaya</th>
                        <th>Bagi Hasil Owner</th>
                        <th>Bagi Hasil Guru</th>
                      </>
                    ) : (
                      <>
                        <th>Tanggal</th>
                        <th>Jenis Les</th>
                        <th>Murid</th>
                        <th>Jumlah Siswa</th>
                        <th>Salary</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {revenues.map((rev) => (
                    <tr key={rev.id}>
                      <td className="whitespace-nowrap font-medium" style={{ color: '#374151' }}>{formatDate(rev.lesson.tanggalLes)}</td>
                      <td style={{ color: '#4b5563' }}>{rev.lesson.jenisPembelajaran}</td>
                      {user.role === 'OWNER' && (
                        <td className="font-medium" style={{ color: '#1e1b4b' }}>{rev.lesson.namaGuru}</td>
                      )}
                      <td className="font-medium" style={{ color: '#1e1b4b' }}>{rev.lesson.namaMurid}</td>
                      <td style={{ color: '#4b5563' }}>{rev.lesson.jumlahMurid}</td>
                      {user.role === 'OWNER' ? (
                        <>
                          <td style={{ color: '#4b5563' }}>{formatRupiah(rev.biayaTotal)}</td>
                          <td className="font-bold" style={{ color: '#6366f1' }}>{formatRupiah(rev.pendapatanOwner)}</td>
                          <td className="font-bold" style={{ color: '#10b981' }}>{formatRupiah(rev.pendapatanGuru)}</td>
                        </>
                      ) : (
                        <td className="font-bold" style={{ color: '#10b981' }}>{formatRupiah(rev.pendapatanGuru)}</td>
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
