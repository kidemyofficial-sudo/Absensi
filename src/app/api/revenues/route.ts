import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const user = await getCurrentUser()

  if (!user) {
    return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const bulan = searchParams.get('bulan')
  const tahun = searchParams.get('tahun')

  const now = new Date()
  const targetBulan = bulan ? Number(bulan) : now.getMonth() + 1
  const targetTahun = tahun ? Number(tahun) : now.getFullYear()

  const startDate = new Date(targetTahun, targetBulan - 1, 1)
  const endDate = new Date(targetTahun, targetBulan, 0, 23, 59, 59, 999)

  const where: Record<string, unknown> = {
    lesson: {
      tanggalLes: {
        gte: startDate,
        lte: endDate,
      },
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

  // Hitung total
  const totalBiaya = revenues.reduce((sum, r) => sum + r.biayaTotal, 0)
  const totalPendapatanOwner = revenues.reduce((sum, r) => sum + r.pendapatanOwner, 0)
  const totalPendapatanGuru = revenues.reduce((sum, r) => sum + r.pendapatanGuru, 0)
  const totalLes = revenues.length

  return NextResponse.json({
    revenues,
    summary: {
      totalBiaya,
      totalPendapatanOwner,
      totalPendapatanGuru,
      totalLes,
      bulan: targetBulan,
      tahun: targetTahun,
    },
  })
}
