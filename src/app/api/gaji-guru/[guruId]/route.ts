import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ guruId: string }> }
) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang dapat mengakses fitur ini' }, { status: 403 })
  }

  const { guruId } = await params
  const { searchParams } = new URL(request.url)
  const now = new Date()
  const bulan = searchParams.get('bulan') ? Number(searchParams.get('bulan')) : now.getMonth() + 1
  const tahun = searchParams.get('tahun') ? Number(searchParams.get('tahun')) : now.getFullYear()

  const startDate = new Date(tahun, bulan - 1, 1)
  const endDate = new Date(tahun, bulan, 0, 23, 59, 59, 999)

  try {
    const [revenues, guruUser, payment] = await Promise.all([
      prisma.lessonRevenue.findMany({
        where: {
          lesson: {
            guruId,
            tanggalLes: { gte: startDate, lte: endDate },
          },
        },
        include: {
          lesson: {
            select: {
              id: true,
              tanggalLes: true,
              namaMurid: true,
              jumlahMurid: true,
              jenisPembelajaran: true,
              lokasiMengajar: true,
              jamMulai: true,
              jamSelesai: true,
              biayaPerSiswa: true,
              namaGuru: true,
              whatsappGuru: true,
            },
          },
        },
        orderBy: { lesson: { tanggalLes: 'asc' } },
      }),
      prisma.user.findUnique({
        where: { id: guruId },
        select: { id: true, name: true, phone: true },
      }),
      prisma.teacherPayment.findUnique({
        where: { guruId_bulan_tahun: { guruId, bulan, tahun } },
      }),
    ])

    if (!guruUser) {
      return NextResponse.json({ error: 'Guru tidak ditemukan' }, { status: 404 })
    }

    const totalBiayaLes = revenues.reduce((s, r) => s + r.biayaTotal, 0)
    const totalGajiGuru = revenues.reduce((s, r) => s + r.pendapatanGuru, 0)
    const totalBagianOwner = revenues.reduce((s, r) => s + r.pendapatanOwner, 0)

    return NextResponse.json({
      guru: guruUser,
      revenues,
      summary: {
        bulan,
        tahun,
        jumlahLes: revenues.length,
        totalBiayaLes,
        totalGajiGuru,
        totalBagianOwner,
      },
      payment,
    })
  } catch (err) {
    console.error('Gaji guru [guruId] GET error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ guruId: string }> }
) {
  const user = await getCurrentUser()

  if (!user || user.role !== 'OWNER') {
    return NextResponse.json({ error: 'Hanya Owner yang dapat mengakses fitur ini' }, { status: 403 })
  }

  const { guruId } = await params

  try {
    const body = await request.json()
    const { action, bulan, tahun, totalGaji, notes } = body

    if (!bulan || !tahun) {
      return NextResponse.json({ error: 'Bulan dan tahun harus diisi' }, { status: 400 })
    }

    if (action === 'MARK_PAID') {
      const payment = await prisma.teacherPayment.upsert({
        where: { guruId_bulan_tahun: { guruId, bulan, tahun } },
        create: {
          guruId,
          bulan,
          tahun,
          totalGaji: totalGaji ?? 0,
          isPaid: true,
          paidAt: new Date(),
          notes: notes ?? null,
        },
        update: {
          isPaid: true,
          paidAt: new Date(),
          totalGaji: totalGaji ?? 0,
          notes: notes ?? null,
        },
      })
      return NextResponse.json({ payment, message: 'Gaji berhasil ditandai sebagai sudah dibayar' })
    }

    if (action === 'MARK_UNPAID') {
      const payment = await prisma.teacherPayment.upsert({
        where: { guruId_bulan_tahun: { guruId, bulan, tahun } },
        create: {
          guruId,
          bulan,
          tahun,
          totalGaji: totalGaji ?? 0,
          isPaid: false,
          paidAt: null,
        },
        update: {
          isPaid: false,
          paidAt: null,
        },
      })
      return NextResponse.json({ payment, message: 'Status gaji berhasil direset ke belum dibayar' })
    }

    return NextResponse.json({ error: 'Aksi tidak valid' }, { status: 400 })
  } catch (err) {
    console.error('Gaji guru [guruId] POST error:', err)
    return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 })
  }
}
