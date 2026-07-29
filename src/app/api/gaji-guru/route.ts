import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang dapat mengakses fitur ini' }, { status: 403 })
  }

  const { searchParams } = new URL(request.url)
  const now = new Date()
  const bulan = searchParams.get('bulan') ? Number(searchParams.get('bulan')) : now.getMonth() + 1
  const tahun = searchParams.get('tahun') ? Number(searchParams.get('tahun')) : now.getFullYear()

  const startDate = new Date(tahun, bulan - 1, 1)
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999)

  try {
    // Ambil semua LessonRevenue periode ini, grouped by guru
    const revenues = await prisma.lessonRevenue.findMany({
      where: {
        lesson: {
          tanggalLes: { gte: startDate, lte: endDate },
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            guruId: true,
            namaGuru: true,
            whatsappGuru: true,
            tanggalLes: true,
            namaMurid: true,
            jumlahMurid: true,
            jenisPembelajaran: true,
            jamMulai: true,
            jamSelesai: true,
            biayaPerSiswa: true,
          },
        },
      },
    })

    // Ambil user info untuk semua guru yang muncul
    const guruIds = [...new Set(revenues.map((r) => r.lesson.guruId))]

    const guruUsers = await prisma.user.findMany({
      where: { id: { in: guruIds } },
      select: { id: true, name: true, phone: true },
    })
    const guruMap = new Map(guruUsers.map((g) => [g.id, g]))

    // Ambil status pembayaran dari TeacherPayment
    const payments = await prisma.teacherPayment.findMany({
      where: {
        guruId: { in: guruIds },
        bulan,
        tahun,
      },
    })
    const paymentMap = new Map(payments.map((p) => [p.guruId, p]))

    // Aggregate per guru
    const gajiMap = new Map<string, {
      guruId: string
      namaGuru: string
      whatsappGuru: string
      phoneGuru: string
      jumlahLes: number
      totalBiayaLes: number
      totalGajiGuru: number
      totalBagianOwner: number
      isPaid: boolean
      paidAt: Date | null
      paymentId: string | null
    }>()

    for (const rev of revenues) {
      const { guruId, namaGuru, whatsappGuru } = rev.lesson
      const guruUser = guruMap.get(guruId)
      if (!gajiMap.has(guruId)) {
        gajiMap.set(guruId, {
          guruId,
          namaGuru,
          whatsappGuru,
          phoneGuru: guruUser?.phone ?? '',
          jumlahLes: 0,
          totalBiayaLes: 0,
          totalGajiGuru: 0,
          totalBagianOwner: 0,
          isPaid: paymentMap.get(guruId)?.isPaid ?? false,
          paidAt: paymentMap.get(guruId)?.paidAt ?? null,
          paymentId: paymentMap.get(guruId)?.id ?? null,
        })
      }

      const entry = gajiMap.get(guruId)!
      entry.jumlahLes += 1
      entry.totalBiayaLes += rev.biayaTotal
      entry.totalGajiGuru += rev.pendapatanGuru
      entry.totalBagianOwner += rev.pendapatanOwner
    }

    const gajiList = Array.from(gajiMap.values()).sort((a, b) =>
      a.namaGuru.localeCompare(b.namaGuru)
    )

    const totalGajiSemua = gajiList.reduce((s, g) => s + g.totalGajiGuru, 0)
    const totalBelumDibayar = gajiList
      .filter((g) => !g.isPaid)
      .reduce((s, g) => s + g.totalGajiGuru, 0)

    return NextResponse.json({
      gajiList,
      summary: {
        bulan,
        tahun,
        totalGuru: gajiList.length,
        totalGajiSemua,
        totalBelumDibayar,
        totalSudahDibayar: totalGajiSemua - totalBelumDibayar,
      },
    })
  } catch (err) {
    console.error('Gaji guru GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
